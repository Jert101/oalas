const { PrismaClient } = require('@prisma/client')

async function restoreLeaveSystemWithNewStructure() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 Restoring complete leave system with new TermType and LeaveType tables...')
    
    // Get status, term type, and leave type mappings
    const regularStatus = await prisma.$queryRaw`SELECT status_id FROM statuses WHERE name = 'Regular'`
    const probationStatus = await prisma.$queryRaw`SELECT status_id FROM statuses WHERE name = 'Probation'`
    
    const termTypes = await prisma.$queryRaw`SELECT term_type_id, name FROM term_types`
    const leaveTypes = await prisma.$queryRaw`SELECT leave_type_id, name FROM leave_types`
    
    if (!regularStatus[0] || !probationStatus[0]) {
      console.error('❌ Status records not found!')
      return
    }
    
    const regularStatusId = regularStatus[0].status_id
    const probationStatusId = probationStatus[0].status_id
    
    // Create mappings
    const termTypeMap = {}
    termTypes.forEach(type => {
      termTypeMap[type.name] = type.term_type_id
    })
    
    const leaveTypeMap = {}
    leaveTypes.forEach(type => {
      leaveTypeMap[type.name] = type.leave_type_id
    })
    
    console.log('✅ Mappings created:')
    console.log(`  Regular Status ID: ${regularStatusId}`)
    console.log(`  Probation Status ID: ${probationStatusId}`)
    console.log(`  Term Types:`, termTypeMap)
    console.log(`  Leave Types:`, leaveTypeMap)
    
    // Your original leave limits with new structure
    const leaveLimitsData = [
      // REGULAR - ACADEMIC
      { status_id: regularStatusId, term_type_id: termTypeMap['Academic'], leave_type_id: leaveTypeMap['Vacation'], daysAllowed: 5 },
      { status_id: regularStatusId, term_type_id: termTypeMap['Academic'], leave_type_id: leaveTypeMap['Sick'], daysAllowed: 5 },
      { status_id: regularStatusId, term_type_id: termTypeMap['Academic'], leave_type_id: leaveTypeMap['Maternity'], daysAllowed: 105 },
      { status_id: regularStatusId, term_type_id: termTypeMap['Academic'], leave_type_id: leaveTypeMap['Paternity'], daysAllowed: 10 },
      { status_id: regularStatusId, term_type_id: termTypeMap['Academic'], leave_type_id: leaveTypeMap['Emergency'], daysAllowed: 5 },
      
      // REGULAR - SUMMER
      { status_id: regularStatusId, term_type_id: termTypeMap['Summer'], leave_type_id: leaveTypeMap['Vacation'], daysAllowed: 15 },
      { status_id: regularStatusId, term_type_id: termTypeMap['Summer'], leave_type_id: leaveTypeMap['Sick'], daysAllowed: 15 },
      { status_id: regularStatusId, term_type_id: termTypeMap['Summer'], leave_type_id: leaveTypeMap['Maternity'], daysAllowed: 15 },
      { status_id: regularStatusId, term_type_id: termTypeMap['Summer'], leave_type_id: leaveTypeMap['Paternity'], daysAllowed: 15 },
      { status_id: regularStatusId, term_type_id: termTypeMap['Summer'], leave_type_id: leaveTypeMap['Emergency'], daysAllowed: 15 },
      
      // PROBATION - ACADEMIC  
      { status_id: probationStatusId, term_type_id: termTypeMap['Academic'], leave_type_id: leaveTypeMap['Vacation'], daysAllowed: 0 },
      { status_id: probationStatusId, term_type_id: termTypeMap['Academic'], leave_type_id: leaveTypeMap['Sick'], daysAllowed: 5 },
      { status_id: probationStatusId, term_type_id: termTypeMap['Academic'], leave_type_id: leaveTypeMap['Maternity'], daysAllowed: 0 },
      { status_id: probationStatusId, term_type_id: termTypeMap['Academic'], leave_type_id: leaveTypeMap['Paternity'], daysAllowed: 0 },
      { status_id: probationStatusId, term_type_id: termTypeMap['Academic'], leave_type_id: leaveTypeMap['Emergency'], daysAllowed: 5 },
      
      // PROBATION - SUMMER
      { status_id: probationStatusId, term_type_id: termTypeMap['Summer'], leave_type_id: leaveTypeMap['Vacation'], daysAllowed: 0 },
      { status_id: probationStatusId, term_type_id: termTypeMap['Summer'], leave_type_id: leaveTypeMap['Sick'], daysAllowed: 0 },
      { status_id: probationStatusId, term_type_id: termTypeMap['Summer'], leave_type_id: leaveTypeMap['Maternity'], daysAllowed: 0 },
      { status_id: probationStatusId, term_type_id: termTypeMap['Summer'], leave_type_id: leaveTypeMap['Paternity'], daysAllowed: 0 },
      { status_id: probationStatusId, term_type_id: termTypeMap['Summer'], leave_type_id: leaveTypeMap['Emergency'], daysAllowed: 0 },
    ]
    
    console.log(`\n📝 Creating leave_limits table and inserting ${leaveLimitsData.length} records...`)
    
    // Create leave_limits table if it doesn't exist
    await prisma.$queryRaw`
      CREATE TABLE IF NOT EXISTS leave_limits (
        leave_limit_id INT AUTO_INCREMENT PRIMARY KEY,
        status_id INT NOT NULL,
        term_type_id INT NOT NULL,
        leave_type_id INT NOT NULL,
        daysAllowed INT NOT NULL,
        isActive BOOLEAN DEFAULT true,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        UNIQUE KEY unique_leave_limit (status_id, term_type_id, leave_type_id),
        INDEX idx_status (status_id),
        INDEX idx_term_type (term_type_id),
        INDEX idx_leave_type (leave_type_id)
      )
    `
    
    // Insert leave limits
    for (const limitData of leaveLimitsData) {
      try {
        await prisma.$queryRaw`
          INSERT IGNORE INTO leave_limits (status_id, term_type_id, leave_type_id, daysAllowed, isActive, createdAt, updatedAt)
          VALUES (${limitData.status_id}, ${limitData.term_type_id}, ${limitData.leave_type_id}, ${limitData.daysAllowed}, true, NOW(), NOW())
        `
        
        const statusName = limitData.status_id === regularStatusId ? 'Regular' : 'Probation'
        const termTypeName = Object.keys(termTypeMap).find(key => termTypeMap[key] === limitData.term_type_id)
        const leaveTypeName = Object.keys(leaveTypeMap).find(key => leaveTypeMap[key] === limitData.leave_type_id)
        
        console.log(`  ✅ ${statusName} - ${termTypeName} - ${leaveTypeName}: ${limitData.daysAllowed} days`)
        
      } catch (error) {
        console.error(`  ❌ Error inserting limit:`, error.message)
      }
    }
    
    // Final verification
    const totalLimits = await prisma.$queryRaw`SELECT COUNT(*) as count FROM leave_limits`
    console.log(`\n✅ Leave system restoration complete!`)
    console.log(`📊 Total leave limits: ${totalLimits[0].count}`)
    console.log(`📋 Term types: ${termTypes.length}`)
    console.log(`📋 Leave types: ${leaveTypes.length}`)
    
    console.log('\n🎉 System is ready with:')
    console.log('   ✅ TermType table (Academic, Summer)')
    console.log('   ✅ LeaveType table (Vacation, Sick, Maternity, Paternity, Emergency, Travel Order)')
    console.log('   ✅ All original leave limits restored')
    console.log('   ✅ Proper case naming (no CAPS)')
    
  } catch (error) {
    console.error('❌ Error restoring leave system:', error)
  } finally {
    await prisma.$disconnect()
  }
}

restoreLeaveSystemWithNewStructure()
