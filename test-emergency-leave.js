const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEmergencyLeave() {
  try {
    // Check Emergency Leave configuration
    const emergencyLeave = await prisma.leave_types.findFirst({
      where: { name: 'Emergency Leave' }
    });
    
    console.log('Emergency Leave configuration:');
    console.log(JSON.stringify(emergencyLeave, null, 2));
    
    if (emergencyLeave) {
      // Test the validation logic directly
      console.log('\nTesting validation logic...');
      
      const userId = '222365'; // From the image
      const startDate = new Date('2025-10-19');
      const endDate = new Date('2025-10-21');
      const leaveTypeId = emergencyLeave.leave_type_id;
      
      // Check if leave type is exempt
      const leaveType = await prisma.leave_types.findUnique({
        where: { leave_type_id: leaveTypeId },
        select: { exempt_from_date_restriction: true }
      });
      
      console.log('Leave type exemption status:', leaveType);
      
      if (leaveType?.exempt_from_date_restriction) {
        console.log('✅ Leave type is exempt from date restrictions');
      } else {
        console.log('❌ Leave type is NOT exempt from date restrictions');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEmergencyLeave();
