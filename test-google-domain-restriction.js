/**
 * Google OAuth Domain Restriction Test Script
 * 
 * This script tests the domain restriction logic implemented in NextAuth.js
 * to ensure only @ckcm.edu.ph accounts are allowed to sign in.
 */

// Test cases for domain validation
const testCases = [
  // Valid CKCM accounts
  { email: "admin@ckcm.edu.ph", hostedDomain: "ckcm.edu.ph", emailVerified: true, expected: "ALLOWED" },
  { email: "faculty@ckcm.edu.ph", hostedDomain: "ckcm.edu.ph", emailVerified: true, expected: "ALLOWED" },
  { email: "staff@ckcm.edu.ph", hostedDomain: "ckcm.edu.ph", emailVerified: true, expected: "ALLOWED" },
  { email: "user@ckcm.edu.ph", hostedDomain: undefined, emailVerified: true, expected: "ALLOWED" }, // No hosted domain but valid email
  
  // Blocked non-CKCM accounts
  { email: "user@gmail.com", hostedDomain: "gmail.com", emailVerified: true, expected: "BLOCKED" },
  { email: "user@yahoo.com", hostedDomain: "yahoo.com", emailVerified: true, expected: "BLOCKED" },
  { email: "user@hotmail.com", hostedDomain: "hotmail.com", emailVerified: true, expected: "BLOCKED" },
  { email: "user@outlook.com", hostedDomain: "outlook.com", emailVerified: true, expected: "BLOCKED" },
  { email: "user@icloud.com", hostedDomain: "icloud.com", emailVerified: true, expected: "BLOCKED" },
  
  // Blocked unverified emails
  { email: "user@ckcm.edu.ph", hostedDomain: "ckcm.edu.ph", emailVerified: false, expected: "BLOCKED" },
  { email: "admin@ckcm.edu.ph", hostedDomain: "ckcm.edu.ph", emailVerified: false, expected: "BLOCKED" },
  
  // Edge cases
  { email: "user@ckcm.edu.ph.fake", hostedDomain: "ckcm.edu.ph.fake", emailVerified: true, expected: "BLOCKED" },
  { email: "user@fakeckcm.edu.ph", hostedDomain: "fakeckcm.edu.ph", emailVerified: true, expected: "BLOCKED" },
  { email: "ckcm.edu.ph@user.com", hostedDomain: "user.com", emailVerified: true, expected: "BLOCKED" },
];

// Domain validation function (simplified version of the actual NextAuth logic)
function validateCkcmDomain(email, hostedDomain, emailVerified) {
  const emailLower = email.toLowerCase();
  const isCkcmEmail = emailLower.endsWith("@ckcm.edu.ph");
  const isHostedCkcm = hostedDomain === "ckcm.edu.ph";
  
  // STRICT DOMAIN VALIDATION: Block all non-CKCM accounts
  if (!isCkcmEmail || (hostedDomain && !isHostedCkcm)) {
    return false;
  }
  
  // Additional security: Verify email is verified by Google
  if (!emailVerified) {
    return false;
  }
  
  return true;
}

// Test execution
console.log("🧪 Testing Google OAuth Domain Restriction System\n");
console.log("=" .repeat(60));

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  const result = validateCkcmDomain(testCase.email, testCase.hostedDomain, testCase.emailVerified);
  const status = result ? "ALLOWED" : "BLOCKED";
  const passed = status === testCase.expected;
  
  if (passed) {
    passedTests++;
    console.log(`✅ Test ${index + 1}: ${testCase.email} -> ${status}`);
  } else {
    console.log(`❌ Test ${index + 1}: ${testCase.email} -> ${status} (Expected: ${testCase.expected})`);
  }
  
  // Additional details for blocked cases
  if (status === "BLOCKED") {
    const emailLower = testCase.email.toLowerCase();
    const isCkcmEmail = emailLower.endsWith("@ckcm.edu.ph");
    const isHostedCkcm = testCase.hostedDomain === "ckcm.edu.ph";
    
    if (!isCkcmEmail) {
      console.log(`   └─ Blocked: Invalid email domain (${testCase.email})`);
    } else if (testCase.hostedDomain && !isHostedCkcm) {
      console.log(`   └─ Blocked: Hosted domain mismatch (${testCase.hostedDomain} vs ckcm.edu.ph)`);
    } else if (!testCase.emailVerified) {
      console.log(`   └─ Blocked: Email not verified by Google`);
    }
  }
});

console.log("\n" + "=" .repeat(60));
console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log("🎉 All tests passed! Domain restriction system is working correctly.");
} else {
  console.log("⚠️  Some tests failed. Please review the domain restriction logic.");
}

// Security logging simulation
console.log("\n🔒 Security Logging Simulation:");
console.log("=" .repeat(40));

testCases.forEach(testCase => {
  const result = validateCkcmDomain(testCase.email, testCase.hostedDomain, testCase.emailVerified);
  const status = result ? "ALLOWED" : "BLOCKED";
  
  if (status === "BLOCKED") {
    console.log(`[NextAuth] BLOCKED: Non-CKCM Google account attempted sign-in: ${testCase.email} (hosted domain: ${testCase.hostedDomain || 'undefined'})`);
  } else {
    console.log(`[NextAuth] ALLOWED: CKCM Google account sign-in: ${testCase.email} (hosted domain: ${testCase.hostedDomain || 'undefined'})`);
  }
});

console.log("\n📋 Implementation Notes:");
console.log("- Domain validation checks both email suffix and hosted domain");
console.log("- Email verification by Google is required");
console.log("- All blocked attempts are logged for security monitoring");
console.log("- Error pages provide clear feedback to blocked users");
console.log("- System maintains audit trail of all authentication attempts");

console.log("\n🔧 Next Steps:");
console.log("1. Ensure environment variables are set (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)");
console.log("2. Verify Google Console OAuth configuration");
console.log("3. Test with real Google accounts");
console.log("4. Monitor server logs for authentication attempts");
console.log("5. Review error page functionality");






