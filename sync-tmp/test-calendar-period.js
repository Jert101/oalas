const { PrismaClient } = require('@prisma/client')

async function testCalendarPeriod() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Testing CalendarPeriod creation...')
    
    // First, get the term type
    const termType = await prisma.termType.findUnique({
      where: { name: 'Academic' }
    })
    
    console.log('Found term type:', termType)
    
    if (!termType) {
      console.error('❌ Term type not found')
      return
    }
    
    // Try to create a test calendar period
    const testPeriod = {
      academicYear: "2025 - 2026 Test",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2026-04-30"),
      isCurrent: false,
      isActive: true,
      term_type_id: termType.term_type_id
    }
    
    console.log('Test period data:', testPeriod)
    
    // This will show us exactly what fields are expected
    // const result = await prisma.calendarPeriod.create({
    //   data: testPeriod
    // })
    
    console.log('✅ Test setup complete')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testCalendarPeriod()
