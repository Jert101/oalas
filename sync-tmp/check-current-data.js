const { PrismaClient } = require('@prisma/client')

async function checkCurrentData() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Checking current database content...')
    
    // Check users
    const users = await prisma.user.findMany({
      include: {
        role: true,
        department: true,
        status: true
      }
    })
    console.log(`👥 Users in database: ${users.length}`)
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role?.roleName || 'N/A'} - Status: ${user.status?.statusName || 'N/A'}`)
    })
    
    // Check leave limits
    const leaveLimits = await prisma.leaveLimit.findMany({
      include: {
        status: true
      }
    })
    console.log(`\n📋 Leave Limits in database: ${leaveLimits.length}`)
    leaveLimits.forEach(limit => {
      console.log(`  - ${limit.status?.statusName || 'N/A'}: ${limit.allowedDays} days`)
    })
    
    // Check other important data
    const roles = await prisma.role.findMany()
    const departments = await prisma.department.findMany()
    const statuses = await prisma.status.findMany()
    
    console.log(`\n📊 System Data:`)
    console.log(`  - Roles: ${roles.length}`)
    console.log(`  - Departments: ${departments.length}`)
    console.log(`  - Statuses: ${statuses.length}`)
    
    console.log(`\n✅ Current data check complete`)
    
  } catch (error) {
    console.error('❌ Error checking data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCurrentData()
