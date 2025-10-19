const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testApiDeletion() {
  console.log('🔍 TESTING API DELETION LOGIC');
  console.log('==============================');

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

    // Simulate the exact API logic
    const userId = testUser.users_id;

    // Get related records for logging purposes
    const relatedRecords = await prisma.user.findUnique({
      where: { users_id: userId },
      include: {
        leaveApplications: {
          select: { leave_application_id: true, status: true }
        },
        probation: {
          select: { probation_id: true, status: true }
        },
        travelOrders: {
          select: { travel_order_id: true, status: true }
        },
        notifications: {
          select: { notification_id: true }
        },
        accounts: {
          select: { accounts_id: true }
        }
      }
    });

    // Get leave balances separately
    const leaveBalances = await prisma.leaveBalance.findMany({
      where: { users_id: userId },
      select: { leave_balance_id: true }
    });

    const deletionSummary = {
      leaveApplications: relatedRecords?.leaveApplications?.length || 0,
      leaveBalances: leaveBalances?.length || 0,
      probation: relatedRecords?.probation ? 1 : 0,
      travelOrders: relatedRecords?.travelOrders?.length || 0,
      notifications: relatedRecords?.notifications?.length || 0,
      accounts: relatedRecords?.accounts?.length || 0
    };

    console.log(`📊 Deletion summary:`, deletionSummary);

    // Test the exact transaction logic from the API
    console.log('\n🧪 Testing API transaction logic...');
    
    try {
      await prisma.$transaction(async (tx) => {
        console.log('   Transaction started...');
        
        // Step 1: Delete ALL related data first
        console.log('   Deleting leave applications...');
        await tx.leaveApplication.deleteMany({
          where: { users_id: userId }
        });

        console.log('   Deleting leave balances...');
        await tx.leaveBalance.deleteMany({
          where: { users_id: userId }
        });

        console.log('   Deleting probation records...');
        await tx.probation.deleteMany({
          where: { users_id: userId }
        });

        console.log('   Deleting travel orders...');
        await tx.travelOrder.deleteMany({
          where: { users_id: userId }
        });

        console.log('   Deleting notifications...');
        await tx.notification.deleteMany({
          where: { userId: userId }
        });

        console.log('   Deleting accounts...');
        await tx.account.deleteMany({
          where: { users_id: userId }
        });

        console.log('   Deleting sessions...');
        await tx.session.deleteMany({
          where: { users_id: userId }
        });

        console.log('   Deleting user...');
        await tx.user.delete({
          where: { users_id: userId }
        });
        
        console.log('   Transaction completed successfully!');
      });

      console.log('\n🎉 SUCCESS: API deletion logic worked perfectly!');

    } catch (transactionError) {
      console.log(`\n❌ TRANSACTION FAILED:`);
      console.log(`   Error: ${transactionError.message}`);
      console.log(`   Code: ${transactionError.code}`);
      console.log(`   Meta: ${JSON.stringify(transactionError.meta, null, 2)}`);
      
      // Check if it's a specific field error
      if (transactionError.message.includes('users_id')) {
        console.log('\n🔍 Analysis: Field name mismatch detected!');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiDeletion();
