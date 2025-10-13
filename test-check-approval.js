// Test script to check the approval status API
async function testCheckApproval() {
  console.log('🧪 Testing Check Approval API...\n');

  // Test with a sample email - replace with actual email from your system
  const testEmail = 'test@example.com'; // Replace with actual email
  
  try {
    console.log(`1. Testing check-approval API for email: ${testEmail}`);
    
    const response = await fetch(`http://localhost:3000/api/auth/check-approval?email=${encodeURIComponent(testEmail)}`);
    const data = await response.json();
    
    console.log('📋 Response status:', response.status);
    console.log('📋 Response data:', data);
    
    if (response.ok) {
      console.log('✅ API call successful');
      console.log('📊 Status:', data.status);
      
      if (data.user) {
        console.log('👤 User data:', data.user);
      }
      
      if (data.requestId) {
        console.log('🆔 Request ID:', data.requestId);
      }
    } else {
      console.error('❌ API call failed');
      console.error('🚨 Error:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Test database connection
async function testDatabaseConnection() {
  console.log('\n2. Testing database connection...');
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/pending-accounts');
    const data = await response.json();
    
    console.log('📋 Pending accounts response:', data);
    
    if (response.ok) {
      console.log('✅ Database connection successful');
      console.log(`📊 Found ${data.requests?.length || 0} pending requests`);
    } else {
      console.error('❌ Database connection failed');
      console.error('🚨 Error:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Run tests
async function runTests() {
  await testCheckApproval();
  await testDatabaseConnection();
}

runTests();








