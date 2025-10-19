// Test script to debug dean approval API
const testId = "travel_4";

console.log("Testing ID parsing for:", testId);

// Simulate the ID parsing logic from the API
let applicationId;
let isTravelOrder = false;

if (testId.startsWith('leave_')) {
  applicationId = parseInt(testId.replace('leave_', ''));
  isTravelOrder = false;
} else if (testId.startsWith('travel_')) {
  applicationId = parseInt(testId.replace('travel_', ''));
  isTravelOrder = true;
} else {
  applicationId = parseInt(testId);
  isTravelOrder = false;
}

console.log("Parsed results:");
console.log("- applicationId:", applicationId);
console.log("- isTravelOrder:", isTravelOrder);
console.log("- isNaN(applicationId):", isNaN(applicationId));

// Test what the API would query
if (isTravelOrder) {
  console.log("Would query: prisma.travelOrder.findUnique({ where: { travel_order_id:", applicationId, "} })");
} else {
  console.log("Would query: prisma.leaveApplication.findUnique({ where: { leave_application_id:", applicationId, "} })");
}
