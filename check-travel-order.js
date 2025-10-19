const { PrismaClient } = require('@prisma/client');

async function checkTravelOrder() {
  const prisma = new PrismaClient();
  
  try {
    console.log("Checking if travel order with ID 4 exists...");
    
    // Check travel order with ID 4
    const travelOrder = await prisma.travelOrder.findUnique({
      where: {
        travel_order_id: 4
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            department_id: true
          }
        }
      }
    });
    
    console.log("Travel order found:", !!travelOrder);
    if (travelOrder) {
      console.log("Travel order details:");
      console.log("- ID:", travelOrder.travel_order_id);
      console.log("- Status:", travelOrder.status);
      console.log("- User:", travelOrder.user.name);
      console.log("- User Email:", travelOrder.user.email);
      console.log("- User Department ID:", travelOrder.user.department_id);
    } else {
      console.log("Travel order with ID 4 not found");
      
      // Let's check what travel orders exist
      const allTravelOrders = await prisma.travelOrder.findMany({
        select: {
          travel_order_id: true,
          status: true,
          user: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          travel_order_id: 'desc'
        }
      });
      
      console.log("All travel orders in database:");
      allTravelOrders.forEach(order => {
        console.log(`- ID: ${order.travel_order_id}, Status: ${order.status}, User: ${order.user.name}`);
      });
    }
    
  } catch (error) {
    console.error("Error checking travel order:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTravelOrder();