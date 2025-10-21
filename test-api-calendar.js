const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAPIQuery() {
  try {
    console.log('🔍 Testing the exact API query...');
    
    // This is the exact query from the API
    const applications = await prisma.leaveApplication.findMany({
      include: {
        user: {
          select: {
            users_id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            department: {
              select: {
                department_id: true,
                name: true
              }
            }
          }
        },
        calendarPeriod: {
          select: {
            calendar_period_id: true,
            academicYear: true,
            startDate: true,
            endDate: true,
            termType: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { appliedAt: 'desc' },
      take: 2
    });
    
    console.log('📋 Applications found:', applications.length);
    applications.forEach((app, index) => {
      console.log(`\nApplication ${index + 1}:`);
      console.log('  - ID:', app.leave_application_id);
      console.log('  - User:', app.user.name);
      console.log('  - Calendar Period ID:', app.calendar_period_id);
      console.log('  - Calendar Period Object:', app.calendarPeriod);
      console.log('  - Academic Year:', app.calendarPeriod?.academicYear);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

testAPIQuery();
