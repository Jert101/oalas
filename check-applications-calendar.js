const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkApplications() {
  try {
    console.log('🔍 Checking applications and their calendar periods...');
    
    const applications = await prisma.leaveApplication.findMany({
      include: {
        calendarPeriod: true,
        user: true
      },
      take: 3
    });
    
    console.log('📋 Applications found:', applications.length);
    applications.forEach((app, index) => {
      console.log(`Application ${index + 1}:`);
      console.log('  - ID:', app.leave_application_id);
      console.log('  - User:', app.user.name);
      console.log('  - Applied At:', app.appliedAt);
      console.log('  - Calendar Period ID:', app.calendar_period_id);
      console.log('  - Calendar Period:', app.calendarPeriod);
      console.log('  - Academic Year:', app.calendarPeriod?.academicYear || 'N/A');
      console.log('---');
    });
    
    // Check all calendar periods
    const calendarPeriods = await prisma.calendarPeriod.findMany();
    console.log('📅 Available calendar periods:');
    calendarPeriods.forEach(period => {
      console.log(`  - ID: ${period.calendar_period_id}, Academic Year: ${period.academicYear}`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

checkApplications();
