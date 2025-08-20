const { PrismaClient } = require('@prisma/client')

async function testDirectLogin() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Testing direct login flow...')
    
    // Simulate the exact flow that NextAuth uses
    const user = await prisma.user.findUnique({
      where: { email: 'admin@admin.com' },
      include: {
        role: true,
        department: true,
        status: true
      }
    })
    
    if (!user) {
      console.error('❌ User not found')
      return
    }
    
    console.log(`✅ User found: ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role?.name}`)
    console.log(`   Active: ${user.isActive}`)
    console.log(`   Email Verified: ${user.isEmailVerified}`)
    
    // Test the exact authentication return object
    const authResult = {
      id: user.users_id,
      email: user.email,
      name: user.name,
      role: user.role?.name || "Guest",
      isEmailVerified: user.isEmailVerified,
      profilePicture: user.profilePicture?.startsWith('/') 
        ? user.profilePicture 
        : `/${user.profilePicture || 'ckcm.png'}`,
    }
    
    console.log('\n📦 Auth result object:')
    console.log(JSON.stringify(authResult, null, 2))
    
    // Test session creation
    const sessionData = {
      user: {
        id: authResult.id,
        role: authResult.role,
        isEmailVerified: authResult.isEmailVerified,
        profilePicture: authResult.profilePicture
      }
    }
    
    console.log('\n🎯 Session data:')
    console.log(JSON.stringify(sessionData, null, 2))
    
    console.log(`\n🚀 Expected redirect: ${sessionData.user.role === "Admin" ? "/admin/console" : "/dashboard"}`)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDirectLogin()
