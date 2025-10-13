// Test Google OAuth Error - Specific Debugging
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
        resolve({ 
          status: res.statusCode, 
          data: data, 
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

async function testGoogleError() {
  console.log('🔍 TESTING GOOGLE OAUTH ERROR\n');

  try {
    // Test the Google signin endpoint
    console.log('=== Testing Google Signin Endpoint ===');
    const signinResponse = await makeRequest('http://localhost:3000/api/auth/signin/google');
    console.log('Signin Status:', signinResponse.status);
    console.log('Signin Location:', signinResponse.headers.location);
    
    if (signinResponse.headers.location) {
      const location = signinResponse.headers.location;
      console.log('🔗 Full redirect URL:', location);
      
      // Parse the error from the URL
      if (location.includes('error=')) {
        const errorMatch = location.match(/error=([^&]+)/);
        if (errorMatch) {
          const error = errorMatch[1];
          console.log('❌ Error found:', error);
          
          // Common Google OAuth errors and solutions
          switch (error) {
            case 'google':
              console.log('🔧 Solution: Check Google Cloud Console OAuth configuration');
              console.log('   - Verify Client ID and Client Secret');
              console.log('   - Check Authorized redirect URIs');
              console.log('   - Ensure OAuth consent screen is configured');
              break;
            case 'access_denied':
              console.log('🔧 Solution: User denied access or OAuth scope issues');
              break;
            case 'invalid_client':
              console.log('🔧 Solution: Invalid client ID or secret');
              break;
            case 'redirect_uri_mismatch':
              console.log('🔧 Solution: Redirect URI not authorized in Google Console');
              break;
            default:
              console.log('🔧 Unknown error, check Google Cloud Console logs');
          }
        }
      }
    }

    // Test the providers endpoint to see if Google is properly configured
    console.log('\n=== Testing Providers Configuration ===');
    const providersResponse = await makeRequest('http://localhost:3000/api/auth/providers');
    if (providersResponse.status === 200) {
      try {
        const data = JSON.parse(providersResponse.data);
        if (data.google) {
          console.log('✅ Google provider is configured');
          console.log('📋 Google Config:', JSON.stringify(data.google, null, 2));
        } else {
          console.log('❌ Google provider is NOT configured');
        }
      } catch (e) {
        console.log('❌ Could not parse providers response');
      }
    }

    // Test the main page to see if it loads properly
    console.log('\n=== Testing Main Page ===');
    const mainPageResponse = await makeRequest('http://localhost:3000/');
    console.log('Main Page Status:', mainPageResponse.status);
    console.log('Main Page Size:', mainPageResponse.data.length);
    
    // Check if the page contains the Google button
    const hasGoogleButton = mainPageResponse.data.includes('Continue with Google');
    console.log('Has Google Button:', hasGoogleButton);
    
    if (!hasGoogleButton) {
      console.log('🔍 Searching for OAuth content...');
      const hasOAuthSection = mainPageResponse.data.includes('Or continue with');
      console.log('Has OAuth Section:', hasOAuthSection);
      
      if (!hasOAuthSection) {
        console.log('❌ OAuth section is missing from the page');
        console.log('🔧 This might indicate a JavaScript error or missing provider');
      }
    }

  } catch (error) {
    console.error('Test Error:', error.message);
  }
}

testGoogleError();








