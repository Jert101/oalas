const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testProfilePicture() {
  try {
    console.log('🔍 Testing Profile Picture Storage...')
    
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: 'jersoncatadman@ckcm.edu.ph' },
      select: {
        users_id: true,
        email: true,
        name: true,
        profilePicture: true,
        role_id: true,
        department_id: true,
        createdAt: true
      }
    })
    
    if (user) {
      console.log('✅ User found in database:')
      console.log('  - User ID:', user.users_id)
      console.log('  - Email:', user.email)
      console.log('  - Name:', user.name)
      console.log('  - Profile Picture:', user.profilePicture)
      console.log('  - Has Profile Picture:', !!user.profilePicture)
      console.log('  - Profile Picture Length:', user.profilePicture ? user.profilePicture.length : 0)
      console.log('  - Role ID:', user.role_id)
      console.log('  - Department ID:', user.department_id)
      console.log('  - Created At:', user.createdAt)
      
      // Check if profile picture is a valid URL
      if (user.profilePicture) {
        try {
          const url = new URL(user.profilePicture)
          console.log('  - Profile Picture is valid URL:', url.href)
        } catch (e) {
          console.log('  - Profile Picture is NOT a valid URL:', user.profilePicture)
        }
      }
    } else {
      console.log('❌ User not found in database')
    }
    
    // Check all users to see profile picture status
    const allUsers = await prisma.user.findMany({
      select: {
        users_id: true,
        email: true,
        name: true,
        profilePicture: true
      }
    })
    
    console.log('\n📊 All Users Profile Picture Status:')
    allUsers.forEach(u => {
      console.log(`  - ${u.email} (${u.name}): ${u.profilePicture ? '✅ Has Picture' : '❌ No Picture'}`)
      if (u.profilePicture) {
        console.log(`    URL: ${u.profilePicture}`)
      }
    })
    
  } catch (error) {
    console.error('❌ Error testing profile picture:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testProfilePicture()






