const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSessionData() {
  console.log('🔍 Testing session data for office head user...');

  try {
    // Get the user data as it would appear in the session
    const user = await prisma.user.findUnique({
      where: {
        email: 'jersoncatadman@ckcm.edu.ph'
      },
      include: {
        role: true,
        department: true
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    // Simulate the session data structure
    const sessionData = {
      id: user.users_id,
      email: user.email,
      name: user.name,
      role: user.role?.name || "Guest",
      isEmailVerified: user.isEmailVerified,
      isDepartmentHead: user.isDepartmentHead,
    };

    console.log('📋 Session data that should be returned:');
    console.log(JSON.stringify(sessionData, null, 2));

    console.log('\n🧪 Testing routing logic with this session data:');
    const userRole = sessionData.role;
    const isDepartmentHead = sessionData.isDepartmentHead;

    // Check for Maintenance Office - but respect isDepartmentHead status
    if (userRole === 'Maintenance Office' && !isDepartmentHead) {
      console.log('❌ Would redirect to dean dashboard');
    } else {
      console.log('✅ Would NOT redirect to dean dashboard');
    }

    // Office head check
    if (isDepartmentHead) {
      console.log('✅ Would redirect to office-head dashboard');
    } else {
      console.log('❌ Would NOT redirect to office-head dashboard');
    }

    console.log('\n🎯 Expected result: Office-head dashboard');
    console.log('🔍 If this is correct, the issue might be browser/session caching.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSessionData();