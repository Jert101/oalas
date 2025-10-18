const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('=== Term Types ===');
    const termTypes = await prisma.termType.findMany();
    console.log(termTypes);
    
    console.log('\n=== Leave Types ===');
    const leaveTypes = await prisma.leave_types.findMany();
    console.log(leaveTypes);
    
    console.log('\n=== Statuses ===');
    const statuses = await prisma.status.findMany();
    console.log(statuses);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
