// Comprehensive Authentication Flow Debugging Script
const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function debugAuthFlow() {
  console.log('🔍 DEEP AUTHENTICATION DEBUGGING STARTED\n');

  // Test with a real CKCM email - replace with actual email
  const testEmail = 'test@ckcm.edu.ph'; // Replace with actual CKCM email
  
  try {
    console.log('=== STEP 1: Check if user exists in database ===');
    const userResponse = await makeRequest(`http://localhost:3000/api/auth/check-user?email=${encodeURIComponent(testEmail)}`);
    console.log('User check response:', userResponse);

    console.log('\n=== STEP 2: Check approval status ===');
    const approvalResponse = await makeRequest(`http://localhost:3000/api/auth/check-approval?email=${encodeURIComponent(testEmail)}`);
    console.log('Approval check response:', approvalResponse);

    console.log('\n=== STEP 3: Check NextAuth session endpoint ===');
    try {
      const sessionResponse = await makeRequest('http://localhost:3000/api/auth/session');
      console.log('Session response:', sessionResponse);
    } catch (error) {
      console.log('Session check failed:', error.message);
    }

    console.log('\n=== STEP 4: Check NextAuth providers ===');
    try {
      const providersResponse = await makeRequest('http://localhost:3000/api/auth/providers');
      console.log('Providers response:', providersResponse);
    } catch (error) {
      console.log('Providers check failed:', error.message);
    }

    console.log('\n=== STEP 5: Check environment variables ===');
    console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
    console.log('GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
    console.log('NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'http://localhost:3000');

    console.log('\n=== STEP 6: Check database connection ===');
    try {
      const dbResponse = await makeRequest('http://localhost:3000/api/admin/pending-accounts');
      console.log('Database connection status:', dbResponse.status);
      if (dbResponse.status === 401) {
        console.log('Database accessible but requires auth');
      } else if (dbResponse.status === 200) {
        console.log('Database accessible');
      } else {
        console.log('Database connection issue');
      }
    } catch (error) {
      console.log('Database check failed:', error.message);
    }

  } catch (error) {
    console.error('Debug error:', error);
  }
}

// Test middleware behavior
async function testMiddleware() {
  console.log('\n=== STEP 7: Test middleware behavior ===');
  
  try {
    // Test dashboard access without auth
    const dashboardResponse = await makeRequest('http://localhost:3000/dashboard');
    console.log('Dashboard redirect status:', dashboardResponse.status);
    console.log('Dashboard redirect location:', dashboardResponse.headers.location);
    
    // Test auth pages access
    const authResponse = await makeRequest('http://localhost:3000/auth/setup-account');
    console.log('Auth page status:', authResponse.status);
    
  } catch (error) {
    console.log('Middleware test failed:', error.message);
  }
}

// Test OAuth flow simulation
async function testOAuthFlow() {
  console.log('\n=== STEP 8: Test OAuth flow simulation ===');
  
  try {
    // Test signin endpoint
    const signinResponse = await makeRequest('http://localhost:3000/api/auth/signin/google');
    console.log('Google signin endpoint status:', signinResponse.status);
    console.log('Google signin location:', signinResponse.headers.location);
    
  } catch (error) {
    console.log('OAuth test failed:', error.message);
  }
}

async function runAllTests() {
  await debugAuthFlow();
  await testMiddleware();
  await testOAuthFlow();
}

runAllTests();
