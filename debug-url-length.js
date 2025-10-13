const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'jersoncatadman@ckcm.edu.ph' },
      select: {
        profilePicture: true
      }
    });
    
    console.log('=== URL LENGTH DIAGNOSIS ===');
    if (user?.profilePicture) {
      console.log('DB URL length:', user.profilePicture.length);
      console.log('DB URL complete:', user.profilePicture);
      console.log('DB URL ends with:', user.profilePicture.slice(-20));
      
      // Test if the URL is valid by making a simple fetch
      console.log('\n=== TESTING URL VALIDITY ===');
      try {
        const response = await fetch(user.profilePicture, { method: 'HEAD' });
        console.log('URL is valid:', response.ok);
        console.log('Response status:', response.status);
        console.log('Content-Type:', response.headers.get('content-type'));
      } catch (error) {
        console.log('URL fetch failed:', error.message);
      }
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Database error:', error);
    await prisma.$disconnect();
  }
}

diagnose();





