const { PrismaClient } = require('@prisma/client')

async function createLeaveTypesTable() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 Creating leave_types table and data...')
    
    // Create leave_types table
    await prisma.$queryRaw`
      CREATE TABLE IF NOT EXISTS leave_types (
        leave_type_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(191) NOT NULL UNIQUE,
        description VARCHAR(191),
        isActive BOOLEAN DEFAULT true,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      )
    `
    console.log('✅ leave_types table created')
    
    // Insert leave types
    const leaveTypes = [
      { name: 'Vacation', description: 'Vacation Leave' },
      { name: 'Sick', description: 'Sick Leave' },
      { name: 'Maternity', description: 'Maternity Leave' },
      { name: 'Paternity', description: 'Paternity Leave' },
      { name: 'Emergency', description: 'Emergency Leave' },
      { name: 'Travel Order', description: 'Travel Order' }
    ]
    
    for (const leaveType of leaveTypes) {
      await prisma.$queryRaw`
        INSERT IGNORE INTO leave_types (name, description, isActive, createdAt, updatedAt)
        VALUES (${leaveType.name}, ${leaveType.description}, true, NOW(), NOW())
      `
      console.log(`  ✅ Added: ${leaveType.name}`)
    }
    
    console.log('\n📊 Final verification:')
    const termTypes = await prisma.$queryRaw`SELECT term_type_id, name FROM term_types ORDER BY term_type_id`
    const leaveTypesResult = await prisma.$queryRaw`SELECT leave_type_id, name FROM leave_types ORDER BY leave_type_id`
    
    console.log('\n📋 Term Types:')
    termTypes.forEach(type => console.log(`  ${type.term_type_id}. ${type.name}`))
    
    console.log('\n📋 Leave Types:')
    leaveTypesResult.forEach(type => console.log(`  ${type.leave_type_id}. ${type.name}`))
    
    console.log('\n✅ Tables and data setup complete!')
    
  } catch (error) {
    console.error('❌ Error creating tables:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createLeaveTypesTable()
