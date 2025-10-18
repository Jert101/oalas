import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAdmin() {
  try {
    // Get the Admin role
    const adminRole = await prisma.role.findUnique({
      where: { name: 'Admin' }
    });
    
    if (!adminRole) {
      console.error('Admin role not found!');
      return;
    }
    
    console.log('Admin role found:', adminRole);
    
    // Get the Regular status
    const regularStatus = await prisma.status.findUnique({
      where: { name: 'Regular' }
    });
    
    if (!regularStatus) {
      console.error('Regular status not found!');
      return;
    }
    
    console.log('Regular status found:', regularStatus);
    
    // Update the admin user
    const updatedAdmin = await prisma.user.update({
      where: { email: 'admin@admin.com' },
      data: {
        role_id: adminRole.role_id,
        status_id: regularStatus.status_id
      },
      include: { role: true, status: true }
    });
    
    console.log('Updated admin user:', JSON.stringify(updatedAdmin, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdmin();
