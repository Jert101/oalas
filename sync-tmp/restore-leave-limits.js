const { PrismaClient } = require('@prisma/client')

async function restoreOriginalLeaveLimits() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 Restoring your original leave limits...')
    
    // Get status IDs
    const regularStatus = await prisma.status.findFirst({ where: { name: 'Regular' } })
    const probationStatus = await prisma.status.findFirst({ where: { name: 'Probation' } })
    
    if (!regularStatus || !probationStatus) {
      console.error('❌ Status records not found!')
      return
    }
    
    console.log(`✅ Found statuses: Regular (${regularStatus.status_id}), Probation (${probationStatus.status_id})`)
    
    // Your original leave limits data
    const leaveLimitsData = [
      // REGULAR - ACADEMIC
      { status_id: regularStatus.status_id, termType: 'ACADEMIC', leaveType: 'VACATION', daysAllowed: 5 },
      { status_id: regularStatus.status_id, termType: 'ACADEMIC', leaveType: 'SICK', daysAllowed: 5 },
      { status_id: regularStatus.status_id, termType: 'ACADEMIC', leaveType: 'MATERNITY', daysAllowed: 105 },
      { status_id: regularStatus.status_id, termType: 'ACADEMIC', leaveType: 'PATERNITY', daysAllowed: 10 },
      { status_id: regularStatus.status_id, termType: 'ACADEMIC', leaveType: 'EMERGENCY', daysAllowed: 5 },
      
      // REGULAR - SUMMER
      { status_id: regularStatus.status_id, termType: 'SUMMER', leaveType: 'VACATION', daysAllowed: 15 },
      { status_id: regularStatus.status_id, termType: 'SUMMER', leaveType: 'SICK', daysAllowed: 15 },
      { status_id: regularStatus.status_id, termType: 'SUMMER', leaveType: 'MATERNITY', daysAllowed: 15 },
      { status_id: regularStatus.status_id, termType: 'SUMMER', leaveType: 'PATERNITY', daysAllowed: 15 },
      { status_id: regularStatus.status_id, termType: 'SUMMER', leaveType: 'EMERGENCY', daysAllowed: 15 },
      
      // PROBATION - ACADEMIC
      { status_id: probationStatus.status_id, termType: 'ACADEMIC', leaveType: 'VACATION', daysAllowed: 0 },
      { status_id: probationStatus.status_id, termType: 'ACADEMIC', leaveType: 'SICK', daysAllowed: 5 },
      { status_id: probationStatus.status_id, termType: 'ACADEMIC', leaveType: 'MATERNITY', daysAllowed: 0 },
      { status_id: probationStatus.status_id, termType: 'ACADEMIC', leaveType: 'PATERNITY', daysAllowed: 0 },
      { status_id: probationStatus.status_id, termType: 'ACADEMIC', leaveType: 'EMERGENCY', daysAllowed: 5 },
      
      // PROBATION - SUMMER
      { status_id: probationStatus.status_id, termType: 'SUMMER', leaveType: 'VACATION', daysAllowed: 0 },
      { status_id: probationStatus.status_id, termType: 'SUMMER', leaveType: 'SICK', daysAllowed: 0 },
      { status_id: probationStatus.status_id, termType: 'SUMMER', leaveType: 'MATERNITY', daysAllowed: 0 },
      { status_id: probationStatus.status_id, termType: 'SUMMER', leaveType: 'PATERNITY', daysAllowed: 0 },
      { status_id: probationStatus.status_id, termType: 'SUMMER', leaveType: 'EMERGENCY', daysAllowed: 0 },
    ]
    
    console.log(`📝 Restoring ${leaveLimitsData.length} leave limit records...`)
    
    // Insert each leave limit (using upsert to avoid duplicates)
    for (const limitData of leaveLimitsData) {
      try {
        const result = await prisma.leaveLimit.upsert({
          where: {
            status_id_termType_leaveType: {
              status_id: limitData.status_id,
              termType: limitData.termType,
              leaveType: limitData.leaveType
            }
          },
          update: {
            daysAllowed: limitData.daysAllowed
          },
          create: limitData
        })
        
        const statusName = limitData.status_id === regularStatus.status_id ? 'Regular' : 'Probation'
        console.log(`  ✅ ${statusName} - ${limitData.termType} - ${limitData.leaveType}: ${limitData.daysAllowed} days`)
        
      } catch (error) {
        console.error(`  ❌ Error creating limit for ${limitData.termType} ${limitData.leaveType}:`, error.message)
      }
    }
    
    // Verify the data was restored
    const totalLimits = await prisma.leaveLimit.count()
    console.log(`\n✅ Leave limits restoration complete! Total limits in database: ${totalLimits}`)
    
    // Show a summary
    const regularLimits = await prisma.leaveLimit.findMany({
      where: { status_id: regularStatus.status_id },
      include: { status: true }
    })
    
    const probationLimits = await prisma.leaveLimit.findMany({
      where: { status_id: probationStatus.status_id },
      include: { status: true }
    })
    
    console.log(`\n📊 Summary:`)
    console.log(`  - Regular status limits: ${regularLimits.length}`)
    console.log(`  - Probation status limits: ${probationLimits.length}`)
    
  } catch (error) {
    console.error('❌ Error restoring leave limits:', error)
  } finally {
    await prisma.$disconnect()
  }
}

restoreOriginalLeaveLimits()
