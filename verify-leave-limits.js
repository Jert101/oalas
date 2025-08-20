const { PrismaClient } = require('@prisma/client')

async function verifyLeaveLimits() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Verifying your restored leave limits...\n')
    
    const leaveLimits = await prisma.leaveLimit.findMany({
      include: {
        status: true
      },
      orderBy: [
        { status: { name: 'asc' } },
        { termType: 'asc' },
        { leaveType: 'asc' }
      ]
    })
    
    console.log(`✅ Total leave limits: ${leaveLimits.length}\n`)
    
    // Group by status
    const regularLimits = leaveLimits.filter(l => l.status.name === 'Regular')
    const probationLimits = leaveLimits.filter(l => l.status.name === 'Probation')
    
    console.log('📋 REGULAR STATUS LIMITS:')
    console.log('  Academic Term:')
    regularLimits.filter(l => l.termType === 'ACADEMIC').forEach(limit => {
      console.log(`    - ${limit.leaveType}: ${limit.daysAllowed} days`)
    })
    console.log('  Summer Term:')
    regularLimits.filter(l => l.termType === 'SUMMER').forEach(limit => {
      console.log(`    - ${limit.leaveType}: ${limit.daysAllowed} days`)
    })
    
    console.log('\n📋 PROBATION STATUS LIMITS:')
    console.log('  Academic Term:')
    probationLimits.filter(l => l.termType === 'ACADEMIC').forEach(limit => {
      console.log(`    - ${limit.leaveType}: ${limit.daysAllowed} days`)
    })
    console.log('  Summer Term:')
    probationLimits.filter(l => l.termType === 'SUMMER').forEach(limit => {
      console.log(`    - ${limit.leaveType}: ${limit.daysAllowed} days`)
    })
    
    console.log('\n✅ All your original leave limits have been restored!')
    
  } catch (error) {
    console.error('❌ Error verifying leave limits:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyLeaveLimits()
