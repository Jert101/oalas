const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLeaveLimits() {
  try {
    console.log('=== Current Leave Limits ===');
    
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
    
    if (leaveLimits.length === 0) {
      console.log('No leave limits found');
    } else {
      console.log(`Found ${leaveLimits.length} leave limits:`);
      leaveLimits.forEach((limit, index) => {
        console.log(`${index + 1}. ${limit.status.name} - ${limit.termType.name} - ${limit.leaveType.name}: ${limit.daysAllowed} days`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLeaveLimits();
