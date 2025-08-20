import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUsers() {
  try {
    // Hash password for test users
    const hashedPassword = await bcrypt.hash('password123', 12)

    // Create Admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@ckcm.edu.ph' },
      update: {},
      create: {
        users_id: '24120001', // Year 2024, December, User 001
        email: 'admin@ckcm.edu.ph',
        password: hashedPassword,
        name: 'Admin User',
        firstName: 'Admin',
        lastName: 'User',
        role_id: 1, // Admin role
        department_id: 1, // First department
        status_id: 1, // First status
        isEmailVerified: true,
        isActive: true,
      },
    })

    // Create Teacher user
    const teacherUser = await prisma.user.upsert({
      where: { email: 'teacher@ckcm.edu.ph' },
      update: {},
      create: {
        users_id: '24120002', // Year 2024, December, User 002
        email: 'teacher@ckcm.edu.ph',
        password: hashedPassword,
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        role_id: 2, // Teacher role
        department_id: 2, // Second department
        status_id: 1, // First status
        isEmailVerified: true,
        isActive: true,
      },
    })

    console.log('✅ Test users created successfully!')
    console.log('📧 Admin Login: admin@ckcm.edu.ph / password123')
    console.log('📧 Teacher Login: teacher@ckcm.edu.ph / password123')
    
    console.log('\n📊 Created Users:')
    console.log('Admin:', adminUser)
    console.log('Teacher:', teacherUser)

  } catch (error) {
    console.error('❌ Error creating test users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUsers()
