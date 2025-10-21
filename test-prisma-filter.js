// Test Prisma filtering for leave_type_id
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFilters() {
  console.log('=== Testing Prisma Leave Type Filters ===\n');

  try {
    // Test 1: Try filtering by leave_type_id directly (foreign key)
    console.log('Test 1: Direct foreign key filter (leave_type_id)');
    try {
      const result1 = await prisma.leaveApplication.findMany({
        where: { leave_type_id: 2 },
        take: 1,
        select: { leave_application_id: true, leave_type_id: true }
      });
      console.log('✅ SUCCESS - Direct leave_type_id filter works!');
      console.log('Result:', result1);
    } catch (err) {
      console.log('❌ FAILED - Direct leave_type_id filter');
      console.log('Error:', err.message);
    }
    console.log('');

    // Test 2: Try filtering through relationship with leave_type_id
    console.log('Test 2: Relationship filter with leave_type_id');
    try {
      const result2 = await prisma.leaveApplication.findMany({
        where: { 
          leaveType: { leave_type_id: 2 }
        },
        take: 1,
        select: { leave_application_id: true, leave_type_id: true }
      });
      console.log('✅ SUCCESS - Relationship filter with leave_type_id works!');
      console.log('Result:', result2);
    } catch (err) {
      console.log('❌ FAILED - Relationship filter with leave_type_id');
      console.log('Error:', err.message);
    }
    console.log('');

    // Test 3: Try filtering through relationship with name
    console.log('Test 3: Relationship filter with name');
    try {
      const result3 = await prisma.leaveApplication.findMany({
        where: { 
          leaveType: { name: 'Vacation Leave' }
        },
        take: 1,
        select: { leave_application_id: true, leave_type_id: true }
      });
      console.log('✅ SUCCESS - Relationship filter with name works!');
      console.log('Result:', result3);
    } catch (err) {
      console.log('❌ FAILED - Relationship filter with name');
      console.log('Error:', err.message);
    }

  } catch (error) {
    console.error('General error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFilters();

