// Open browser console and run this function to test the API
async function testCalendarAPI() {
  try {
    const testData = {
      academicYear: "2025 - 2026",
      term: "ACADEMIC", // Testing with old format 
      startDate: "2025-06-02T00:00:00.000Z",
      endDate: "2026-04-10T00:00:00.000Z"
    }
    
    console.log('Testing API with:', testData)
    
    const response = await fetch('/api/admin/calendar-periods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })
    
    const result = await response.text()
    console.log('Status:', response.status)
    console.log('Response:', result)
    
    if (response.ok) {
      console.log('✅ SUCCESS: Calendar period created!')
    } else {
      console.log('❌ FAILED:', result)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

console.log('Copy and run: testCalendarAPI()')
console.log('Make sure you are logged in as admin first!')
