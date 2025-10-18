const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testNotifications() {
  try {
    console.log('Testing notification system...\n')

    // Get a test user (teacher)
    const teacher = await prisma.user.findFirst({
      where: {
        role: {
          name: "Teacher/Instructor"
        }
      },
      include: {
        department: true
      }
    })

    if (!teacher) {
      console.log('No teacher found in database.')
      return
    }

    console.log(`Teacher: ${teacher.name} (${teacher.email})`)
    console.log(`Department: ${teacher.department?.name || 'No department'}\n`)

    // Get the dean of the same department
    const dean = await prisma.user.findFirst({
      where: {
        department_id: teacher.department_id,
        role: {
          name: "Dean/Program Head"
        }
      }
    })

    if (!dean) {
      console.log('No dean found for this department.')
      return
    }

    console.log(`Dean: ${dean.name} (${dean.email})\n`)

    // Check existing notifications
    const teacherNotifications = await prisma.notification.count({
      where: { userId: teacher.users_id }
    })

    const deanNotifications = await prisma.notification.count({
      where: { userId: dean.users_id }
    })

    console.log(`Current notifications:`)
    console.log(`- Teacher: ${teacherNotifications}`)
    console.log(`- Dean: ${deanNotifications}\n`)

    // Create a test notification for the teacher
    console.log('Creating test notification for teacher...')
    const testNotification = await prisma.notification.create({
      data: {
        title: 'Test Notification',
        message: 'This is a test notification to verify the system is working.',
        type: 'INFO',
        userId: teacher.users_id,
        isRead: false
      }
    })

    console.log(`Created notification ID: ${testNotification.notification_id}`)

    // Check updated counts
    const updatedTeacherNotifications = await prisma.notification.count({
      where: { userId: teacher.users_id }
    })

    console.log(`Updated teacher notifications: ${updatedTeacherNotifications}`)

    console.log('\n✅ Notification system test completed successfully!')
    console.log('\nTo test the full flow:')
    console.log('1. Login as a teacher and submit a leave application')
    console.log('2. Login as a dean and approve/reject the application')
    console.log('3. Check the notification bell in the header')

  } catch (error) {
    console.error('Error testing notifications:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testNotifications()
