const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestNotifications() {
  try {
    // Get a test user (first user in the database)
    const user = await prisma.user.findFirst()
    
    if (!user) {
      console.log('No users found in database. Please create a user first.')
      return
    }

    console.log(`Creating test notifications for user: ${user.name} (${user.email})`)

    // Create sample notifications
    const notifications = [
      {
        title: 'Welcome to the System',
        message: 'Welcome to the Leave Management System! You can now submit leave applications.',
        type: 'INFO',
        userId: user.users_id,
        isRead: false
      },
      {
        title: 'Leave Application Submitted',
        message: 'Your leave application has been submitted successfully and is pending approval.',
        type: 'SUCCESS',
        userId: user.users_id,
        isRead: false
      },
      {
        title: 'System Maintenance',
        message: 'The system will be under maintenance on Sunday from 2:00 AM to 4:00 AM.',
        type: 'WARNING',
        userId: user.users_id,
        isRead: false
      },
      {
        title: 'Leave Application Approved',
        message: 'Your leave application has been approved by the Dean.',
        type: 'SUCCESS',
        userId: user.users_id,
        isRead: true
      },
      {
        title: 'New Feature Available',
        message: 'Real-time notifications are now available! You\'ll receive instant updates.',
        type: 'INFO',
        userId: user.users_id,
        isRead: false
      }
    ]

    for (const notificationData of notifications) {
      const notification = await prisma.notification.create({
        data: notificationData
      })
      console.log(`Created notification: ${notification.title}`)
    }

    console.log('Test notifications created successfully!')
    
    // Get notification count
    const count = await prisma.notification.count({
      where: { userId: user.users_id }
    })
    console.log(`Total notifications for user: ${count}`)

  } catch (error) {
    console.error('Error creating test notifications:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestNotifications()
