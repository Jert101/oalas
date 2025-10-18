const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Configuration - Change these values as needed
const ADMIN_CONFIG = {
  email: 'newadmin@ckcm.edu.ph',
  password: 'newadmin123',
  name: 'New Administrator',
  firstName: 'New',
  lastName: 'Administrator',
  middleName: null,
  suffix: null,
  isDepartmentHead: true,
  departmentName: 'Computer Science', // Must match existing department name
  roleName: 'Admin', // Must match existing role name
  statusName: 'Regular' // Must match existing status name
};

async function createCustomAdmin() {
  try {
    console.log('=== Creating Custom Admin Account ===\n');

    // Check if required data exists
    console.log('1. Checking required data...');
    
    // Get role
    const role = await prisma.role.findFirst({
      where: { name: ADMIN_CONFIG.roleName }
    });
    
    if (!role) {
      console.log(`❌ Role "${ADMIN_CONFIG.roleName}" not found.`);
      console.log('Available roles:');
      const allRoles = await prisma.role.findMany();
      allRoles.forEach(r => console.log(`- ${r.name}`));
      return;
    }
    console.log(`✅ Role "${ADMIN_CONFIG.roleName}" found`);

    // Get department
    const department = await prisma.department.findFirst({
      where: { name: ADMIN_CONFIG.departmentName }
    });
    
    if (!department) {
      console.log(`❌ Department "${ADMIN_CONFIG.departmentName}" not found.`);
      console.log('Available departments:');
      const allDepartments = await prisma.department.findMany();
      allDepartments.forEach(d => console.log(`- ${d.name}`));
      return;
    }
    console.log(`✅ Department "${ADMIN_CONFIG.departmentName}" found`);

    // Get status
    const status = await prisma.status.findFirst({
      where: { name: ADMIN_CONFIG.statusName }
    });
    
    if (!status) {
      console.log(`❌ Status "${ADMIN_CONFIG.statusName}" not found.`);
      console.log('Available statuses:');
      const allStatuses = await prisma.status.findMany();
      allStatuses.forEach(s => console.log(`- ${s.name}`));
      return;
    }
    console.log(`✅ Status "${ADMIN_CONFIG.statusName}" found`);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: ADMIN_CONFIG.email }
    });
    
    if (existingUser) {
      console.log(`❌ User with email "${ADMIN_CONFIG.email}" already exists.`);
      console.log('Please change the email in the ADMIN_CONFIG or delete the existing user.');
      return;
    }

    // Create admin account
    console.log('\n2. Creating custom admin account...');
    
    const hashedPassword = await bcrypt.hash(ADMIN_CONFIG.password, 10);
    
    const adminUser = await prisma.user.create({
      data: {
        users_id: `admin-${Date.now()}`,
        email: ADMIN_CONFIG.email,
        password: hashedPassword,
        name: ADMIN_CONFIG.name,
        firstName: ADMIN_CONFIG.firstName,
        lastName: ADMIN_CONFIG.lastName,
        middleName: ADMIN_CONFIG.middleName,
        suffix: ADMIN_CONFIG.suffix,
        isDepartmentHead: ADMIN_CONFIG.isDepartmentHead,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        isActive: true,
        role_id: role.role_id,
        department_id: department.department_id,
        status_id: status.status_id
      },
      include: {
        role: true,
        department: true,
        status: true
      }
    });

    console.log('✅ Custom admin account created successfully!');
    console.log('\nAdmin Account Details:');
    console.log(`- Name: ${adminUser.name}`);
    console.log(`- Email: ${adminUser.email}`);
    console.log(`- Password: ${ADMIN_CONFIG.password}`);
    console.log(`- Role: ${adminUser.role.name}`);
    console.log(`- Department: ${adminUser.department.name}`);
    console.log(`- Status: ${adminUser.status.name}`);
    console.log(`- User ID: ${adminUser.users_id}`);

    console.log('\n📝 Login Credentials:');
    console.log(`Email: ${ADMIN_CONFIG.email}`);
    console.log(`Password: ${ADMIN_CONFIG.password}`);

    console.log('\n✅ Custom admin account creation completed!');

  } catch (error) {
    console.error('Error creating custom admin account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCustomAdmin();
