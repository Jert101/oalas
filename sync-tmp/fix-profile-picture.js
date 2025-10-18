const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixProfilePicture() {
  try {
    // You'll need to provide a valid access token from your Google sign-in
    // For now, let's try to get a fresh profile picture from Google's userinfo endpoint
    
    console.log('=== FIXING PROFILE PICTURE ===');
    
    // First, let's try a generic Google profile picture URL format
    // Google often provides different sized versions
    const currentUrl = await prisma.user.findUnique({
      where: { email: 'jersoncatadman@ckcm.edu.ph' },
      select: { profilePicture: true }
    });
    
    if (currentUrl?.profilePicture) {
      console.log('Current URL:', currentUrl.profilePicture);
      
      // Try to extract the base URL and add size parameter
      const baseUrlMatch = currentUrl.profilePicture.match(/https:\/\/lh3\.googleusercontent\.com\/a-\/([^?]+)/);
      if (baseUrlMatch) {
        const newUrl = `https://lh3.googleusercontent.com/a-/${baseUrlMatch[1]}=s96-c`;
        console.log('Trying new URL with size parameter:', newUrl);
        
        // Test the new URL
        try {
          const response = await fetch(newUrl, { method: 'HEAD' });
          console.log('New URL is valid:', response.ok);
          console.log('Response status:', response.status);
          
          if (response.ok) {
            // Update the database with the working URL
            await prisma.user.update({
              where: { email: 'jersoncatadman@ckcm.edu.ph' },
              data: { profilePicture: newUrl }
            });
            console.log('✅ Database updated with working URL:', newUrl);
          }
        } catch (error) {
          console.log('New URL test failed:', error.message);
        }
      }
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

fixProfilePicture();





