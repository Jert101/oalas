#!/bin/bash

# Convert MySQL dump to CSV files for TiDB import
# This script takes a SQL dump and converts it to individual CSV files

# Configuration
SQL_DUMP_FILE="database_dump.sql"
OUTPUT_DIR="csv_from_sql"
DATE=$(date +"%Y%m%d_%H%M%S")

echo "🔄 Converting SQL dump to CSV format for TiDB..."
echo "📅 Conversion started at: $(date)"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Function to extract INSERT statements and convert to CSV
extract_table_to_csv() {
    local table_name=$1
    local csv_file="$OUTPUT_DIR/${table_name}.csv"
    
    echo "📊 Processing table: $table_name"
    
    # Extract INSERT statements for this table
    grep -i "INSERT INTO.*${table_name}" "$SQL_DUMP_FILE" > "${table_name}_inserts.sql"
    
    if [ -s "${table_name}_inserts.sql" ]; then
        # Convert INSERT statements to CSV format
        python3 -c "
import re
import csv

# Read the INSERT statements
with open('${table_name}_inserts.sql', 'r') as f:
    content = f.read()

# Extract values from INSERT statements
pattern = r'INSERT INTO.*?VALUES\s*(.*?);'
matches = re.findall(pattern, content, re.DOTALL | re.IGNORECASE)

if matches:
    # Parse the first INSERT to get column names (simplified)
    # This is a basic parser - you might need to enhance it for complex cases
    
    # Write CSV
    with open('$csv_file', 'w', newline='') as csvfile:
        writer = csv.writer(csvfile, quoting=csv.QUOTE_ALL)
        
        for match in matches:
            # Parse values (this is simplified - you might need a more robust parser)
            # Remove parentheses and split by comma (being careful about quoted strings)
            values = match.strip()
            if values.startswith('(') and values.endswith(')'):
                values = values[1:-1]
            
            # Split values (this is a basic split - enhance for complex data)
            row_values = []
            current_value = ''
            in_quotes = False
            quote_char = None
            
            i = 0
            while i < len(values):
                char = values[i]
                
                if not in_quotes and (char == \"'\" or char == '\"'):
                    in_quotes = True
                    quote_char = char
                    current_value += char
                elif in_quotes and char == quote_char:
                    # Check for escaped quotes
                    if i + 1 < len(values) and values[i + 1] == quote_char:
                        current_value += char + char
                        i += 1
                    else:
                        in_quotes = False
                        quote_char = None
                        current_value += char
                elif not in_quotes and char == ',':
                    row_values.append(current_value.strip())
                    current_value = ''
                else:
                    current_value += char
                
                i += 1
            
            if current_value:
                row_values.append(current_value.strip())
            
            # Clean up values (remove quotes and handle NULL)
            cleaned_values = []
            for value in row_values:
                value = value.strip()
                if value.upper() == 'NULL':
                    cleaned_values.append('')
                elif value.startswith(\"'\") and value.endswith(\"'\"):
                    cleaned_values.append(value[1:-1])
                elif value.startswith('\"') and value.endswith('\"'):
                    cleaned_values.append(value[1:-1])
                else:
                    cleaned_values.append(value)
            
            writer.writerow(cleaned_values)
        
        print(f'✅ Converted {len(matches)} INSERT statements to CSV')
else:
    print('❌ No INSERT statements found for ${table_name}')
" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            local row_count=$(wc -l < "$csv_file")
            echo "✅ Successfully converted: $csv_file ($row_count rows)"
        else
            echo "❌ Failed to convert: $table_name"
        fi
    else
        echo "❌ No data found for table: $table_name"
    fi
    
    # Clean up temporary file
    rm -f "${table_name}_inserts.sql"
}

# Get list of tables from the SQL dump
echo "🔍 Extracting table names from SQL dump..."
TABLES=$(grep -i "CREATE TABLE" "$SQL_DUMP_FILE" | sed -n 's/.*CREATE TABLE.*`\([^`]*\)`.*/\1/p')

if [ -z "$TABLES" ]; then
    echo "❌ No tables found in SQL dump"
    exit 1
fi

echo "📋 Found tables:"
echo "$TABLES"
echo ""

# Process each table
for table in $TABLES; do
    extract_table_to_csv "$table"
    echo ""
done

# Create summary
echo "📝 Creating conversion summary..."
cat > "$OUTPUT_DIR/conversion_summary.txt" << EOF
SQL to CSV Conversion Summary
============================
Conversion Date: $(date)
Source File: $SQL_DUMP_FILE
Output Directory: $OUTPUT_DIR

Tables Processed:
$(echo "$TABLES" | sed 's/^/- /')

Notes:
- Original SQL dump file is unchanged
- CSV files are ready for TiDB import
- Verify data integrity before importing to production
EOF

echo "✅ Conversion completed!"
echo "📁 CSV files saved in: $OUTPUT_DIR/"
echo "📝 Check conversion_summary.txt for details"
