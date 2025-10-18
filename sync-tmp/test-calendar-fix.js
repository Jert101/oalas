const { PrismaClient } = require('@prisma/client')

async function testCalendarPeriodAPI() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Testing Calendar Period API fix...')
    
    // Check term types
    const termTypes = await prisma.termType.findMany()
    console.log('\n📋 Available term types:')
    termTypes.forEach(type => {
      console.log(`  - ${type.name} (ID: ${type.term_type_id})`)
    })
    
    // Test data that should work with the fixed API
    const testData = {
      academicYear: "2025 - 2026",
      term: "Academic", // This should now work (proper case)
      startDate: "2025-06-02T00:00:00.000Z",
      endDate: "2026-04-10T00:00:00.000Z"
    }
    
    console.log('\n✅ Test data for API:')
    console.log(JSON.stringify(testData, null, 2))
    
    console.log('\n📝 Instructions to test:')
    console.log('1. Login as admin (admin@admin.com / password)')
    console.log('2. Go to: http://localhost:3000/admin/calendar-settings')
    console.log('3. Try adding a calendar period with the term "Academic" or "Summer"')
    console.log('4. The error should now be resolved!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testCalendarPeriodAPI()
