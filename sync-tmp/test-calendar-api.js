const { PrismaClient } = require('@prisma/client')

async function testCalendarPeriodCreation() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Testing Calendar Period creation directly...')
    
    // Get the Academic term type
    const termType = await prisma.termType.findUnique({
      where: { name: 'Academic' }
    })
    
    if (!termType) {
      console.error('❌ Academic term type not found')
      return
    }
    
    console.log('✅ Found term type:', termType)
    
    // Try to create a calendar period (uncomment to actually create)
    const testData = {
      academicYear: "2025 - 2026 Test",
      startDate: new Date("2025-06-02"),
      endDate: new Date("2026-04-10"),
      isCurrent: false,
      isActive: true,
      term_type_id: termType.term_type_id
    }
    
    console.log('📋 Test data structure:')
    console.log(testData)
    
    // Uncomment this to test actual creation:
    // const result = await prisma.calendarPeriod.create({
    //   data: testData
    // })
    // console.log('✅ Created:', result)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Full error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCalendarPeriodCreation()

testCalendarPeriodCreation()
