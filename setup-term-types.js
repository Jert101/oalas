const { PrismaClient } = require('@prisma/client')

async function setupTermTypesAndUpdateLeaveTypes() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 Setting up TermType table and updating naming conventions...')
    
    // Step 1: Create TermType table if it doesn't exist
    console.log('\n📋 Creating TermType table...')
    try {
      await prisma.$queryRaw`
        CREATE TABLE IF NOT EXISTS term_types (
          term_type_id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(191) NOT NULL UNIQUE,
          description VARCHAR(191),
          isActive BOOLEAN DEFAULT true,
          createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
          updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
        )
      `
      console.log('✅ TermType table created')
    } catch (error) {
      console.log('ℹ️ TermType table might already exist')
    }
    
    // Step 2: Insert term types with proper case
    console.log('\n📝 Setting up term types...')
    const termTypes = [
      { name: 'Academic', description: 'Academic Term' },
      { name: 'Summer', description: 'Summer Term' }
    ]
    
    for (const termType of termTypes) {
      try {
        await prisma.$queryRaw`
          INSERT IGNORE INTO term_types (name, description, isActive, createdAt, updatedAt)
          VALUES (${termType.name}, ${termType.description}, true, NOW(), NOW())
        `
        console.log(`  ✅ Added: ${termType.name}`)
      } catch (error) {
        console.log(`  ℹ️ ${termType.name} already exists`)
      }
    }
    
    // Step 3: Update leave types to proper case
    console.log('\n🔄 Updating leave types to proper case...')
    const leaveTypeUpdates = [
      { old: 'VACATION', new: 'Vacation', desc: 'Vacation Leave' },
      { old: 'SICK', new: 'Sick', desc: 'Sick Leave' },
      { old: 'MATERNITY', new: 'Maternity', desc: 'Maternity Leave' },
      { old: 'PATERNITY', new: 'Paternity', desc: 'Paternity Leave' },
      { old: 'EMERGENCY', new: 'Emergency', desc: 'Emergency Leave' },
      { old: 'TRAVEL_ORDER', new: 'Travel Order', desc: 'Travel Order' }
    ]
    
    for (const update of leaveTypeUpdates) {
      try {
        await prisma.$queryRaw`
          UPDATE leave_types 
          SET name = ${update.new}, description = ${update.desc}, updatedAt = NOW()
          WHERE name = ${update.old}
        `
        console.log(`  ✅ Updated: ${update.old} → ${update.new}`)
      } catch (error) {
        console.log(`  ⚠️ Could not update ${update.old}: ${error.message}`)
      }
    }
    
    // Step 4: Show final results
    console.log('\n📊 Final setup verification:')
    
    const termTypesResult = await prisma.$queryRaw`
      SELECT term_type_id, name, description FROM term_types ORDER BY term_type_id
    `
    console.log('\n📋 Term Types:')
    termTypesResult.forEach(type => {
      console.log(`  ${type.term_type_id}. ${type.name}: ${type.description}`)
    })
    
    const leaveTypesResult = await prisma.$queryRaw`
      SELECT leave_type_id, name, description FROM leave_types ORDER BY leave_type_id
    `
    console.log('\n📋 Leave Types:')
    leaveTypesResult.forEach(type => {
      console.log(`  ${type.leave_type_id}. ${type.name}: ${type.description}`)
    })
    
    console.log('\n✅ TermType table and naming updates complete!')
    console.log('⚠️ Note: You will need to run migration to update the database schema')
    
  } catch (error) {
    console.error('❌ Error setting up TermType table:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupTermTypesAndUpdateLeaveTypes()
