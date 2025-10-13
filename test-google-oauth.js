// Test Google OAuth Flow - Comprehensive Debugging
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
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ 
          status: res.statusCode, 
          data: data, 
          headers: res.headers,
          url: res.url || url
        });
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

async function testGoogleOAuthFlow() {
  console.log('🔍 TESTING GOOGLE OAUTH FLOW\n');

  try {
    // Step 1: Test the signin page
    console.log('=== STEP 1: Test Google Signin Page ===');
    const signinResponse = await makeRequest('http://localhost:3000/api/auth/signin/google');
    console.log('Signin Status:', signinResponse.status);
    console.log('Signin Location:', signinResponse.headers.location);
    
    if (signinResponse.headers.location) {
      if (signinResponse.headers.location.includes('error=google')) {
        console.log('❌ Google OAuth is failing with error');
        console.log('🔗 Error URL:', signinResponse.headers.location);
      } else if (signinResponse.headers.location.includes('accounts.google.com')) {
        console.log('✅ Google OAuth URL generated successfully');
        console.log('🔗 OAuth URL:', signinResponse.headers.location);
      } else {
        console.log('⚠️ Unexpected redirect:', signinResponse.headers.location);
      }
    } else {
      console.log('❌ No OAuth URL generated');
    }

    // Step 2: Test the callback URL structure
    console.log('\n=== STEP 2: Test Callback URL ===');
    const callbackUrl = 'http://localhost:3000/api/auth/callback/google?code=test_code&state=test_state';
    const callbackResponse = await makeRequest(callbackUrl);
    console.log('Callback Status:', callbackResponse.status);
    console.log('Callback Response Length:', callbackResponse.data.length);

    // Step 3: Test session after potential callback
    console.log('\n=== STEP 3: Test Session ===');
    const sessionResponse = await makeRequest('http://localhost:3000/api/auth/session');
    console.log('Session Status:', sessionResponse.status);
    console.log('Session Data:', sessionResponse.data);

    // Step 4: Test with a real CKCM email simulation
    console.log('\n=== STEP 4: Test CKCM Email Check ===');
    const testEmail = 'test@ckcm.edu.ph';
    
    // Check if user exists
    const userCheck = await makeRequest(`http://localhost:3000/api/auth/check-user?email=${encodeURIComponent(testEmail)}`);
    console.log('User Check Status:', userCheck.status);
    console.log('User Check Data:', userCheck.data);

    // Check approval status
    const approvalCheck = await makeRequest(`http://localhost:3000/api/auth/check-approval?email=${encodeURIComponent(testEmail)}`);
    console.log('Approval Check Status:', approvalCheck.status);
    console.log('Approval Check Data:', approvalCheck.data);

    // Step 5: Test the auth configuration
    console.log('\n=== STEP 5: Test Auth Configuration ===');
    const providersResponse = await makeRequest('http://localhost:3000/api/auth/providers');
    console.log('Providers Status:', providersResponse.status);
    if (providersResponse.status === 200) {
      try {
        const data = JSON.parse(providersResponse.data);
        console.log('Google Provider Config:', data.google);
      } catch (e) {
        console.log('Could not parse providers response');
      }
    }

    // Step 6: Test error handling
    console.log('\n=== STEP 6: Test Error Handling ===');
    const errorResponse = await makeRequest('http://localhost:3000/api/auth/signin/google?error=access_denied');
    console.log('Error Test Status:', errorResponse.status);
    console.log('Error Test Location:', errorResponse.headers.location);

  } catch (error) {
    console.error('Test Error:', error.message);
  }
}

// Test the actual authentication flow
async function testRealAuthFlow() {
  console.log('\n🔐 TESTING REAL AUTHENTICATION FLOW\n');

  try {
    // Test the main login page
    console.log('=== Testing Main Login Page ===');
    const loginPage = await makeRequest('http://localhost:3000/');
    console.log('Login Page Status:', loginPage.status);
    console.log('Login Page Contains Google Button:', loginPage.data.includes('Continue with Google'));
    console.log('Login Page Contains OAuth Section:', loginPage.data.includes('Or continue with'));

    // Test the setup account page
    console.log('\n=== Testing Setup Account Page ===');
    const setupPage = await makeRequest('http://localhost:3000/auth/setup-account');
    console.log('Setup Page Status:', setupPage.status);
    console.log('Setup Page Loaded:', setupPage.data.length > 1000);

    // Test the pending approval page
    console.log('\n=== Testing Pending Approval Page ===');
    const pendingPage = await makeRequest('http://localhost:3000/auth/pending-approval');
    console.log('Pending Page Status:', pendingPage.status);
    console.log('Pending Page Loaded:', pendingPage.data.length > 1000);

  } catch (error) {
    console.error('Real Auth Flow Error:', error.message);
  }
}

async function runAllTests() {
  await testGoogleOAuthFlow();
  await testRealAuthFlow();
}

runAllTests();
