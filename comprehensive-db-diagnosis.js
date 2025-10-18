const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

async function comprehensiveDiagnosis() {
  console.log('🔍 COMPREHENSIVE DATABASE CONNECTION DIAGNOSIS');
  console.log('===============================================');
  
  // Step 1: Environment Variables
  console.log('\n📋 STEP 1: Environment Variables');
  console.log('---------------------------------');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
  console.log('DB_HOST:', process.env.DB_HOST || 'NOT SET');
  console.log('DB_USER:', process.env.DB_USER || 'NOT SET');
  console.log('DB_PASS:', process.env.DB_PASS ? 'SET' : 'NOT SET');
  console.log('DB_NAME:', process.env.DB_NAME || 'NOT SET');
  
  if (process.env.DATABASE_URL) {
    // Parse DATABASE_URL to show components (without password)
    const url = process.env.DATABASE_URL;
    const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (match) {
      console.log('Parsed DATABASE_URL:');
      console.log('  User:', match[1]);
      console.log('  Password:', match[2] ? '***SET***' : 'NOT SET');
      console.log('  Host:', match[3]);
      console.log('  Port:', match[4]);
      console.log('  Database:', match[5]);
    }
  }
  
  // Step 2: Direct MySQL Connection Test
  console.log('\n🔌 STEP 2: Direct MySQL Connection Test');
  console.log('---------------------------------------');
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'oalass_app',
      password: 'oalass123',
      database: 'oalass'
    });
    
    console.log('✅ Direct MySQL connection successful');
    
    // Test basic query
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log('✅ Users table accessible, count:', rows[0].count);
    
    // Test database info
    const [dbInfo] = await connection.execute('SELECT DATABASE() as current_db, USER() as current_user');
    console.log('✅ Current database:', dbInfo[0].current_db);
    console.log('✅ Current user:', dbInfo[0].current_user);
    
    await connection.end();
  } catch (error) {
    console.log('❌ Direct MySQL connection failed:', error.message);
    console.log('Error code:', error.code);
    console.log('Error errno:', error.errno);
  }
  
  // Step 3: Prisma Client Test
  console.log('\n🔧 STEP 3: Prisma Client Test');
  console.log('------------------------------');
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    console.log('Testing Prisma connection...');
    await prisma.$connect();
    console.log('✅ Prisma client connected successfully');
    
    // Test basic query
    const userCount = await prisma.users.count();
    console.log('✅ Prisma users count:', userCount);
    
    // Test with relationships
    console.log('Testing user with relationships...');
    const userWithRelations = await prisma.users.findFirst({
      include: {
        roles: true,
        departments: true,
        statuses: true
      }
    });
    
    if (userWithRelations) {
      console.log('✅ User with relationships found:');
      console.log('  - Name:', userWithRelations.name);
      console.log('  - Role:', userWithRelations.roles?.name || 'None');
      console.log('  - Department:', userWithRelations.departments?.name || 'None');
      console.log('  - Status:', userWithRelations.statuses?.name || 'None');
    } else {
      console.log('⚠️  No users found in database');
    }
    
    // Test authentication query (the one that was failing)
    console.log('Testing authentication query...');
    const authUser = await prisma.users.findUnique({
      where: { email: 'admin@example.com' },
      select: {
        users_id: true,
        roles: { select: { name: true } },
        isDepartmentHead: true,
        profilePicture: true,
      }
    });
    console.log('✅ Authentication query works:', authUser ? 'User found' : 'User not found (expected)');
    
  } catch (error) {
    console.log('❌ Prisma connection failed:');
    console.log('Error:', error.message);
    console.log('Code:', error.code);
    console.log('Meta:', error.meta);
    console.log('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
  
  // Step 4: Database Schema Verification
  console.log('\n📊 STEP 4: Database Schema Verification');
  console.log('----------------------------------------');
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'oalass_app',
      password: 'oalass123',
      database: 'oalass'
    });
    
    // Check if all required tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    console.log('✅ Available tables:', tableNames.join(', '));
    
    const requiredTables = ['users', 'roles', 'departments', 'statuses', 'notifications', 'probations'];
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length === 0) {
      console.log('✅ All required tables exist');
    } else {
      console.log('❌ Missing tables:', missingTables.join(', '));
    }
    
    // Check users table structure
    const [userColumns] = await connection.execute('DESCRIBE users');
    console.log('✅ Users table columns:');
    userColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
    await connection.end();
  } catch (error) {
    console.log('❌ Schema verification failed:', error.message);
  }
  
  // Step 5: Network and Port Test
  console.log('\n🌐 STEP 5: Network and Port Test');
  console.log('--------------------------------');
  try {
    const net = require('net');
    const socket = new net.Socket();
    
    await new Promise((resolve, reject) => {
      socket.connect(3306, '127.0.0.1', () => {
        console.log('✅ Port 3306 is accessible');
        socket.destroy();
        resolve();
      });
      
      socket.on('error', (error) => {
        console.log('❌ Port 3306 connection failed:', error.message);
        reject(error);
      });
      
      socket.setTimeout(5000, () => {
        console.log('❌ Port 3306 connection timeout');
        socket.destroy();
        reject(new Error('Timeout'));
      });
    });
  } catch (error) {
    console.log('❌ Network test failed:', error.message);
  }
  
  console.log('\n🎯 DIAGNOSIS COMPLETE');
  console.log('=====================');
}

comprehensiveDiagnosis().catch(console.error);

