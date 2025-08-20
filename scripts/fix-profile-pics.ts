import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixProfilePicturePaths() {
  console.log('Fixing profile picture paths...')
  
  try {
    // Update users who have "ckcm.png" without leading slash
    const result = await prisma.user.updateMany({
      where: {
        profilePicture: 'ckcm.png'
      },
      data: {
        profilePicture: '/ckcm.png'
      }
    })
    
    console.log(`✅ Updated ${result.count} users with default profile picture`)
    
    // Check final state
    const users = await prisma.user.findMany({
      select: {
        email: true,
        profilePicture: true
      }
    })
    
    console.log('\nFinal profile picture paths:')
    users.forEach(user => {
      console.log(`- ${user.email}: "${user.profilePicture}"`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixProfilePicturePaths()
