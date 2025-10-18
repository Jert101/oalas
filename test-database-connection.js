const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  const prisma = new PrismaClient();
  
  console.log('🔍 Testing Database Connection...');
  console.log('=====================================');
  
  try {
    // Test 1: Basic connection
    console.log('1. Testing basic Prisma connection...');
    await prisma.$connect();
    console.log('✅ Prisma connected successfully');
    
    // Test 2: Test users table
    console.log('\n2. Testing users table...');
    const userCount = await prisma.users.count();
    console.log(`✅ Users table accessible, count: ${userCount}`);
    
    // Test 3: Test roles table
    console.log('\n3. Testing roles table...');
    const roleCount = await prisma.roles.count();
    console.log(`✅ Roles table accessible, count: ${roleCount}`);
    
    // Test 4: Test departments table
    console.log('\n4. Testing departments table...');
    const deptCount = await prisma.departments.count();
    console.log(`✅ Departments table accessible, count: ${deptCount}`);
    
    // Test 5: Test with include relationships
    console.log('\n5. Testing user with role relationship...');
    const userWithRole = await prisma.users.findFirst({
      include: {
        roles: true,
        departments: true
      }
    });
    console.log(`✅ User with relationships: ${userWithRole ? 'Found' : 'None found'}`);
    
    // Test 6: Test authentication query (the one that was failing)
    console.log('\n6. Testing authentication query...');
    const authUser = await prisma.users.findUnique({
      where: { email: 'test@example.com' },
      select: {
        users_id: true,
        roles: { select: { name: true } },
        isDepartmentHead: true,
        profilePicture: true,
      }
    });
    console.log(`✅ Authentication query works: ${authUser ? 'User found' : 'User not found (expected)'}`);
    
    console.log('\n🎉 All database tests passed!');
    
  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();

