import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Check roles
    console.log('\nChecking roles...')
    const roles = await prisma.role.findMany()
    console.log('Existing roles:', roles)

    // Check the dean user
    console.log('\nChecking dean user...')
    const deanUser = await prisma.user.findUnique({
      where: {
        email: 'bscs.dean@ckcm.edu.ph'
      },
      include: {
        role: true,
        department: true
      }
    })
    console.log('Dean user:', deanUser)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
