const { PrismaClient } = require('@prisma/client')

async function fixLeaveTypesTable() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔧 Fixing leave_types table datetime issues...')
    
    // Use raw SQL to fix the datetime issue and check the data
    const result = await prisma.$queryRaw`
      UPDATE leave_types 
      SET updatedAt = NOW() 
      WHERE updatedAt IS NULL OR updatedAt = '0000-00-00 00:00:00'
    `
    
    console.log('✅ Fixed datetime issues')
    
    // Now get the data
    const leaveTypes = await prisma.$queryRaw`
      SELECT leave_type_id, name, description, isActive, createdAt, updatedAt 
      FROM leave_types 
      ORDER BY leave_type_id
    `
    
    console.log('\n📋 Current leave types:')
    leaveTypes.forEach(type => {
      console.log(`  - ID: ${type.leave_type_id}, Name: ${type.name}, Description: ${type.description}`)
    })
    
    // Check if Travel Order exists
    const travelOrderExists = leaveTypes.some(type => type.name === 'TRAVEL_ORDER')
    
    if (!travelOrderExists) {
      console.log('\n🔄 Adding Travel Order...')
      await prisma.$queryRaw`
        INSERT INTO leave_types (name, description, isActive, createdAt, updatedAt) 
        VALUES ('TRAVEL_ORDER', 'Travel Order', true, NOW(), NOW())
      `
      console.log('✅ Travel Order added!')
    } else {
      console.log('\n✓ Travel Order already exists')
    }
    
    // Show final count
    const finalTypes = await prisma.$queryRaw`
      SELECT name FROM leave_types ORDER BY leave_type_id
    `
    
    console.log('\n📊 All leave types:')
    finalTypes.forEach(type => {
      console.log(`  - ${type.name}`)
    })
    
    console.log('\n✅ Leave types setup complete!')
    
  } catch (error) {
    console.error('❌ Error fixing leave types:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixLeaveTypesTable()
