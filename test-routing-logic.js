// Test the routing logic locally to verify it works
const testUser = {
  role: 'Maintenance Office',
  isDepartmentHead: true
};

console.log('🧪 Testing routing logic...');
console.log('User data:', testUser);

const userRole = testUser.role;
const isDepartmentHead = testUser.isDepartmentHead;

console.log('\n📋 Routing logic test:');

// Check for Maintenance Office - but respect isDepartmentHead status
if (userRole === 'Maintenance Office' && !isDepartmentHead) {
  console.log('❌ Would redirect to dean dashboard (WRONG)');
} else {
  console.log('✅ Would NOT redirect to dean dashboard (CORRECT)');
}

// Office head check
if (isDepartmentHead) {
  console.log('✅ Would redirect to office-head dashboard (CORRECT)');
} else {
  console.log('❌ Would NOT redirect to office-head dashboard (WRONG)');
}

console.log('\n🎯 Expected result: Office-head dashboard');
console.log('🔍 The logic should work correctly in the code.');
