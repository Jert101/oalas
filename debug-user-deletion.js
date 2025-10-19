const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function debugUserDeletion() {
  console.log('🔍 DEEP DEBUGGING: User Deletion Analysis');
  console.log('==========================================');

  try {
    // Step 1: Get a test user to delete
    console.log('\n📋 Step 1: Finding a test user...');
    const testUser = await prisma.user.findFirst({
      where: {
        role: {
          name: {
            not: 'Admin' // Don't delete admin users
          }
        }
      },
      include: {
        role: true,
        department: true,
        status: true
      }
    });

    if (!testUser) {
      console.log('❌ No test user found');
      return;
    }

    console.log(`✅ Found test user: ${testUser.name} (${testUser.users_id})`);
    console.log(`   Role: ${testUser.role?.name}`);
    console.log(`   Department: ${testUser.department?.name}`);
    console.log(`   Status: ${testUser.status?.name}`);

    // Step 2: Check ALL related data for this user
    console.log('\n📊 Step 2: Analyzing related data...');
    
    const relatedData = await Promise.all([
      prisma.leaveApplication.findMany({
        where: { users_id: testUser.users_id },
        select: { leave_application_id: true, status: true }
      }),
      prisma.leaveBalance.findMany({
        where: { users_id: testUser.users_id },
        select: { leave_balance_id: true }
      }),
      prisma.probation.findMany({
        where: { users_id: testUser.users_id },
        select: { probation_id: true, status: true }
      }),
      prisma.travelOrder.findMany({
        where: { users_id: testUser.users_id },
        select: { travel_order_id: true, status: true }
      }),
      prisma.notification.findMany({
        where: { userId: testUser.users_id },
        select: { notification_id: true, title: true }
      }),
      prisma.account.findMany({
        where: { users_id: testUser.users_id },
        select: { accounts_id: true, provider: true }
      }),
      prisma.session.findMany({
        where: { users_id: testUser.users_id },
        select: { sessions_id: true }
      })
    ]);

    const [leaveApplications, leaveBalances, probations, travelOrders, notifications, accounts, sessions] = relatedData;

    console.log(`📝 Related Data Summary:`);
    console.log(`   Leave Applications: ${leaveApplications.length}`);
    console.log(`   Leave Balances: ${leaveBalances.length}`);
    console.log(`   Probations: ${probations.length}`);
    console.log(`   Travel Orders: ${travelOrders.length}`);
    console.log(`   Notifications: ${notifications.length}`);
    console.log(`   Accounts: ${accounts.length}`);
    console.log(`   Sessions: ${sessions.length}`);

    // Step 3: Check database constraints
    console.log('\n🔗 Step 3: Checking database constraints...');
    
    // Use raw SQL to check foreign key constraints
    const constraints = await prisma.$queryRaw`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME,
        DELETE_RULE,
        UPDATE_RULE
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE REFERENCED_TABLE_NAME = 'users' 
      AND TABLE_SCHEMA = 'oalass'
      ORDER BY TABLE_NAME, COLUMN_NAME
    `;

    console.log('🔗 Foreign Key Constraints to users table:');
    constraints.forEach(constraint => {
      console.log(`   ${constraint.TABLE_NAME}.${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
      console.log(`     DELETE: ${constraint.DELETE_RULE}, UPDATE: ${constraint.UPDATE_RULE}`);
    });

    // Step 4: Test deletion step by step
    console.log('\n🧪 Step 4: Testing deletion step by step...');
    
    try {
      // Test deleting notifications first
      console.log('   Testing notification deletion...');
      const deletedNotifications = await prisma.notification.deleteMany({
        where: { userId: testUser.users_id }
      });
      console.log(`   ✅ Deleted ${deletedNotifications.count} notifications`);

      // Test deleting sessions
      console.log('   Testing session deletion...');
      const deletedSessions = await prisma.session.deleteMany({
        where: { users_id: testUser.users_id }
      });
      console.log(`   ✅ Deleted ${deletedSessions.count} sessions`);

      // Test deleting accounts
      console.log('   Testing account deletion...');
      const deletedAccounts = await prisma.account.deleteMany({
        where: { users_id: testUser.users_id }
      });
      console.log(`   ✅ Deleted ${deletedAccounts.count} accounts`);

      // Test deleting travel orders
      console.log('   Testing travel order deletion...');
      const deletedTravelOrders = await prisma.travelOrder.deleteMany({
        where: { users_id: testUser.users_id }
      });
      console.log(`   ✅ Deleted ${deletedTravelOrders.count} travel orders`);

      // Test deleting probations
      console.log('   Testing probation deletion...');
      const deletedProbations = await prisma.probation.deleteMany({
        where: { users_id: testUser.users_id }
      });
      console.log(`   ✅ Deleted ${deletedProbations.count} probations`);

      // Test deleting leave balances
      console.log('   Testing leave balance deletion...');
      const deletedLeaveBalances = await prisma.leaveBalance.deleteMany({
        where: { users_id: testUser.users_id }
      });
      console.log(`   ✅ Deleted ${deletedLeaveBalances.count} leave balances`);

      // Test deleting leave applications
      console.log('   Testing leave application deletion...');
      const deletedLeaveApplications = await prisma.leaveApplication.deleteMany({
        where: { users_id: testUser.users_id }
      });
      console.log(`   ✅ Deleted ${deletedLeaveApplications.count} leave applications`);

      // Finally test deleting the user
      console.log('   Testing user deletion...');
      const deletedUser = await prisma.user.delete({
        where: { users_id: testUser.users_id }
      });
      console.log(`   ✅ Deleted user: ${deletedUser.name}`);

      console.log('\n🎉 SUCCESS: User deletion completed successfully!');

    } catch (deletionError) {
      console.log(`\n❌ DELETION FAILED: ${deletionError.message}`);
      console.log(`   Error Code: ${deletionError.code}`);
      console.log(`   Error Meta: ${JSON.stringify(deletionError.meta, null, 2)}`);
      
      // If deletion failed, try to restore the user
      console.log('\n🔄 Attempting to restore user...');
      try {
        await prisma.user.create({
          data: {
            users_id: testUser.users_id,
            email: testUser.email,
            name: testUser.name,
            firstName: testUser.firstName,
            lastName: testUser.lastName,
            role_id: testUser.role_id,
            status_id: testUser.status_id,
            department_id: testUser.department_id,
            isActive: testUser.isActive,
            isEmailVerified: testUser.isEmailVerified,
            createdAt: testUser.createdAt,
            updatedAt: testUser.updatedAt
          }
        });
        console.log('✅ User restored successfully');
      } catch (restoreError) {
        console.log(`❌ Failed to restore user: ${restoreError.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Debugging failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserDeletion();
