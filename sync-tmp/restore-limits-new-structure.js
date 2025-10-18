const { PrismaClient } = require('@prisma/client')

async function restoreOriginalLeaveLimitsWithNewStructure() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 Restoring your original leave limits with new LeaveType table structure...')
    
    // Get status IDs
    const regularStatus = await prisma.$queryRaw`SELECT status_id FROM statuses WHERE name = 'Regular'`
    const probationStatus = await prisma.$queryRaw`SELECT status_id FROM statuses WHERE name = 'Probation'`
    
    if (!regularStatus[0] || !probationStatus[0]) {
      console.error('❌ Status records not found!')
      return
    }
    
    const regularStatusId = regularStatus[0].status_id
    const probationStatusId = probationStatus[0].status_id
    
    console.log(`✅ Found statuses: Regular (${regularStatusId}), Probation (${probationStatusId})`)
    
    // Get leave type IDs
    const leaveTypes = await prisma.$queryRaw`SELECT leave_type_id, name FROM leave_types`
    const leaveTypeMap = {}
    leaveTypes.forEach(type => {
      leaveTypeMap[type.name] = type.leave_type_id
    })
    
    console.log('✅ Leave type mappings:')
    Object.entries(leaveTypeMap).forEach(([name, id]) => {
      console.log(`  ${name}: ${id}`)
    })
    
    // Your original leave limits data with new structure
    const leaveLimitsData = [
      // REGULAR - ACADEMIC
      { status_id: regularStatusId, leave_type_id: leaveTypeMap['VACATION'], termType: 'ACADEMIC', daysAllowed: 5 },
      { status_id: regularStatusId, leave_type_id: leaveTypeMap['SICK'], termType: 'ACADEMIC', daysAllowed: 5 },
      { status_id: regularStatusId, leave_type_id: leaveTypeMap['MATERNITY'], termType: 'ACADEMIC', daysAllowed: 105 },
      { status_id: regularStatusId, leave_type_id: leaveTypeMap['PATERNITY'], termType: 'ACADEMIC', daysAllowed: 10 },
      { status_id: regularStatusId, leave_type_id: leaveTypeMap['EMERGENCY'], termType: 'ACADEMIC', daysAllowed: 5 },
      
      // REGULAR - SUMMER
      { status_id: regularStatusId, leave_type_id: leaveTypeMap['VACATION'], termType: 'SUMMER', daysAllowed: 15 },
      { status_id: regularStatusId, leave_type_id: leaveTypeMap['SICK'], termType: 'SUMMER', daysAllowed: 15 },
      { status_id: regularStatusId, leave_type_id: leaveTypeMap['MATERNITY'], termType: 'SUMMER', daysAllowed: 15 },
      { status_id: regularStatusId, leave_type_id: leaveTypeMap['PATERNITY'], termType: 'SUMMER', daysAllowed: 15 },
      { status_id: regularStatusId, leave_type_id: leaveTypeMap['EMERGENCY'], termType: 'SUMMER', daysAllowed: 15 },
      
      // PROBATION - ACADEMIC  
      { status_id: probationStatusId, leave_type_id: leaveTypeMap['VACATION'], termType: 'ACADEMIC', daysAllowed: 0 },
      { status_id: probationStatusId, leave_type_id: leaveTypeMap['SICK'], termType: 'ACADEMIC', daysAllowed: 5 },
      { status_id: probationStatusId, leave_type_id: leaveTypeMap['MATERNITY'], termType: 'ACADEMIC', daysAllowed: 0 },
      { status_id: probationStatusId, leave_type_id: leaveTypeMap['PATERNITY'], termType: 'ACADEMIC', daysAllowed: 0 },
      { status_id: probationStatusId, leave_type_id: leaveTypeMap['EMERGENCY'], termType: 'ACADEMIC', daysAllowed: 5 },
      
      // PROBATION - SUMMER
      { status_id: probationStatusId, leave_type_id: leaveTypeMap['VACATION'], termType: 'SUMMER', daysAllowed: 0 },
      { status_id: probationStatusId, leave_type_id: leaveTypeMap['SICK'], termType: 'SUMMER', daysAllowed: 0 },
      { status_id: probationStatusId, leave_type_id: leaveTypeMap['MATERNITY'], termType: 'SUMMER', daysAllowed: 0 },
      { status_id: probationStatusId, leave_type_id: leaveTypeMap['PATERNITY'], termType: 'SUMMER', daysAllowed: 0 },
      { status_id: probationStatusId, leave_type_id: leaveTypeMap['EMERGENCY'], termType: 'SUMMER', daysAllowed: 0 },
    ]
    
    console.log(`\n📝 Restoring ${leaveLimitsData.length} leave limit records...`)
    
    // Insert each leave limit
    for (const limitData of leaveLimitsData) {
      try {
        const leaveTypeName = Object.keys(leaveTypeMap).find(key => leaveTypeMap[key] === limitData.leave_type_id)
        const statusName = limitData.status_id === regularStatusId ? 'Regular' : 'Probation'
        
        // Check if record already exists
        const existing = await prisma.$queryRaw`
          SELECT leave_limit_id FROM leave_limits 
          WHERE status_id = ${limitData.status_id} 
          AND leave_type_id = ${limitData.leave_type_id} 
          AND termType = ${limitData.termType}
        `
        
        if (existing.length === 0) {
          await prisma.$queryRaw`
            INSERT INTO leave_limits (status_id, leave_type_id, termType, daysAllowed, isActive, createdAt, updatedAt)
            VALUES (${limitData.status_id}, ${limitData.leave_type_id}, ${limitData.termType}, ${limitData.daysAllowed}, true, NOW(), NOW())
          `
          console.log(`  ✅ ${statusName} - ${limitData.termType} - ${leaveTypeName}: ${limitData.daysAllowed} days`)
        } else {
          // Update existing record
          await prisma.$queryRaw`
            UPDATE leave_limits 
            SET daysAllowed = ${limitData.daysAllowed}, updatedAt = NOW()
            WHERE status_id = ${limitData.status_id} 
            AND leave_type_id = ${limitData.leave_type_id} 
            AND termType = ${limitData.termType}
          `
          console.log(`  🔄 Updated ${statusName} - ${limitData.termType} - ${leaveTypeName}: ${limitData.daysAllowed} days`)
        }
        
      } catch (error) {
        console.error(`  ❌ Error creating/updating limit:`, error.message)
      }
    }
    
    // Verify the final count
    const totalLimits = await prisma.$queryRaw`SELECT COUNT(*) as count FROM leave_limits`
    console.log(`\n✅ Leave limits restoration complete! Total limits: ${totalLimits[0].count}`)
    
  } catch (error) {
    console.error('❌ Error restoring leave limits:', error)
  } finally {
    await prisma.$disconnect()
  }
}

restoreOriginalLeaveLimitsWithNewStructure()
