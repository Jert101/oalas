import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabase() {
  console.log('Testing database connection...')
  
  try {
    // Test basic connection
    const userCount = await prisma.user.count()
    console.log(`✓ Database connected. Total users: ${userCount}`)
    
    // Test user lookup with the migrated IDs
    const testUsers = await prisma.user.findMany({
      select: {
        users_id: true,
        email: true,
        name: true,
        password: true,
        isActive: true,
        lockUntil: true,
        loginAttempts: true
      },
      take: 3
    })
    
    console.log('\nSample users:')
    testUsers.forEach(user => {
      console.log(`- ${user.email} (ID: ${user.users_id}) - Active: ${user.isActive}, Attempts: ${user.loginAttempts}`)
    })
    
    // Test specific user lookup (admin)
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@admin.com' },
      include: {
        role: true
      }
    })
    
    if (adminUser) {
      console.log(`\nAdmin user found:`)
      console.log(`- ID: ${adminUser.users_id}`)
      console.log(`- Email: ${adminUser.email}`)
      console.log(`- Has Password: ${!!adminUser.password}`)
      console.log(`- Is Active: ${adminUser.isActive}`)
      console.log(`- Login Attempts: ${adminUser.loginAttempts}`)
      console.log(`- Lock Until: ${adminUser.lockUntil}`)
      console.log(`- Role: ${adminUser.role?.name || 'No role'}`)
    } else {
      console.log('\n❌ Admin user not found!')
    }
    
  } catch (error) {
    console.error('Database test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()
