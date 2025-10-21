const https = require('https');

async function testAPICall() {
  try {
    console.log('🔍 Testing API call to dean reports...');
    
    const options = {
      hostname: 'ckcm-oala.site',
      port: 443,
      path: '/api/dean/reports?type=detailed&page=1&limit=2',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      console.log('📡 API Response Status:', res.statusCode);
      console.log('📡 API Response Headers:', res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('📋 API Response:', JSON.stringify(response, null, 2));
          
          if (response.applications && response.applications.length > 0) {
            const firstApp = response.applications[0];
            console.log('\n🔍 First Application Details:');
            console.log('  - ID:', firstApp.leave_application_id);
            console.log('  - User:', firstApp.user?.name);
            console.log('  - Calendar Period ID:', firstApp.calendar_period_id);
            console.log('  - Calendar Period:', firstApp.calendarPeriod);
            console.log('  - Academic Year:', firstApp.calendarPeriod?.academicYear);
          }
        } catch (error) {
          console.error('❌ Error parsing response:', error);
          console.log('Raw response:', data);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error);
    });
    
    req.end();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAPICall();
