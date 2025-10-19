const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testValidationAPI() {
  try {
    console.log('Testing validation API logic...');
    
    const userId = '222365'; // From the image
    const startDate = new Date('2025-10-19');
    const endDate = new Date('2025-10-21');
    const leaveTypeId = 3; // Emergency Leave ID
    
    console.log('Parameters:');
    console.log('- userId:', userId);
    console.log('- startDate:', startDate);
    console.log('- endDate:', endDate);
    console.log('- leaveTypeId:', leaveTypeId);
    
    // Test the checkDateConflicts function logic directly
    console.log('\n=== Testing checkDateConflicts logic ===');
    
    // Check if the leave type is exempt from date restrictions
    if (leaveTypeId) {
      const leaveType = await prisma.leave_types.findUnique({
        where: { leave_type_id: leaveTypeId },
        select: { exempt_from_date_restriction: true }
      });
      
      console.log('Leave type query result:', leaveType);
      
      if (leaveType?.exempt_from_date_restriction) {
        console.log('✅ Leave type is exempt - should return canApply: true');
        return;
      }
    }
    
    // If we get here, the exemption check failed
    console.log('❌ Exemption check failed, proceeding with normal date conflict check...');
    
    // Check for overlapping approved leave applications
    const conflictingLeaveApplications = await prisma.leaveApplication.findMany({
      where: {
        users_id: userId,
        status: 'APPROVED',
        OR: [
          // Case 1: New application starts during an existing approved application
          {
            startDate: { lte: startDate },
            endDate: { gte: startDate }
          },
          // Case 2: New application ends during an existing approved application
          {
            startDate: { lte: endDate },
            endDate: { gte: endDate }
          },
          // Case 3: New application completely contains an existing approved application
          {
            startDate: { gte: startDate },
            endDate: { lte: endDate }
          }
        ]
      },
      select: {
        leave_application_id: true,
        startDate: true,
        endDate: true,
        reason: true,
        specificPurpose: true,
        descriptionOfSickness: true,
        leave_type_id: true
      }
    });
    
    console.log('Conflicting applications found:', conflictingLeaveApplications.length);
    console.log('Conflicting applications:', JSON.stringify(conflictingLeaveApplications, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testValidationAPI();
