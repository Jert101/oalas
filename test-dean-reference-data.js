const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testReferenceData() {
  try {
    console.log('Testing Dean Reference Data...');
    
    const leaveTypes = await prisma.leaveType.findMany({
      select: { leave_type_id: true, name: true }
    });
    console.log('Leave Types:', leaveTypes);
    
    const calendarPeriods = await prisma.calendarPeriod.findMany({
      select: { calendar_period_id: true, academicYear: true, startDate: true },
      orderBy: { academicYear: 'desc' }
    });
    console.log('Calendar Periods:', calendarPeriods);
    
    const statuses = await prisma.status.findMany({
      select: { status_id: true, name: true }
    });
    console.log('Statuses:', statuses);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testReferenceData();
