const { PrismaClient } = require('@prisma/client')

async function setupLeaveTypes() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Checking current leave types...')
    
    // Check current leave types
    const currentLeaveTypes = await prisma.leave_types.findMany()
    console.log(`📋 Current leave types: ${currentLeaveTypes.length}`)
    currentLeaveTypes.forEach(type => {
      console.log(`  - ${type.name} (ID: ${type.leave_type_id})`)
    })
    
    // Define all required leave types
    const requiredLeaveTypes = [
      { name: 'VACATION', description: 'Vacation Leave' },
      { name: 'SICK', description: 'Sick Leave' },
      { name: 'MATERNITY', description: 'Maternity Leave' },
      { name: 'PATERNITY', description: 'Paternity Leave' },
      { name: 'EMERGENCY', description: 'Emergency Leave' },
      { name: 'TRAVEL_ORDER', description: 'Travel Order' }
    ]
    
    console.log('\n🔄 Adding missing leave types...')
    
    // Add any missing leave types
    for (const leaveType of requiredLeaveTypes) {
      const existing = await prisma.leave_types.findFirst({
        where: { name: leaveType.name }
      })
      
      if (!existing) {
        const created = await prisma.leave_types.create({
          data: leaveType
        })
        console.log(`  ✅ Added: ${created.name} (ID: ${created.leave_type_id})`)
      } else {
        console.log(`  ✓ Exists: ${existing.name} (ID: ${existing.leave_type_id})`)
      }
    }
    
    // Show final leave types
    const finalLeaveTypes = await prisma.leave_types.findMany({
      orderBy: { leave_type_id: 'asc' }
    })
    
    console.log('\n📊 Final leave types:')
    finalLeaveTypes.forEach(type => {
      console.log(`  - ${type.name}: ${type.description} (ID: ${type.leave_type_id})`)
    })
    
    // Check leave limits
    const leaveLimits = await prisma.leaveLimit.count()
    console.log(`\n📋 Total leave limits: ${leaveLimits}`)
    
    console.log('\n✅ Leave types setup complete!')
    
  } catch (error) {
    console.error('❌ Error setting up leave types:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupLeaveTypes()
