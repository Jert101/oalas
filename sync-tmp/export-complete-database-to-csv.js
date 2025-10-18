const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

// Create Prisma client
const prisma = new PrismaClient()

// Create output directory
const outputDir = `csv_export_complete_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
}

console.log('🚀 Starting COMPLETE database export to CSV format for TiDB migration...')
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

// Main export function - ALL 19 TABLES
async function exportCompleteDatabase() {
    try {
        console.log('🔍 Connecting to database...')
        
        const exportResults = {}
        
        // 1. User table
        console.log('📊 Exporting User...')
        const users = await prisma.user.findMany()
        if (users.length > 0) {
            const userHeaders = Object.keys(users[0])
            exportResults.user = await exportTableToCSV('user', users, userHeaders)
        }
        
        // 2. Role table
        console.log('📊 Exporting Role...')
        const roles = await prisma.role.findMany()
        if (roles.length > 0) {
            const roleHeaders = Object.keys(roles[0])
            exportResults.role = await exportTableToCSV('role', roles, roleHeaders)
        }
        
        // 3. RoleCategory table
        console.log('📊 Exporting RoleCategory...')
        const roleCategories = await prisma.roleCategory.findMany()
        if (roleCategories.length > 0) {
            const roleCategoryHeaders = Object.keys(roleCategories[0])
            exportResults.roleCategory = await exportTableToCSV('roleCategory', roleCategories, roleCategoryHeaders)
        }
        
        // 4. Department table
        console.log('📊 Exporting Department...')
        const departments = await prisma.department.findMany()
        if (departments.length > 0) {
            const departmentHeaders = Object.keys(departments[0])
            exportResults.department = await exportTableToCSV('department', departments, departmentHeaders)
        }
        
        // 5. Status table
        console.log('📊 Exporting Status...')
        const statuses = await prisma.status.findMany()
        if (statuses.length > 0) {
            const statusHeaders = Object.keys(statuses[0])
            exportResults.status = await exportTableToCSV('status', statuses, statusHeaders)
        }
        
        // 6. Account table
        console.log('📊 Exporting Account...')
        const accounts = await prisma.account.findMany()
        if (accounts.length > 0) {
            const accountHeaders = Object.keys(accounts[0])
            exportResults.account = await exportTableToCSV('account', accounts, accountHeaders)
        }
        
        // 7. Session table
        console.log('📊 Exporting Session...')
        const sessions = await prisma.session.findMany()
        if (sessions.length > 0) {
            const sessionHeaders = Object.keys(sessions[0])
            exportResults.session = await exportTableToCSV('session', sessions, sessionHeaders)
        }
        
        // 8. VerificationToken table
        console.log('📊 Exporting VerificationToken...')
        const verificationTokens = await prisma.verificationToken.findMany()
        if (verificationTokens.length > 0) {
            const verificationTokenHeaders = Object.keys(verificationTokens[0])
            exportResults.verificationToken = await exportTableToCSV('verificationToken', verificationTokens, verificationTokenHeaders)
        }
        
        // 9. CalendarPeriod table
        console.log('📊 Exporting CalendarPeriod...')
        const calendarPeriods = await prisma.calendarPeriod.findMany()
        if (calendarPeriods.length > 0) {
            const calendarPeriodHeaders = Object.keys(calendarPeriods[0])
            exportResults.calendarPeriod = await exportTableToCSV('calendarPeriod', calendarPeriods, calendarPeriodHeaders)
        }
        
        // 10. LeaveApplication table
        console.log('📊 Exporting LeaveApplication...')
        const leaveApplications = await prisma.leaveApplication.findMany()
        if (leaveApplications.length > 0) {
            const leaveApplicationHeaders = Object.keys(leaveApplications[0])
            exportResults.leaveApplication = await exportTableToCSV('leaveApplication', leaveApplications, leaveApplicationHeaders)
        }
        
        // 11. TravelOrder table
        console.log('📊 Exporting TravelOrder...')
        const travelOrders = await prisma.travelOrder.findMany()
        if (travelOrders.length > 0) {
            const travelOrderHeaders = Object.keys(travelOrders[0])
            exportResults.travelOrder = await exportTableToCSV('travelOrder', travelOrders, travelOrderHeaders)
        }
        
        // 12. LeaveLimit table
        console.log('📊 Exporting LeaveLimit...')
        const leaveLimits = await prisma.leaveLimit.findMany()
        if (leaveLimits.length > 0) {
            const leaveLimitHeaders = Object.keys(leaveLimits[0])
            exportResults.leaveLimit = await exportTableToCSV('leaveLimit', leaveLimits, leaveLimitHeaders)
        }
        
        // 13. LeaveBalance table
        console.log('📊 Exporting LeaveBalance...')
        const leaveBalances = await prisma.leaveBalance.findMany()
        if (leaveBalances.length > 0) {
            const leaveBalanceHeaders = Object.keys(leaveBalances[0])
            exportResults.leaveBalance = await exportTableToCSV('leaveBalance', leaveBalances, leaveBalanceHeaders)
        }
        
        // 14. Probation table
        console.log('📊 Exporting Probation...')
        const probations = await prisma.probation.findMany()
        if (probations.length > 0) {
            const probationHeaders = Object.keys(probations[0])
            exportResults.probation = await exportTableToCSV('probation', probations, probationHeaders)
        }
        
        // 15. TermType table
        console.log('📊 Exporting TermType...')
        const termTypes = await prisma.termType.findMany()
        if (termTypes.length > 0) {
            const termTypeHeaders = Object.keys(termTypes[0])
            exportResults.termType = await exportTableToCSV('termType', termTypes, termTypeHeaders)
        }
        
        // 16. leave_types table (lowercase)
        console.log('📊 Exporting leave_types...')
        const leave_types = await prisma.leave_types.findMany()
        if (leave_types.length > 0) {
            const leaveTypesHeaders = Object.keys(leave_types[0])
            exportResults.leave_types = await exportTableToCSV('leave_types', leave_types, leaveTypesHeaders)
        }
        
        // 17. LeaveTypeFormField table
        console.log('📊 Exporting LeaveTypeFormField...')
        const leaveTypeFormFields = await prisma.leaveTypeFormField.findMany()
        if (leaveTypeFormFields.length > 0) {
            const leaveTypeFormFieldHeaders = Object.keys(leaveTypeFormFields[0])
            exportResults.leaveTypeFormField = await exportTableToCSV('leaveTypeFormField', leaveTypeFormFields, leaveTypeFormFieldHeaders)
        }
        
        // 18. Notification table
        console.log('📊 Exporting Notification...')
        const notifications = await prisma.notification.findMany()
        if (notifications.length > 0) {
            const notificationHeaders = Object.keys(notifications[0])
            exportResults.notification = await exportTableToCSV('notification', notifications, notificationHeaders)
        }
        
        // 19. AccountSetupRequest table
        console.log('📊 Exporting AccountSetupRequest...')
        const accountSetupRequests = await prisma.accountSetupRequest.findMany()
        if (accountSetupRequests.length > 0) {
            const accountSetupRequestHeaders = Object.keys(accountSetupRequests[0])
            exportResults.accountSetupRequest = await exportTableToCSV('accountSetupRequest', accountSetupRequests, accountSetupRequestHeaders)
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
        const instructions = `# TiDB Import Instructions - COMPLETE DATABASE

## Export Summary
- **Export Date:** ${new Date().toLocaleString()}
- **Total Tables:** ${metadata.totalTables} (ALL 19 TABLES)
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

2. **Import Tables in Dependency Order:**
   Import tables in this order to respect foreign key constraints:
   
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
   - roleCategory.csv (no dependencies)
   - role.csv (depends on roleCategory)
   - status.csv (no dependencies)
   - department.csv (no dependencies)
   - termType.csv (no dependencies)
   - leave_types.csv (no dependencies)
   - user.csv (depends on role, department, status)
   - account.csv (depends on user)
   - session.csv (depends on user)
   - verificationToken.csv (depends on user)
   - calendarPeriod.csv (depends on termType)
   - leaveTypeFormField.csv (depends on leave_types)
   - leaveLimit.csv (depends on status, termType, leave_types)
   - leaveBalance.csv (depends on user, calendarPeriod, termType, leave_types, status)
   - leaveApplication.csv (depends on user, leave_types, calendarPeriod)
   - travelOrder.csv (depends on user, calendarPeriod)
   - probation.csv (depends on user)
   - notification.csv (depends on user)
   - accountSetupRequest.csv (depends on user)

## Important Notes
- ⚠️ **Test on development environment first**
- 🔒 **Original database remains unchanged**
- 📊 **Verify row counts after import**
- 🔗 **Check foreign key constraints**
- 📝 **Import in the exact order listed above**

## Verification Queries
\`\`\`sql
${Object.entries(exportResults).map(([table, result]) => 
    result.success ? `SELECT COUNT(*) FROM ${table}; -- Expected: ${result.rows} rows` : `-- ${table}: Export failed`
).join('\n')}
\`\`\`

## Total Data Exported
**Total Rows:** ${Object.values(exportResults).reduce((sum, result) => sum + (result.success ? result.rows : 0), 0)} rows across ${metadata.totalTables} tables
`

        fs.writeFileSync(path.join(outputDir, 'IMPORT_INSTRUCTIONS.md'), instructions)
        
        console.log(`\n🎉 COMPLETE export finished successfully!`)
        console.log(`📁 Files saved in: ${outputDir}/`)
        console.log(`📊 Total tables exported: ${metadata.totalTables}/19`)
        console.log(`✅ Successful exports: ${metadata.successfulExports}`)
        console.log(`📈 Total rows exported: ${Object.values(exportResults).reduce((sum, result) => sum + (result.success ? result.rows : 0), 0)}`)
        console.log(`📝 Check IMPORT_INSTRUCTIONS.md for next steps`)
        
    } catch (error) {
        console.error('❌ Error during export:', error)
    } finally {
        await prisma.$disconnect()
    }
}

// Run the complete export
exportCompleteDatabase().catch(console.error)
