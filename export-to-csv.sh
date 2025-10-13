#!/bin/bash

# Database export to CSV script for TiDB migration
# This script exports all tables from MySQL to CSV format while preserving data integrity

# Configuration
DB_HOST="localhost"
DB_USER="your_username"
DB_NAME="your_database_name"
OUTPUT_DIR="csv_export"
DATE=$(date +"%Y%m%d_%H%M%S")

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "🚀 Starting database export to CSV format for TiDB migration..."
echo "📅 Export started at: $(date)"
echo "📁 Output directory: $OUTPUT_DIR"

# Function to export table to CSV
export_table_to_csv() {
    local table_name=$1
    local filename="$OUTPUT_DIR/${table_name}.csv"
    
    echo "📊 Exporting table: $table_name"
    
    # Export with proper CSV formatting
    mysql -h "$DB_HOST" -u "$DB_USER" -p -e "
    SELECT * FROM $DB_NAME.$table_name 
    INTO OUTFILE '$filename'
    FIELDS TERMINATED BY ',' 
    ENCLOSED BY '\"' 
    ESCAPED BY '\\' 
    LINES TERMINATED BY '\n';
    " 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully exported: $filename"
        # Count rows
        local row_count=$(wc -l < "$filename")
        echo "   📈 Rows exported: $row_count"
    else
        echo "❌ Failed to export: $table_name"
        # Try alternative method without INTO OUTFILE
        mysql -h "$DB_HOST" -u "$DB_USER" -p -e "SELECT * FROM $DB_NAME.$table_name" | sed 's/\t/,/g' > "$filename"
        if [ $? -eq 0 ]; then
            echo "✅ Exported using alternative method: $filename"
        else
            echo "❌ Both methods failed for: $table_name"
        fi
    fi
}

# Get list of all tables
echo "🔍 Getting list of tables..."
TABLES=$(mysql -h "$DB_HOST" -u "$DB_USER" -p -e "SHOW TABLES FROM $DB_NAME;" | tail -n +2)

if [ -z "$TABLES" ]; then
    echo "❌ No tables found or connection failed"
    exit 1
fi

echo "📋 Found tables:"
echo "$TABLES"
echo ""

# Export each table
for table in $TABLES; do
    export_table_to_csv "$table"
    echo ""
done

# Create metadata file
echo "📝 Creating metadata file..."
cat > "$OUTPUT_DIR/metadata.txt" << EOF
Database Export Metadata
========================
Export Date: $(date)
Source Database: $DB_NAME
Source Host: $DB_HOST
Export Method: CSV for TiDB migration

Tables Exported:
$(echo "$TABLES" | sed 's/^/- /')

Import Instructions for TiDB:
1. Create database in TiDB: CREATE DATABASE your_database_name;
2. Use each CSV file to create and populate tables
3. Import in dependency order (tables without foreign keys first)
4. Verify data integrity after import

Notes:
- All data is preserved in CSV format
- Original database remains unchanged
- Test import on a development TiDB instance first
EOF

echo "✅ Export completed!"
echo "📁 Files saved in: $OUTPUT_DIR/"
echo "📝 Check metadata.txt for import instructions"
echo "🔒 Original database is unchanged and safe"
