// Test script to check Google authentication and user database status
async function testGoogleAuth() {
  console.log('🧪 Testing Google Authentication Flow...\n');

  // Test with a sample CKCM email - replace with actual email
  const testEmail = 'test@ckcm.edu.ph'; // Replace with actual CKCM email
  
  try {
    console.log(`1. Testing user existence in database for: ${testEmail}`);
    
    // Test if user exists in database
    const userResponse = await fetch(`http://localhost:3000/api/auth/check-user?email=${encodeURIComponent(testEmail)}`);
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('📋 User data:', userData);
      
      if (userData.exists) {
        console.log('✅ User exists in database');
        console.log('📊 User status:', userData.user);
      } else {
        console.log('❌ User does not exist in database');
      }
    } else {
      console.log('❌ Failed to check user existence');
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Test account setup request status
async function testSetupRequest() {
  console.log('\n2. Testing account setup request status...');
  
  const testEmail = 'test@ckcm.edu.ph'; // Replace with actual email
  
  try {
    const response = await fetch(`http://localhost:3000/api/auth/check-approval?email=${encodeURIComponent(testEmail)}`);
    const data = await response.json();
    
    console.log('📋 Setup request status:', data);
    
    if (response.ok) {
      console.log('✅ Setup request check successful');
      console.log('📊 Status:', data.status);
    } else {
      console.error('❌ Setup request check failed');
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Run tests
async function runTests() {
  await testGoogleAuth();
  await testSetupRequest();
}

runTests();








