import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateAdminUserWithCustomId() {
  try {
    // Generate custom user ID for existing admin user
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const customUserId = `${year}${month}001` // First user gets 001
    
    // First, let's see all users
    const allUsers = await prisma.user.findMany({
      select: {
        users_id: true,
        email: true,
        name: true,
        customUserId: true,
        role: {
          select: {
            name: true
          }
        }
      }
    })
    
    console.log('All users in database:')
    allUsers.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - Role: ${user.role?.name} - CustomID: ${user.customUserId}`)
    })
    
    // Find admin user by role
    const adminUser = await prisma.user.findFirst({
      where: {
        role: {
          name: 'Admin'
        }
      },
      include: {
        role: true
      }
    })
    
    if (adminUser && !adminUser.customUserId) {
      await prisma.user.update({
        where: {
          users_id: adminUser.users_id
        },
        data: {
          customUserId: customUserId
        }
      })
      
      console.log(`Updated admin user ${adminUser.email} with custom ID: ${customUserId}`)
    } else if (adminUser?.customUserId) {
      console.log(`Admin user already has custom ID: ${adminUser.customUserId}`)
    } else {
      console.log('Admin user not found')
    }
  } catch (error) {
    console.error('Error updating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateAdminUserWithCustomId()
