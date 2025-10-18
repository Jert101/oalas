const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'jersoncatadman@ckcm.edu.ph' },
      select: {
        users_id: true,
        email: true,
        name: true,
        profilePicture: true
      }
    });
    
    console.log('=== DATABASE DIAGNOSIS ===');
    console.log('User found:', !!user);
    if (user) {
      console.log('users_id:', user.users_id);
      console.log('email:', user.email);
      console.log('name:', user.name);
      console.log('profilePicture:', user.profilePicture);
      console.log('profilePicture type:', typeof user.profilePicture);
      console.log('profilePicture length:', user.profilePicture ? user.profilePicture.length : 0);
      console.log('profilePicture starts with http:', user.profilePicture ? user.profilePicture.startsWith('http') : false);
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Database error:', error);
    await prisma.$disconnect();
  }
}

diagnose();





