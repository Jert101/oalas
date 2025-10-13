const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function forceRefresh() {
  try {
    // Clear the current truncated URL to force a fresh fetch on next login
    await prisma.user.update({
      where: { email: 'jersoncatadman@ckcm.edu.ph' },
      data: { profilePicture: null }
    });
    
    console.log('✅ Cleared profile picture - will fetch fresh URL on next Google sign-in');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

forceRefresh();





