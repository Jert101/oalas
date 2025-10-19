const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function simpleDebugDeletion() {
  console.log('🔍 SIMPLE DEBUGGING: User Deletion Test');
  console.log('=======================================');

  try {
    // Get a test user
    const testUser = await prisma.user.findFirst({
      where: {
        role: {
          name: {
            not: 'Admin'
          }
        }
      },
      include: {
        role: true
      }
    });

    if (!testUser) {
      console.log('❌ No test user found');
      return;
    }

    console.log(`✅ Found test user: ${testUser.name} (${testUser.users_id})`);
    console.log(`   Role: ${testUser.role?.name}`);

    // Check related data
    const leaveBalances = await prisma.leaveBalance.count({
      where: { users_id: testUser.users_id }
    });
    
    const notifications = await prisma.notification.count({
      where: { userId: testUser.users_id }
    });

    console.log(`📊 Related data: ${leaveBalances} leave balances, ${notifications} notifications`);

    // Test deletion step by step
    console.log('\n🧪 Testing deletion step by step...');
    
    try {
      // Step 1: Delete notifications
      console.log('   Step 1: Deleting notifications...');
      const deletedNotifications = await prisma.notification.deleteMany({
        where: { userId: testUser.users_id }
      });
      console.log(`   ✅ Deleted ${deletedNotifications.count} notifications`);

      // Step 2: Delete leave balances
      console.log('   Step 2: Deleting leave balances...');
      const deletedLeaveBalances = await prisma.leaveBalance.deleteMany({
        where: { users_id: testUser.users_id }
      });
      console.log(`   ✅ Deleted ${deletedLeaveBalances.count} leave balances`);

      // Step 3: Delete user
      console.log('   Step 3: Deleting user...');
      const deletedUser = await prisma.user.delete({
        where: { users_id: testUser.users_id }
      });
      console.log(`   ✅ Deleted user: ${deletedUser.name}`);

      console.log('\n🎉 SUCCESS: User deletion completed successfully!');

    } catch (deletionError) {
      console.log(`\n❌ DELETION FAILED:`);
      console.log(`   Error: ${deletionError.message}`);
      console.log(`   Code: ${deletionError.code}`);
      console.log(`   Meta: ${JSON.stringify(deletionError.meta, null, 2)}`);
      
      // Try to identify which step failed
      if (deletionError.message.includes('users_id')) {
        console.log('\n🔍 Analysis: The error is related to users_id field');
        console.log('   This suggests a foreign key constraint issue');
      }
    }

  } catch (error) {
    console.error('❌ Debugging failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleDebugDeletion();
