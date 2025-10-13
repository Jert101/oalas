const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

// Create Prisma client
const prisma = new PrismaClient()

// Create output directory
const outputDir = `csv_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
}

console.log('🚀 Starting database export to CSV format for TiDB migration...')
console.log(`📁 Output directory: ${outputDir}`)

// Function to convert data to CSV format
function arrayToCSV(data, headers) {
    if (!data || data.length === 0) {
        return headers.join(',') + '\n'
    }
    
    const csvRows = []
    csvRows.push(headers.join(','))
    
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
    
    return csvRows.join('\n')
}

// Function to export a table to CSV
async function exportTableToCSV(tableName, data, headers) {
    try {
        const csvContent = arrayToCSV(data, headers)
        const filename = path.join(outputDir, `${tableName}.csv`)
        
        fs.writeFileSync(filename, csvContent, 'utf8')
        console.log(`✅ Exported ${tableName}: ${data.length} rows`)
        return { success: true, rows: data.length }
    } catch (error) {
        console.error(`❌ Error exporting ${tableName}:`, error.message)
        return { success: false, rows: 0 }
    }
}

// Main export function
async function exportDatabase() {
    try {
        console.log('🔍 Connecting to database...')
        
        // Export all tables based on your Prisma schema
        const exportResults = {}
        
        // 1. Users table
        console.log('📊 Exporting Users...')
        const users = await prisma.user.findMany()
        if (users.length > 0) {
            const userHeaders = Object.keys(users[0])
            exportResults.users = await exportTableToCSV('users', users, userHeaders)
        } else {
            console.log('⚠️ No users found')
        }
        
        // 2. Roles table
        console.log('📊 Exporting Roles...')
        const roles = await prisma.role.findMany()
        if (roles.length > 0) {
            const roleHeaders = Object.keys(roles[0])
            exportResults.roles = await exportTableToCSV('roles', roles, roleHeaders)
        }
        
        // 3. Status table
        console.log('📊 Exporting Status...')
        const statuses = await prisma.status.findMany()
        if (statuses.length > 0) {
            const statusHeaders = Object.keys(statuses[0])
            exportResults.statuses = await exportTableToCSV('status', statuses, statusHeaders)
        }
        
        // 4. Departments table
        console.log('📊 Exporting Departments...')
        const departments = await prisma.department.findMany()
        if (departments.length > 0) {
            const deptHeaders = Object.keys(departments[0])
            exportResults.departments = await exportTableToCSV('departments', departments, deptHeaders)
        }
        
        // 5. Leave Types table
        console.log('📊 Exporting Leave Types...')
        const leaveTypes = await prisma.leave_types.findMany()
        if (leaveTypes.length > 0) {
            const leaveTypeHeaders = Object.keys(leaveTypes[0])
            exportResults.leave_types = await exportTableToCSV('leave_types', leaveTypes, leaveTypeHeaders)
        }
        
        // 6. Term Types table
        console.log('📊 Exporting Term Types...')
        const termTypes = await prisma.termType.findMany()
        if (termTypes.length > 0) {
            const termTypeHeaders = Object.keys(termTypes[0])
            exportResults.term_types = await exportTableToCSV('term_types', termTypes, termTypeHeaders)
        }
        
        // 7. Calendar Periods table
        console.log('📊 Exporting Calendar Periods...')
        const calendarPeriods = await prisma.calendarPeriod.findMany()
        if (calendarPeriods.length > 0) {
            const periodHeaders = Object.keys(calendarPeriods[0])
            exportResults.calendar_periods = await exportTableToCSV('calendar_periods', calendarPeriods, periodHeaders)
        }
        
        // 8. Leave Limits table
        console.log('📊 Exporting Leave Limits...')
        const leaveLimits = await prisma.leaveLimit.findMany()
        if (leaveLimits.length > 0) {
            const limitHeaders = Object.keys(leaveLimits[0])
            exportResults.leave_limits = await exportTableToCSV('leave_limits', leaveLimits, limitHeaders)
        }
        
        // 9. Leave Balance table
        console.log('📊 Exporting Leave Balances...')
        const leaveBalances = await prisma.leaveBalance.findMany()
        if (leaveBalances.length > 0) {
            const balanceHeaders = Object.keys(leaveBalances[0])
            exportResults.leave_balances = await exportTableToCSV('leave_balances', leaveBalances, balanceHeaders)
        }
        
        // 10. Leave Applications table
        console.log('📊 Exporting Leave Applications...')
        const leaveApplications = await prisma.leaveApplication.findMany()
        if (leaveApplications.length > 0) {
            const appHeaders = Object.keys(leaveApplications[0])
            exportResults.leave_applications = await exportTableToCSV('leave_applications', leaveApplications, appHeaders)
        }
        
        // 11. Travel Orders table
        console.log('📊 Exporting Travel Orders...')
        const travelOrders = await prisma.travelOrder.findMany()
        if (travelOrders.length > 0) {
            const travelHeaders = Object.keys(travelOrders[0])
            exportResults.travel_orders = await exportTableToCSV('travel_orders', travelOrders, travelHeaders)
        }
        
        // 12. Notifications table
        console.log('📊 Exporting Notifications...')
        const notifications = await prisma.notification.findMany()
        if (notifications.length > 0) {
            const notifHeaders = Object.keys(notifications[0])
            exportResults.notifications = await exportTableToCSV('notifications', notifications, notifHeaders)
        }
        
        // Create metadata file
        const metadata = {
            exportDate: new Date().toISOString(),
            totalTables: Object.keys(exportResults).length,
            successfulExports: Object.values(exportResults).filter(r => r.success).length,
            tables: exportResults
        }
        
        fs.writeFileSync(
            path.join(outputDir, 'export_metadata.json'), 
            JSON.stringify(metadata, null, 2)
        )
        
        // Create import instructions
        const instructions = `# TiDB Import Instructions

## Export Summary
- **Export Date:** ${new Date().toLocaleString()}
- **Total Tables:** ${metadata.totalTables}
- **Successful Exports:** ${metadata.successfulExports}

## CSV Files Generated
${Object.entries(exportResults).map(([table, result]) => 
    `- \`${table}.csv\` - ${result.success ? `${result.rows} rows` : 'FAILED'}`
).join('\n')}

## Import Steps for TiDB

1. **Create Database in TiDB:**
   \`\`\`sql
   CREATE DATABASE your_database_name;
   USE your_database_name;
   \`\`\`

2. **Import Tables in Order:**
   Import tables in dependency order (tables without foreign keys first):
   
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

3. **Recommended Import Order:**
   - roles.csv
   - status.csv  
   - departments.csv
   - leave_types.csv
   - term_types.csv
   - users.csv
   - calendar_periods.csv
   - leave_limits.csv
   - leave_balances.csv
   - leave_applications.csv
   - travel_orders.csv
   - notifications.csv

## Important Notes
- ⚠️ **Test on development environment first**
- 🔒 **Original database remains unchanged**
- 📊 **Verify row counts after import**
- 🔗 **Check foreign key constraints**

## Verification Queries
\`\`\`sql
${Object.entries(exportResults).map(([table, result]) => 
    result.success ? `SELECT COUNT(*) FROM ${table}; -- Expected: ${result.rows} rows` : `-- ${table}: Export failed`
).join('\n')}
\`\`\`
`

        fs.writeFileSync(path.join(outputDir, 'IMPORT_INSTRUCTIONS.md'), instructions)
        
        console.log(`\n🎉 Export completed successfully!`)
        console.log(`📁 Files saved in: ${outputDir}/`)
        console.log(`📊 Total tables exported: ${metadata.totalTables}`)
        console.log(`✅ Successful exports: ${metadata.successfulExports}`)
        console.log(`📝 Check IMPORT_INSTRUCTIONS.md for next steps`)
        
    } catch (error) {
        console.error('❌ Error during export:', error)
    } finally {
        await prisma.$disconnect()
    }
}

// Run the export
exportDatabase().catch(console.error)
