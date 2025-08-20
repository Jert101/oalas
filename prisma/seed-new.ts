import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Starting database seeding...')

    // Create Roles
    console.log('Creating roles...')
    
    const roles = [
      {
        name: 'Admin',
        description: 'System administrator with full access to all features'
      },
      {
        name: 'Teacher',
        description: 'Teaching personnel with access to leave management and teaching resources'
      },
      {
        name: 'Non Teaching Personnel',
        description: 'Non-teaching staff with access to basic features'
      },
      {
        name: 'Dean/Program Head',
        description: 'Department heads with approval authority and department management capabilities'
      },
      {
        name: 'Finance Department',
        description: 'Finance staff with access to payroll and financial features'
      },
      {
        name: 'HR Department',
        description: 'Human resources staff with access to employee management features'
      },
      {
        name: 'Registrar',
        description: 'Registrar staff with access to academic records and enrollment'
      }
    ]

    const createdRoles = await Promise.all(
      roles.map(async (role) => {
        const created = await prisma.role.upsert({
          where: { name: role.name },
          update: { description: role.description },
          create: {
            name: role.name,
            description: role.description
          }
        })
        console.log(`Created role: ${role.name}`)
        return created
      })
    )

    // Get the admin role for creating default admin user
    const adminRole = createdRoles.find(role => role.name === 'Admin')
    if (!adminRole) throw new Error('Admin role not found')

    // Create Statuses
    console.log('Creating statuses...')
    
    const statuses = [
      {
        name: 'Regular',
        description: 'Regular employee with full benefits'
      },
      {
        name: 'Probationary',
        description: 'Employee under probationary period'
      },
      {
        name: 'Contract',
        description: 'Contract-based employee'
      },
      {
        name: 'Part Time',
        description: 'Part-time employee'
      }
    ]

    await Promise.all(
      statuses.map(async (status) => {
        await prisma.status.upsert({
          where: { name: status.name },
          update: { description: status.description },
          create: {
            name: status.name,
            description: status.description
          }
        })
        console.log(`Created status: ${status.name}`)
      })
    )

    // Create default admin user
    console.log('Creating default admin user...')
    
    const defaultAdmin = await prisma.user.upsert({
      where: { email: 'admin@admin.com' },
      update: {},
      create: {
        users_id: 'ADMIN001',
        email: 'admin@admin.com',
        password: await bcrypt.hash('admin123', 10),
        name: 'System Administrator',
        firstName: 'System',
        lastName: 'Administrator',
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        role_id: adminRole.role_id,
        status_id: 1 // Regular status
      }
    })
    console.log('Created default admin user')

    console.log('Seeding completed successfully!')
    
  } catch (error) {
    console.error('Error during seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Execute seeding
main()
  .catch((error) => {
    console.error('Fatal error during seeding:', error)
    process.exit(1)
  })
