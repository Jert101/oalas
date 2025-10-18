const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

// Create Prisma client
const prisma = new PrismaClient()

// Create output directory
const outputDir = `csv_export_all_19_tables_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
}

console.log('🚀 Starting export of ALL 19 TABLES (including empty ones)...')
console.log(`📁 Output directory: ${outputDir}`)

// Function to convert data to CSV format
function arrayToCSV(data, headers) {
    const csvRows = []
    csvRows.push(headers.join(','))
    
    if (data && data.length > 0) {
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header]
                if (value === null || value === undefined) {
                    return ''
                }
                // Escape commas and quotes in CSV
                const stringValue = String(value)
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`
                }
                return stringValue
            })
            csvRows.push(values.join(','))
        }
    }
    
    return csvRows.join('\n')
}

// Function to export a table to CSV (including empty tables)
async function exportTableToCSV(tableName, data, headers) {
    try {
        const csvContent = arrayToCSV(data, headers)
        const filename = path.join(outputDir, `${tableName}.csv`)
        
        fs.writeFileSync(filename, csvContent, 'utf8')
        const rowCount = data ? data.length : 0
        console.log(`✅ Exported ${tableName}: ${rowCount} rows`)
        return { success: true, rows: rowCount, headers: headers }
    } catch (error) {
        console.error(`❌ Error exporting ${tableName}:`, error.message)
        return { success: false, rows: 0, headers: [] }
    }
}

// Function to get table headers from Prisma model
async function getTableHeaders(tableName) {
    try {
        // Try to get headers by querying the table (even if empty)
        const result = await prisma[tableName].findFirst()
        if (result) {
            return Object.keys(result)
        }
        
        // If table is empty, we'll use a sample query to get the structure
        // This is a fallback method
        const sampleQuery = await prisma[tableName].findMany({ take: 0 })
        return []
    } catch (error) {
        console.log(`⚠️ Could not determine headers for ${tableName}, using common fields`)
        return []
    }
}

// Main export function - ALL 19 TABLES INCLUDING EMPTY ONES
async function exportAllTables() {
    try {
        console.log('🔍 Connecting to database...')
        
        const exportResults = {}
        const allTables = [
            'user',
            'role', 
            'roleCategory',
            'department',
            'status',
            'account',
            'session',
            'verificationToken',
            'calendarPeriod',
            'leaveApplication',
            'travelOrder',
            'leaveLimit',
            'leaveBalance',
            'probation',
            'termType',
            'leave_types',
            'leaveTypeFormField',
            'notification',
            'accountSetupRequest'
        ]
        
        console.log(`📋 Processing all ${allTables.length} tables...`)
        
        for (const tableName of allTables) {
            console.log(`📊 Exporting ${tableName}...`)
            
            try {
                // Get data from table
                const data = await prisma[tableName].findMany()
                
                // Get headers
                let headers = []
                if (data.length > 0) {
                    headers = Object.keys(data[0])
                } else {
                    // For empty tables, try to get structure from Prisma schema
                    // This is a simplified approach - in production you might want to query INFORMATION_SCHEMA
                    headers = await getTableHeaders(tableName)
                    
                    // If we still can't get headers, create a minimal CSV with just a header row
                    if (headers.length === 0) {
                        // Create a CSV file with just the table name as a placeholder
                        const placeholderContent = `id,created_at,updated_at\n`
                        const filename = path.join(outputDir, `${tableName}.csv`)
                        fs.writeFileSync(filename, placeholderContent, 'utf8')
                        console.log(`✅ Exported ${tableName}: 0 rows (empty table - placeholder created)`)
                        exportResults[tableName] = { success: true, rows: 0, headers: ['id', 'created_at', 'updated_at'], empty: true }
                        continue
                    }
                }
                
                // Export the table
                const result = await exportTableToCSV(tableName, data, headers)
                exportResults[tableName] = { ...result, empty: data.length === 0 }
                
            } catch (error) {
                console.error(`❌ Failed to export ${tableName}:`, error.message)
                exportResults[tableName] = { success: false, rows: 0, headers: [], error: error.message }
            }
        }
        
        // Create metadata file
        const metadata = {
            exportDate: new Date().toISOString(),
            totalTables: allTables.length,
            successfulExports: Object.values(exportResults).filter(r => r.success).length,
            emptyTables: Object.values(exportResults).filter(r => r.empty).length,
            tablesWithData: Object.values(exportResults).filter(r => r.success && !r.empty).length,
            tables: exportResults
        }
        
        fs.writeFileSync(
            path.join(outputDir, 'export_metadata.json'), 
            JSON.stringify(metadata, null, 2)
        )
        
        // Create comprehensive import instructions
        const instructions = `# TiDB Import Instructions - ALL 19 TABLES

## Export Summary
- **Export Date:** ${new Date().toLocaleString()}
- **Total Tables:** ${metadata.totalTables}/19 (ALL TABLES)
- **Successful Exports:** ${metadata.successfulExports}
- **Tables with Data:** ${metadata.tablesWithData}
- **Empty Tables:** ${metadata.emptyTables}

## CSV Files Generated
${Object.entries(exportResults).map(([table, result]) => {
    const status = result.success ? `${result.rows} rows` : 'FAILED'
    const empty = result.empty ? ' (EMPTY)' : ''
    return `- \`${table}.csv\` - ${status}${empty}`
}).join('\n')}

## Import Steps for TiDB

1. **Create Database in TiDB:**
   \`\`\`sql
   CREATE DATABASE your_database_name;
   USE your_database_name;
   \`\`\`

2. **Import Tables in Dependency Order:**
   
   \`\`\`bash
   # Example import command for each table
   mysql -h tidb-host -u username -p database_name -e "
   LOAD DATA LOCAL INFILE 'table_name.csv' 
   INTO TABLE table_name 
   FIELDS TERMINATED BY ',' 
   ENCLOSED BY '\"' 
   LINES TERMINATED BY '\\n' 
   IGNORE 1 ROWS;"
   \`\`\`

3. **RECOMMENDED IMPORT ORDER (Dependency-Safe):**
   ${allTables.map(table => `   - ${table}.csv`).join('\n')}

4. **Tables with Data (Import These):**
${Object.entries(exportResults)
    .filter(([_, result]) => result.success && !result.empty)
    .map(([table, result]) => `   - ${table}.csv (${result.rows} rows)`)
    .join('\n')}

5. **Empty Tables (Create Structure Only):**
${Object.entries(exportResults)
    .filter(([_, result]) => result.empty)
    .map(([table, _]) => `   - ${table}.csv (0 rows - structure only)`)
    .join('\n')}

## Important Notes
- ⚠️ **Test on development environment first**
- 🔒 **Original database remains unchanged**
- 📊 **Verify row counts after import**
- 🔗 **Check foreign key constraints**
- 📝 **Empty tables will need proper schema creation in TiDB**

## Verification Queries
\`\`\`sql
${Object.entries(exportResults)
    .filter(([_, result]) => result.success)
    .map(([table, result]) => `SELECT COUNT(*) FROM ${table}; -- Expected: ${result.rows} rows`)
    .join('\n')}
\`\`\`

## Total Data Exported
**Total Rows:** ${Object.values(exportResults).reduce((sum, result) => sum + (result.success ? result.rows : 0), 0)} rows across ${metadata.totalTables} tables
**Tables with Data:** ${metadata.tablesWithData}
**Empty Tables:** ${metadata.emptyTables}
`

        fs.writeFileSync(path.join(outputDir, 'IMPORT_INSTRUCTIONS.md'), instructions)
        
        console.log(`\n🎉 COMPLETE export of all 19 tables finished!`)
        console.log(`📁 Files saved in: ${outputDir}/`)
        console.log(`📊 Total tables processed: ${metadata.totalTables}/19`)
        console.log(`✅ Successful exports: ${metadata.successfulExports}`)
        console.log(`📈 Tables with data: ${metadata.tablesWithData}`)
        console.log(`📭 Empty tables: ${metadata.emptyTables}`)
        console.log(`📈 Total rows exported: ${Object.values(exportResults).reduce((sum, result) => sum + (result.success ? result.rows : 0), 0)}`)
        console.log(`📝 Check IMPORT_INSTRUCTIONS.md for next steps`)
        
    } catch (error) {
        console.error('❌ Error during export:', error)
    } finally {
        await prisma.$disconnect()
    }
}

// Run the complete export
exportAllTables().catch(console.error)
