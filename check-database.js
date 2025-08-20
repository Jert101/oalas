const { PrismaClient } = require('@prisma/client')

async function checkDatabaseTables() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Checking database tables...')
    
    // Check statuses
    const statuses = await prisma.$queryRaw`SELECT status_id, name FROM statuses ORDER BY status_id`
    console.log('\n📋 Statuses:')
    statuses.forEach(status => {
      console.log(`  ${status.status_id}. ${status.name}`)
    })
    
    // Check users
    const users = await prisma.$queryRaw`SELECT users_id, name, email FROM users`
    console.log(`\n👥 Users: ${users.length}`)
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email})`)
    })
    
    // Check roles
    const roles = await prisma.$queryRaw`SELECT role_id, name FROM roles`
    console.log(`\n👔 Roles: ${roles.length}`)
    roles.forEach(role => {
      console.log(`  ${role.role_id}. ${role.name}`)
    })
    
    // Check departments 
    const departments = await prisma.$queryRaw`SELECT department_id, name FROM departments`
    console.log(`\n🏢 Departments: ${departments.length}`)
    
    // Check leave limits
    const leaveLimits = await prisma.$queryRaw`SELECT COUNT(*) as count FROM leave_limits`
    console.log(`\n📋 Leave Limits: ${leaveLimits[0].count}`)
    
    console.log('\n✅ Database check complete!')
    
  } catch (error) {
    console.error('❌ Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabaseTables()
