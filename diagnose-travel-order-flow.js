// Comprehensive diagnosis of travel order flow
const { PrismaClient } = require('@prisma/client');

async function diagnoseTravelOrderFlow() {
  const prisma = new PrismaClient();
  
  try {
    console.log("🔍 COMPREHENSIVE TRAVEL ORDER FLOW DIAGNOSIS");
    console.log("=" .repeat(60));
    
    // Step 1: Check if travel order with ID 4 exists
    console.log("\n1️⃣ CHECKING IF TRAVEL ORDER ID 4 EXISTS:");
    const travelOrder = await prisma.travelOrder.findUnique({
      where: { travel_order_id: 4 },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            department_id: true,
            role: {
              select: {
                name: true
              }
            }
          }
        },
        calendarPeriod: {
          select: {
            academicYear: true,
            isCurrent: true
          }
        }
      }
    });
    
    if (travelOrder) {
      console.log("✅ Travel order ID 4 EXISTS:");
      console.log("   - ID:", travelOrder.travel_order_id);
      console.log("   - Status:", travelOrder.status);
      console.log("   - User:", travelOrder.user.name);
      console.log("   - User Email:", travelOrder.user.email);
      console.log("   - User Role:", travelOrder.user.role?.name);
      console.log("   - User Department ID:", travelOrder.user.department_id);
      console.log("   - Applied At:", travelOrder.appliedAt);
      console.log("   - Calendar Period:", travelOrder.calendarPeriod?.academicYear);
      console.log("   - Is Current Period:", travelOrder.calendarPeriod?.isCurrent);
    } else {
      console.log("❌ Travel order ID 4 NOT FOUND");
      
      // Check what travel orders exist
      const allTravelOrders = await prisma.travelOrder.findMany({
        select: {
          travel_order_id: true,
          status: true,
          appliedAt: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          travel_order_id: 'desc'
        },
        take: 10
      });
      
      console.log("📋 Recent travel orders in database:");
      allTravelOrders.forEach(order => {
        console.log(`   - ID: ${order.travel_order_id}, Status: ${order.status}, User: ${order.user.name}, Applied: ${order.appliedAt}`);
      });
    }
    
    // Step 2: Check if there are any deans in the same department as the travel order user
    if (travelOrder) {
      console.log("\n2️⃣ CHECKING FOR DEANS IN SAME DEPARTMENT:");
      const deansInDepartment = await prisma.user.findMany({
        where: {
          department_id: travelOrder.user.department_id,
          OR: [
            { role: { name: "Dean/Program Head" } },
            { isDepartmentHead: true }
          ]
        },
        select: {
          users_id: true,
          name: true,
          email: true,
          role: {
            select: {
              name: true
            }
          },
          isDepartmentHead: true
        }
      });
      
      if (deansInDepartment.length > 0) {
        console.log("✅ Found deans in the same department:");
        deansInDepartment.forEach(dean => {
          console.log(`   - ${dean.name} (${dean.email}) - Role: ${dean.role?.name || 'N/A'}, isDepartmentHead: ${dean.isDepartmentHead}`);
        });
      } else {
        console.log("❌ No deans found in the same department");
      }
    }
    
    // Step 3: Check pending applications for the travel order user
    if (travelOrder) {
      console.log("\n3️⃣ CHECKING PENDING APPLICATIONS FOR USER:");
      const pendingLeaveApplications = await prisma.leaveApplication.findMany({
        where: {
          users_id: travelOrder.user.users_id,
          status: { in: ['PENDING', 'DEAN_APPROVED'] }
        },
        select: {
          leave_application_id: true,
          status: true,
          appliedAt: true,
          startDate: true,
          endDate: true
        }
      });
      
      const pendingTravelOrders = await prisma.travelOrder.findMany({
        where: {
          users_id: travelOrder.user.users_id,
          status: { in: ['PENDING', 'DEAN_APPROVED'] }
        },
        select: {
          travel_order_id: true,
          status: true,
          appliedAt: true,
          dateOfTravel: true,
          expectedReturn: true
        }
      });
      
      console.log("📋 Pending leave applications:", pendingLeaveApplications.length);
      pendingLeaveApplications.forEach(app => {
        console.log(`   - ID: ${app.leave_application_id}, Status: ${app.status}, Applied: ${app.appliedAt}`);
      });
      
      console.log("📋 Pending travel orders:", pendingTravelOrders.length);
      pendingTravelOrders.forEach(order => {
        console.log(`   - ID: ${order.travel_order_id}, Status: ${order.status}, Applied: ${order.appliedAt}`);
      });
    }
    
    // Step 4: Test the validation service logic
    if (travelOrder) {
      console.log("\n4️⃣ TESTING VALIDATION SERVICE LOGIC:");
      
      // Simulate the validation that should happen
      const isDean = travelOrder.user.role?.name === "Dean/Program Head";
      const statusFilter = isDean ? ['PENDING'] : ['PENDING', 'DEAN_APPROVED'];
      
      console.log("   - User is Dean:", isDean);
      console.log("   - Status filter:", statusFilter);
      
      const validationPendingLeave = await prisma.leaveApplication.findMany({
        where: {
          users_id: travelOrder.user.users_id,
          status: { in: statusFilter }
        },
        select: {
          leave_application_id: true,
          status: true
        }
      });
      
      const validationPendingTravel = await prisma.travelOrder.findMany({
        where: {
          users_id: travelOrder.user.users_id,
          status: { in: statusFilter }
        },
        select: {
          travel_order_id: true,
          status: true
        }
      });
      
      console.log("   - Validation would find pending leave apps:", validationPendingLeave.length);
      console.log("   - Validation would find pending travel orders:", validationPendingTravel.length);
      
      const hasPending = validationPendingLeave.length > 0 || validationPendingTravel.length > 0;
      console.log("   - User has pending applications:", hasPending);
      console.log("   - User should be blocked from new applications:", hasPending);
    }
    
  } catch (error) {
    console.error("❌ Error during diagnosis:", error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseTravelOrderFlow();
