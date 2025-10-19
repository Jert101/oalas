// Test script for notification system
const { createNotification } = require('./src/lib/notification-service.ts')

async function testNotificationSystem() {
  try {
    console.log('🧪 Testing notification system...')
    
    // Test creating a notification
    const result = await createNotification({
      userId: 'test-user-id',
      title: 'Test Notification',
      message: 'This is a test notification',
      type: 'INFO',
      sendEmail: false // Don't send email for testing
    })
    
    console.log('✅ Notification test result:', result)
    
  } catch (error) {
    console.error('❌ Notification test failed:', error)
  }
}

testNotificationSystem()
