const { PrismaClient } = require('@prisma/client');

async function diagnoseDatabaseIssue() {
  console.log('🔍 DATABASE CONNECTION DIAGNOSTIC');
  console.log('==================================');
  
  // Check environment variables
  console.log('\n1. Environment Variables:');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
  
  if (process.env.DATABASE_URL) {
    // Hide password in URL for security
    const url = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@');
    console.log('DATABASE_URL (masked):', url);
  }
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    console.log('\n2. Testing Prisma Connection...');
    await prisma.$connect();
    console.log('✅ Prisma client connected successfully');
    
    console.log('\n3. Testing Database Tables...');
    
    // Test each table individually
    const tables = [
      'users', 'roles', 'departments', 'statuses', 
      'notifications', 'probations', 'accounts'
    ];
    
    for (const table of tables) {
      try {
        const count = await prisma[table].count();
        console.log(`✅ ${table}: ${count} records`);
      } catch (error) {
        console.log(`❌ ${table}: ${error.message}`);
      }
    }
    
    console.log('\n4. Testing Relationships...');
    
    // Test user with relationships
    try {
      const userWithRelations = await prisma.users.findFirst({
        include: {
          roles: true,
          departments: true,
          statuses: true
        }
      });
      console.log('✅ User relationships work');
      if (userWithRelations) {
        console.log(`   - User: ${userWithRelations.name}`);
        console.log(`   - Role: ${userWithRelations.roles?.name || 'None'}`);
        console.log(`   - Department: ${userWithRelations.departments?.name || 'None'}`);
      }
    } catch (error) {
      console.log('❌ User relationships failed:', error.message);
    }
    
    console.log('\n5. Testing Authentication Query...');
    try {
      const authQuery = await prisma.users.findUnique({
        where: { email: 'admin@example.com' },
        select: {
          users_id: true,
          roles: { select: { name: true } },
          isDepartmentHead: true,
          profilePicture: true,
        }
      });
      console.log('✅ Authentication query works');
    } catch (error) {
      console.log('❌ Authentication query failed:', error.message);
    }
    
    console.log('\n🎉 Database diagnostic completed successfully!');
    
  } catch (error) {
    console.log('\n❌ CRITICAL DATABASE ERROR:');
    console.log('Error:', error.message);
    console.log('Code:', error.code);
    console.log('Meta:', error.meta);
    console.log('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseDatabaseIssue();

