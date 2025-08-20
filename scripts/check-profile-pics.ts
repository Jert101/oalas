import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkProfilePictures() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        profilePicture: true,
        users_id: true
      }
    })
    
    console.log('User profile pictures:')
    users.forEach(user => {
      console.log(`- ${user.email}: "${user.profilePicture}"`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProfilePictures()
