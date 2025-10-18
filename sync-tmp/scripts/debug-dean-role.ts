import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Get the dean user with role
    const deanUser = await prisma.user.findUnique({
      where: {
        email: 'bscs.dean@ckcm.edu.ph'
      },
      include: {
        role: true,
        department: true
      }
    })

    console.log('\nDean user details:')
    if (deanUser) {
      console.log({
        id: deanUser.users_id,
        email: deanUser.email,
        role: deanUser.role?.name,
        roleDirect: deanUser.role,
        department: deanUser.department?.name
      })
    } else {
      console.log('Dean user not found')
    }

    // List all roles
    const allRoles = await prisma.role.findMany()
    console.log('\nAll roles in database:', allRoles)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
