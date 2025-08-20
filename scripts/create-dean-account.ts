import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    // First, create or get the role
    const role = await prisma.role.upsert({
      where: { name: 'Dean/Program Head' },
      update: {
        description: 'Program Head / Dean role'
      },
      create: {
        name: 'Dean/Program Head',
        description: 'Program Head / Dean role'
      }
    })

    // Create or get the department
    const department = await prisma.department.upsert({
      where: {
        name: 'Bachelor of Science in Computer Science'
      },
      update: {},
      create: {
        name: 'Bachelor of Science in Computer Science',
        description: 'Computer Science Department',
        category: 'ACADEMIC_DEPARTMENT'
      }
    })

    // Generate a unique user ID
    const userId = `DEAN-${Date.now()}`

    // Create the dean account
    const password = 'Password123!' // More secure default password
    const hashedPassword = await hash(password, 12)
    
    // Delete existing dean account if it exists
    await prisma.user.deleteMany({
      where: {
        email: 'bscs.dean@ckcm.edu.ph'
      }
    })

    // Create the dean account
    const dean = await prisma.user.create({
      data: {
        users_id: userId,
        name: 'BSCS Program Head',
        email: 'bscs.dean@ckcm.edu.ph',
        password: hashedPassword,
        isEmailVerified: true,
        isDepartmentHead: true,
        isActive: true,
        role_id: role.role_id,
        department_id: department.department_id,
        loginAttempts: 0
      }
    })

    // Log the created user details
    console.log('\nDean account created successfully!')
    console.log('Email:', dean.email)
    console.log('Password:', password)
    console.log('Role:', role.name)

    console.log('Dean account created successfully:', {
      name: dean.name,
      email: dean.email,
      department: department.name
    })
  } catch (error) {
    console.error('Error creating dean account:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
