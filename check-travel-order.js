const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTravelOrder() {
  try {
    // Check if Travel Order leave type exists
    const travelOrder = await prisma.leave_types.findFirst({
      where: { name: 'Travel Order' }
    });

    if (!travelOrder) {
      console.log('Travel Order leave type not found. Creating...');
      
      const newTravelOrder = await prisma.leave_types.create({
        data: {
          name: 'Travel Order',
          description: 'Official travel orders for business purposes',
          isActive: true
        }
      });
      
      console.log('Travel Order leave type created:', newTravelOrder);
    } else {
      console.log('Travel Order leave type already exists:', travelOrder);
    }

    // List all leave types
    const allLeaveTypes = await prisma.leave_types.findMany({
      where: { isActive: true }
    });
    
    console.log('All active leave types:');
    allLeaveTypes.forEach(type => {
      console.log(`- ${type.name} (ID: ${type.leave_type_id})`);
    });

  } catch (error) {
    console.error('Error checking travel order:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTravelOrder();
