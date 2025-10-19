const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFullValidation() {
  try {
    console.log('=== Testing Full Validation Flow ===');
    
    const userId = '222365'; // From the image
    const startDate = new Date('2025-10-19');
    const endDate = new Date('2025-10-21');
    const leaveTypeId = 3; // Emergency Leave ID
    
    console.log('Testing scenario:');
    console.log('- User ID:', userId);
    console.log('- Start Date:', startDate.toISOString());
    console.log('- End Date:', endDate.toISOString());
    console.log('- Leave Type ID:', leaveTypeId);
    
    // Step 1: Check if user has pending applications
    console.log('\n=== Step 1: Check Pending Applications ===');
    const pendingApplications = await prisma.leaveApplication.findMany({
      where: {
        users_id: userId,
        status: { in: ['PENDING', 'DEAN_APPROVED'] }
      }
    });
    console.log('Pending applications:', pendingApplications.length);
    
    // Step 2: Check date conflicts with exemption
    console.log('\n=== Step 2: Check Date Conflicts with Exemption ===');
    
    // Check if the leave type is exempt
    const leaveType = await prisma.leave_types.findUnique({
      where: { leave_type_id: leaveTypeId },
      select: { exempt_from_date_restriction: true }
    });
    
    console.log('Leave type exemption status:', leaveType);
    
    if (leaveType?.exempt_from_date_restriction) {
      console.log('✅ Leave type is exempt - skipping date conflict check');
      console.log('Result: { canApply: true, reason: "Leave type is exempt from date restrictions" }');
      return;
    }
    
    // Step 3: Check for conflicting applications
    console.log('\n=== Step 3: Check for Conflicting Applications ===');
    const conflictingApplications = await prisma.leaveApplication.findMany({
      where: {
        users_id: userId,
        status: 'APPROVED',
        OR: [
          {
            startDate: { lte: startDate },
            endDate: { gte: startDate }
          },
          {
            startDate: { lte: endDate },
            endDate: { gte: endDate }
          },
          {
            startDate: { gte: startDate },
            endDate: { lte: endDate }
          }
        ]
      }
    });
    
    console.log('Conflicting applications found:', conflictingApplications.length);
    if (conflictingApplications.length > 0) {
      console.log('Conflicting applications:', JSON.stringify(conflictingApplications, null, 2));
      console.log('Result: { canApply: false, reason: "You have approved applications that conflict with the selected dates. Please choose different dates." }');
    } else {
      console.log('Result: { canApply: true }');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFullValidation();
