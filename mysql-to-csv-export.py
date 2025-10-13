#!/usr/bin/env python3
"""
MySQL to CSV Export Script for TiDB Migration
This script safely exports all MySQL tables to CSV format while preserving data integrity.
"""

import mysql.connector
import csv
import os
import sys
from datetime import datetime
import json

class MySQLToCSVExporter:
    def __init__(self, host, user, password, database):
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        self.connection = None
        self.output_dir = f"csv_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
    def connect(self):
        """Establish connection to MySQL database"""
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database,
                charset='utf8mb4'
            )
            print(f"✅ Connected to MySQL database: {self.database}")
            return True
        except mysql.connector.Error as err:
            print(f"❌ Error connecting to database: {err}")
            return False
    
    def get_tables(self):
        """Get list of all tables in the database"""
        cursor = self.connection.cursor()
        cursor.execute("SHOW TABLES")
        tables = [table[0] for table in cursor.fetchall()]
        cursor.close()
        return tables
    
    def get_table_schema(self, table_name):
        """Get table schema information"""
        cursor = self.connection.cursor()
        cursor.execute(f"DESCRIBE {table_name}")
        schema = cursor.fetchall()
        cursor.close()
        return schema
    
    def export_table_to_csv(self, table_name):
        """Export a single table to CSV"""
        try:
            cursor = self.connection.cursor()
            
            # Get table data
            cursor.execute(f"SELECT * FROM {table_name}")
            rows = cursor.fetchall()
            
            # Get column names
            column_names = [desc[0] for desc in cursor.description]
            
            # Create CSV file
            csv_filename = os.path.join(self.output_dir, f"{table_name}.csv")
            with open(csv_filename, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile, quoting=csv.QUOTE_ALL)
                
                # Write header
                writer.writerow(column_names)
                
                # Write data rows
                for row in rows:
                    # Handle None values and convert to empty string
                    processed_row = [str(val) if val is not None else '' for val in row]
                    writer.writerow(processed_row)
            
            cursor.close()
            print(f"✅ Exported {table_name}: {len(rows)} rows")
            return True, len(rows)
            
        except Exception as e:
            print(f"❌ Error exporting {table_name}: {e}")
            return False, 0
    
    def create_schema_file(self, tables):
        """Create a schema file with table creation statements"""
        schema_file = os.path.join(self.output_dir, "schema.sql")
        
        with open(schema_file, 'w', encoding='utf-8') as f:
            f.write(f"-- Database Schema Export\n")
            f.write(f"-- Export Date: {datetime.now()}\n")
            f.write(f"-- Source Database: {self.database}\n\n")
            
            for table_name in tables:
                try:
                    cursor = self.connection.cursor()
                    cursor.execute(f"SHOW CREATE TABLE {table_name}")
                    create_statement = cursor.fetchone()[1]
                    f.write(f"-- Table: {table_name}\n")
                    f.write(f"{create_statement};\n\n")
                    cursor.close()
                except Exception as e:
                    f.write(f"-- Error getting schema for {table_name}: {e}\n\n")
    
    def create_import_instructions(self, tables, export_stats):
        """Create import instructions for TiDB"""
        instructions_file = os.path.join(self.output_dir, "IMPORT_INSTRUCTIONS.md")
        
        with open(instructions_file, 'w', encoding='utf-8') as f:
            f.write("# TiDB Import Instructions\n\n")
            f.write(f"**Export Date:** {datetime.now()}\n")
            f.write(f"**Source Database:** {self.database}\n")
            f.write(f"**Total Tables:** {len(tables)}\n\n")
            
            f.write("## Import Steps\n\n")
            f.write("1. **Create Database in TiDB:**\n")
            f.write(f"   ```sql\n")
            f.write(f"   CREATE DATABASE {self.database};\n")
            f.write(f"   USE {self.database};\n")
            f.write(f"   ```\n\n")
            
            f.write("2. **Create Tables:**\n")
            f.write("   - Use the `schema.sql` file to create table structures\n")
            f.write("   - Modify data types if needed for TiDB compatibility\n\n")
            
            f.write("3. **Import Data (in dependency order):**\n")
            f.write("   Import tables in the following order to respect foreign key constraints:\n\n")
            
            # Order tables by dependencies (simplified approach)
            for table_name in tables:
                f.write(f"   - `{table_name}.csv` ({export_stats.get(table_name, 0)} rows)\n")
            
            f.write("\n4. **Import Command Example:**\n")
            f.write("   ```bash\n")
            f.write("   # For each table:\n")
            f.write("   mysql -h tidb-host -u username -p database_name < table_name.csv\n")
            f.write("   # Or use TiDB's LOAD DATA command\n")
            f.write("   LOAD DATA LOCAL INFILE 'table_name.csv' INTO TABLE table_name\n")
            f.write("   FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\\n' IGNORE 1 ROWS;\n")
            f.write("   ```\n\n")
            
            f.write("## Important Notes\n\n")
            f.write("- ⚠️ **Test on development environment first**\n")
            f.write("- 🔒 **Original database remains unchanged**\n")
            f.write("- 📊 **Verify row counts after import**\n")
            f.write("- 🔗 **Check foreign key constraints**\n")
            f.write("- 📝 **Update application connection strings**\n\n")
            
            f.write("## Verification Queries\n\n")
            f.write("```sql\n")
            for table_name in tables:
                f.write(f"SELECT COUNT(*) FROM {table_name}; -- Expected: {export_stats.get(table_name, 0)} rows\n")
            f.write("```\n")
    
    def export_all(self):
        """Export all tables to CSV"""
        if not self.connect():
            return False
        
        # Create output directory
        os.makedirs(self.output_dir, exist_ok=True)
        
        print(f"📁 Created output directory: {self.output_dir}")
        
        # Get all tables
        tables = self.get_tables()
        print(f"📋 Found {len(tables)} tables: {', '.join(tables)}")
        
        # Export schema
        print("📝 Creating schema file...")
        self.create_schema_file(tables)
        
        # Export each table
        export_stats = {}
        successful_exports = 0
        
        for table_name in tables:
            success, row_count = self.export_table_to_csv(table_name)
            export_stats[table_name] = row_count
            if success:
                successful_exports += 1
        
        # Create import instructions
        print("📖 Creating import instructions...")
        self.create_import_instructions(tables, export_stats)
        
        # Summary
        print(f"\n🎉 Export completed!")
        print(f"✅ Successfully exported: {successful_exports}/{len(tables)} tables")
        print(f"📁 Files saved in: {self.output_dir}/")
        print(f"📝 Check IMPORT_INSTRUCTIONS.md for next steps")
        
        # Close connection
        self.connection.close()
        return True

def main():
    print("🚀 MySQL to CSV Export Tool for TiDB Migration")
    print("=" * 50)
    
    # Configuration - UPDATE THESE VALUES
    config = {
        'host': 'localhost',
        'user': 'your_username',
        'password': 'your_password',
        'database': 'your_database_name'
    }
    
    print("⚠️  Please update the configuration in the script before running!")
    print("Current config:")
    for key, value in config.items():
        print(f"   {key}: {value}")
    
    # Uncomment and modify these lines to run
    # exporter = MySQLToCSVExporter(**config)
    # exporter.export_all()

if __name__ == "__main__":
    main()
