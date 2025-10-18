const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLeaveLimitsAPI() {
  try {
    console.log('=== Testing Leave Limits API ===');
    
    // Test the API structure by trying to create a leave limit
    console.log('\n1. Creating a test leave limit...');
    const testLeaveLimit = await prisma.leaveLimit.create({
      data: {
        status_id: 1, // Probation
        term_type_id: 1, // Academic
        leave_type_id: 1, // Vacation
        daysAllowed: 5,
        isActive: true
      },
      include: {
        status: {
          select: {
            status_id: true,
            name: true
          }
        },
        leaveType: {
          select: {
            leave_type_id: true,
            name: true
          }
        },
        termType: {
          select: {
            term_type_id: true,
            name: true
          }
        }
      }
    });
    console.log('Created leave limit:', testLeaveLimit);
    
    console.log('\n2. Fetching all leave limits...');
    const leaveLimits = await prisma.leaveLimit.findMany({
      include: {
        status: {
          select: {
            status_id: true,
            name: true
          }
        },
        leaveType: {
          select: {
            leave_type_id: true,
            name: true
          }
        },
        termType: {
          select: {
            term_type_id: true,
            name: true
          }
        }
      }
    });
    console.log('All leave limits:', leaveLimits);
    
    console.log('\n3. Cleaning up test data...');
    await prisma.leaveLimit.delete({
      where: {
        leave_limit_id: testLeaveLimit.leave_limit_id
      }
    });
    console.log('Test leave limit deleted');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLeaveLimitsAPI();
