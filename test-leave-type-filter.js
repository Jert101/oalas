const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLeaveTypeFilters() {
  console.log('=== Testing Leave Type Filters ===\n');

  try {
    // Test 1: Get all leave types
    console.log('1. Fetching all leave types...');
    const leaveTypes = await prisma.leave_types.findMany();
    console.log('Leave Types:', leaveTypes.map(lt => ({ id: lt.leave_type_id, name: lt.name })));
    console.log('');

    // Test 2: Filter by leave_type_id directly
    console.log('2. Testing direct leave_type_id filter...');
    try {
      const result1 = await prisma.leaveApplication.findMany({
        where: {
          leave_type_id: 1
        },
        take: 1
      });
      console.log('✅ Direct leave_type_id filter works!', result1.length, 'applications found');
    } catch (err) {
      console.log('❌ Direct leave_type_id filter failed:', err.message);
    }
    console.log('');

    // Test 3: Filter by relationship with leave_type_id
    console.log('3. Testing relationship filter with leave_type_id...');
    try {
      const result2 = await prisma.leaveApplication.findMany({
        where: {
          leaveType: {
            leave_type_id: 1
          }
        },
        take: 1
      });
      console.log('✅ Relationship filter with leave_type_id works!', result2.length, 'applications found');
    } catch (err) {
      console.log('❌ Relationship filter with leave_type_id failed:', err.message);
    }
    console.log('');

    // Test 4: Filter by relationship with name
    console.log('4. Testing relationship filter with name...');
    try {
      const result3 = await prisma.leaveApplication.findMany({
        where: {
          leaveType: {
            name: 'Vacation Leave'
          }
        },
        take: 1
      });
      console.log('✅ Relationship filter with name works!', result3.length, 'applications found');
    } catch (err) {
      console.log('❌ Relationship filter with name failed:', err.message);
    }
    console.log('');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLeaveTypeFilters();

