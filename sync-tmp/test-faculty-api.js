const fetch = require('node-fetch');

async function testFacultyAPI() {
  try {
    console.log('🧪 Testing Dean Faculty API...');
    
    // Test the faculty endpoint
    const response = await fetch('http://localhost:3000/api/dean/faculty', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ API Test Passed!');
      console.log(`📈 Found ${data.data.totalCount} faculty members`);
      console.log(`🏢 Department: ${data.data.department}`);
      
      if (data.data.faculty.length > 0) {
        console.log('👥 Faculty Members:');
        data.data.faculty.forEach((member, index) => {
          console.log(`  ${index + 1}. ${member.name} (${member.role.name}) - ${member.status.name}`);
        });
      }
    } else {
      console.log('❌ API Test Failed!');
      console.log('Error:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testFacultyAPI();













