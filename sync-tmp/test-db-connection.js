const { PrismaClient } = require('@prisma/client')

async function testDatabaseConnection() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Testing database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Test a simple query
    const users = await prisma.$queryRaw`SELECT COUNT(*) as count FROM users`
    console.log(`✅ Query test successful - Users count: ${users[0].count}`)
    
    // Test authentication by trying to find a user
    const adminUser = await prisma.$queryRaw`
      SELECT users_id, email, name 
      FROM users 
      WHERE email = 'admin@admin.com' 
      LIMIT 1
    `
    
    if (adminUser.length > 0) {
      console.log('✅ Admin user found:', adminUser[0].email)
    } else {
      console.log('⚠️ Admin user not found')
    }
    
    console.log('\n🎉 Database connection is working!')
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    console.error('💡 Possible issues:')
    console.error('  - XAMPP MySQL is not running')
    console.error('  - Database "oalass" does not exist')
    console.error('  - Wrong credentials in .env file')
    console.error('  - Prisma client out of sync')
  } finally {
    await prisma.$disconnect()
  }
}

testDatabaseConnection()
