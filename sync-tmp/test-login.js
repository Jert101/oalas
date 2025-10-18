const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function testLogin() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Testing login functionality...')
    
    // Test finding the admin user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@admin.com' },
      include: {
        role: true,
        department: true,
        status: true
      }
    })
    
    if (!user) {
      console.error('❌ Admin user not found')
      return
    }
    
    console.log(`✅ User found: ${user.name} (${user.email})`)
    console.log(`   Role: ${user.role?.name || 'No role'}`)
    console.log(`   Status: ${user.status?.name || 'No status'}`)
    console.log(`   Active: ${user.isActive}`)
    console.log(`   Email Verified: ${user.isEmailVerified}`)
    
    // Test password verification
    const passwordMatch = await bcrypt.compare('password', user.password || '')
    console.log(`   Password Check: ${passwordMatch ? '✅ Valid' : '❌ Invalid'}`)
    
    if (!user.isActive) {
      console.warn('⚠️ User account is not active')
    }
    
    if (!user.isEmailVerified) {
      console.warn('⚠️ User email is not verified')
    }
    
    console.log('\n🎉 Login test complete!')
    
  } catch (error) {
    console.error('❌ Login test failed:', error)
    console.error('\n💡 This might explain the "Database connection failed" error')
  } finally {
    await prisma.$disconnect()
  }
}

testLogin()
