// Test script to check session data
console.log('🧪 Testing Session Data...')

// This script will help verify if the session is properly populated
// Run this after implementing the fixes to see if profile picture and user ID are working

console.log('📋 To test the fixes:')
console.log('1. Create a new account via Google OAuth')
console.log('2. Check browser console for NextAuth JWT logs')
console.log('3. Verify profile picture displays in sidebar')
console.log('4. Verify user ID shows instead of "N/A"')

console.log('\n🔍 Expected console logs:')
console.log('- [NextAuth] JWT: Fetched fresh user data from database')
console.log('- [setup-request] Profile picture resolution')
console.log('- [AppSidebar] Session data')

console.log('\n✅ Success indicators:')
console.log('- Profile picture displays in sidebar (not fallback avatar)')
console.log('- User ID shows actual ID (not "N/A")')
console.log('- Session contains profilePicture and userId fields')






