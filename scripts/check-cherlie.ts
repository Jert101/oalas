import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'cherlie@gmail.com' },
      select: {
        email: true,
        name: true,
        users_id: true,
        password: true
      }
    })
    
    console.log('User:', user)
    console.log('Has password:', !!user?.password)
    if (user?.password) {
      console.log('Password starts with:', user.password.substring(0, 10) + '...')
      console.log('Password length:', user.password.length)
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()
