const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function debugOfficeHead() {
  console.log('🔍 DEBUGGING: Office Head User Data');
  console.log('===================================');

  try {
    // Find the specific user
    const user = await prisma.user.findUnique({
      where: {
        email: 'jersoncatadman@ckcm.edu.ph'
      },
      include: {
        role: true,
        department: true,
        status: true
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role?.name}`);
    console.log(`   Department: ${user.department?.name}`);
    console.log(`   Status: ${user.status?.name}`);
    console.log(`   isDepartmentHead: ${user.isDepartmentHead}`);
    console.log(`   users_id: ${user.users_id}`);

    // Check if there are multiple users with similar emails
    const similarUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'jersoncatadman'
        }
      },
      include: {
        role: true,
        department: true
      }
    });

    console.log('\n📋 All users with similar email:');
    similarUsers.forEach((u, index) => {
      console.log(`   ${index + 1}. ${u.email} - ${u.role?.name} - isDepartmentHead: ${u.isDepartmentHead}`);
    });

    // Check the role details
    console.log('\n🔍 Role Details:');
    console.log(`   Role ID: ${user.role?.role_id}`);
    console.log(`   Role Name: ${user.role?.name}`);
    console.log(`   Role Description: ${user.role?.description}`);

    // Check department details
    console.log('\n🏢 Department Details:');
    console.log(`   Department ID: ${user.department?.department_id}`);
    console.log(`   Department Name: ${user.department?.name}`);
    console.log(`   Department Category: ${user.department?.category}`);

  } catch (error) {
    console.error('❌ Debugging failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugOfficeHead();
