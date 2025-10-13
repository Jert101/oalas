import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdminSeeder() {
  try {
    console.log('🚀 Starting Admin Seeder...')
    
    // 1. Ensure Admin role exists
    console.log('📋 Checking/Creating Admin role...')
    const adminRole = await prisma.role.upsert({
      where: { name: 'Admin' },
      update: { 
        description: 'System Administrator with full access to all features and user management'
      },
      create: {
        name: 'Admin',
        description: 'System Administrator with full access to all features and user management'
      }
    })
    console.log(`✅ Admin role ready (ID: ${adminRole.role_id})`)

    // 2. Ensure Regular status exists
    console.log('📊 Checking/Creating Regular status...')
    const regularStatus = await prisma.status.upsert({
      where: { name: 'Regular' },
      update: { 
        description: 'Regular employee with full system access and benefits'
      },
      create: {
        name: 'Regular',
        description: 'Regular employee with full system access and benefits'
      }
    })
    console.log(`✅ Regular status ready (ID: ${regularStatus.status_id})`)

    // 3. Create default admin department if needed
    console.log('🏢 Checking/Creating Administration department...')
    const adminDepartment = await prisma.department.upsert({
      where: { name: 'Administration' },
      update: { 
        description: 'System Administration and IT Department'
      },
      create: {
        name: 'Administration',
        description: 'System Administration and IT Department',
        category: 'NON_TEACHING_PERSONNEL'
      }
    })
    console.log(`✅ Administration department ready (ID: ${adminDepartment.department_id})`)

    // 4. Create multiple admin users with different IDs
    console.log('👤 Creating admin users...')
    
    const adminUsers = [
      {
        users_id: 'ADMIN001',
        email: 'admin@oalass.com',
        password: 'Admin@123!',
        name: 'System Administrator',
        firstName: 'System',
        lastName: 'Administrator',
        middleName: null,
        suffix: null
      },
      {
        users_id: 'SUPER001',
        email: 'superadmin@oalass.com',
        password: 'Super@123!',
        name: 'Super Administrator',
        firstName: 'Super',
        lastName: 'Administrator',
        middleName: null,
        suffix: null
      },
      {
        users_id: 'DEV001',
        email: 'dev@oalass.com',
        password: 'Dev@123!',
        name: 'Development Administrator',
        firstName: 'Development',
        lastName: 'Administrator',
        middleName: null,
        suffix: null
      }
    ]

    const createdAdmins = []
    
    for (const adminData of adminUsers) {
      const hashedPassword = await bcrypt.hash(adminData.password, 12)
      
      const adminUser = await prisma.user.upsert({
        where: { email: adminData.email },
        update: {
          // Update existing admin if found
          password: hashedPassword,
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          isActive: true,
          updatedAt: new Date()
        },
        create: {
          users_id: adminData.users_id,
          email: adminData.email,
          password: hashedPassword,
          name: adminData.name,
          firstName: adminData.firstName,
          lastName: adminData.lastName,
          middleName: adminData.middleName,
          suffix: adminData.suffix,
          profilePicture: '/ckcm.png',
          isDepartmentHead: false,
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          isActive: true,
          role_id: adminRole.role_id,
          status_id: regularStatus.status_id,
          department_id: adminDepartment.department_id
        }
      })
      
      createdAdmins.push({
        user: adminUser,
        plainPassword: adminData.password
      })
      
      console.log(`✅ Created/Updated admin: ${adminUser.email} (ID: ${adminUser.users_id})`)
    }

    // 5. Display summary
    console.log('\n🎉 Admin Seeder completed successfully!')
    console.log('\n📋 ADMIN ACCOUNTS SUMMARY:')
    console.log('=' .repeat(60))
    
    createdAdmins.forEach(({ user, plainPassword }) => {
      console.log(`👤 ${user.name}`)
      console.log(`   📧 Email: ${user.email}`)
      console.log(`   🔑 Password: ${plainPassword}`)
      console.log(`   🆔 User ID: ${user.users_id}`)
      console.log(`   📍 Role: Admin (ID: ${user.role_id})`)
      console.log(`   🏢 Department: Administration (ID: ${user.department_id})`)
      console.log(`   ✅ Email Verified: ${user.isEmailVerified}`)
      console.log(`   🟢 Active: ${user.isActive}`)
      console.log('   ' + '-'.repeat(40))
    })

    console.log('\n💡 IMPORTANT NOTES:')
    console.log('• Please change default passwords after first login')
    console.log('• All admin accounts have full system access')
    console.log('• Email verification is pre-activated for all admin accounts')
    console.log('• These accounts can create and manage other users')
    
    return {
      success: true,
      adminRole,
      regularStatus,
      adminDepartment,
      createdAdmins: createdAdmins.map(({ user }) => ({
        id: user.users_id,
        email: user.email,
        name: user.name
      }))
    }

  } catch (error) {
    console.error('❌ Error during admin seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Execute the seeder
if (require.main === module) {
  createAdminSeeder()
    .then((result) => {
      console.log('\n✅ Admin seeding process completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Admin seeding failed:', error)
      process.exit(1)
    })
}

export default createAdminSeeder





