const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRoles() {
  try {
    const roles = await prisma.role.findMany({
      select: { role_id: true, name: true }
    });
    console.log('Available roles:', roles);
    
    const users = await prisma.user.findMany({
      where: { 
        OR: [
          { email: { contains: 'dean' } },
          { email: { contains: 'Dean' } }
        ]
      },
      include: { role: true }
    });
    console.log('Dean users:', users.map(u => ({ email: u.email, role: u.role.name })));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoles();
