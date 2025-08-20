const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminAccount() {
  try {
    console.log('=== Creating New Admin Account ===\n');

    // Check if required data exists
    console.log('1. Checking required data...');
    
    // Get roles
    const adminRole = await prisma.role.findFirst({
      where: { name: 'Admin' }
    });
    
    if (!adminRole) {
      console.log('❌ Admin role not found. Please run restore-all-data.js first.');
      return;
    }
    console.log('✅ Admin role found');

    // Get departments
    const departments = await prisma.department.findMany({
      take: 1
    });
    
    if (departments.length === 0) {
      console.log('❌ No departments found. Please run restore-all-data.js first.');
      return;
    }
    console.log('✅ Departments found');

    // Get statuses
    const regularStatus = await prisma.status.findFirst({
      where: { name: 'Regular' }
    });
    
    if (!regularStatus) {
      console.log('❌ Regular status not found. Please run restore-all-data.js first.');
      return;
    }
    console.log('✅ Regular status found');

    // Create admin account
    console.log('\n2. Creating admin account...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await prisma.user.create({
      data: {
        users_id: `admin-${Date.now()}`,
        email: 'admin@ckcm.edu.ph',
        password: hashedPassword,
        name: 'System Administrator',
        firstName: 'System',
        lastName: 'Administrator',
        isDepartmentHead: true,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        isActive: true,
        role_id: adminRole.role_id,
        department_id: departments[0].department_id,
        status_id: regularStatus.status_id
      },
      include: {
        role: true,
        department: true,
        status: true
      }
    });

    console.log('✅ Admin account created successfully!');
    console.log('\nAdmin Account Details:');
    console.log(`- Name: ${adminUser.name}`);
    console.log(`- Email: ${adminUser.email}`);
    console.log(`- Password: admin123`);
    console.log(`- Role: ${adminUser.role.name}`);
    console.log(`- Department: ${adminUser.department.name}`);
    console.log(`- Status: ${adminUser.status.name}`);
    console.log(`- User ID: ${adminUser.users_id}`);

    console.log('\n📝 Login Credentials:');
    console.log('Email: admin@ckcm.edu.ph');
    console.log('Password: admin123');

    console.log('\n✅ Admin account creation completed!');

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('❌ Admin account already exists with this email.');
      console.log('Please use a different email or delete the existing account first.');
    } else {
      console.error('Error creating admin account:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdminAccount();
