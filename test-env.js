// Test environment variables loading
const https = require('https');
const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

async function testEnvironmentVariables() {
  console.log('🔍 TESTING ENVIRONMENT VARIABLES\n');

  try {
    // Test a simple API endpoint that should show environment variables
    console.log('=== Testing Environment Variables ===');
    
    // Create a simple test endpoint to check env vars
    const testResponse = await makeRequest('http://localhost:3000/api/auth/providers');
    console.log('Providers API Status:', testResponse.status);
    
    if (testResponse.status === 200) {
      try {
        const data = JSON.parse(testResponse.data);
        console.log('Available Providers:', Object.keys(data));
        
        if (data.google) {
          console.log('✅ Google provider is configured');
          console.log('Google Config:', data.google);
        } else {
          console.log('❌ Google provider is NOT configured');
        }
        
        if (data.github) {
          console.log('✅ GitHub provider is configured');
        } else {
          console.log('❌ GitHub provider is NOT configured');
        }
        
        if (data.credentials) {
          console.log('✅ Credentials provider is configured');
        } else {
          console.log('❌ Credentials provider is NOT configured');
        }
        
      } catch (parseError) {
        console.log('❌ Could not parse providers response');
        console.log('Response data:', testResponse.data.substring(0, 200));
      }
    } else {
      console.log('❌ Providers API failed');
    }

  } catch (error) {
    console.error('Test Error:', error.message);
  }
}

testEnvironmentVariables();








