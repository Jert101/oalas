import { prisma } from "@/lib/prisma"

// Import WebSocket for server-side usage
let WebSocket: any
if (typeof window === 'undefined') {
  // Server-side
  WebSocket = require('ws')
}

interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
  link?: string
}

export async function createNotification({
  userId,
  title,
  message,
  type = 'INFO',
  link
}: CreateNotificationParams) {
  try {
    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        userId,
        link,
        isRead: false
      }
    })

    // Send WebSocket notification if WebSocket server is available
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || (process.env.VERCEL_URL ? `wss://${process.env.VERCEL_URL}` : 'ws://localhost:3001')
      const ws = new WebSocket(wsUrl)
      
      const message = JSON.stringify({
        type: 'notification',
        userId: userId,
        notification: {
          id: notification.notification_id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          timestamp: notification.createdAt,
          isRead: notification.isRead,
          link: notification.link
        }
      })
      
      ws.onopen = () => {
        console.log('Sending WebSocket notification:', message)
        ws.send(message)
        // Close after sending
        setTimeout(() => ws.close(), 100)
      }
      
      ws.onerror = (error) => {
        // Avoid throwing; proceed silently if WS server is down
        console.warn('WebSocket send error, continuing without realtime:', error)
      }
      
      // Timeout after 2 seconds
      setTimeout(() => {
        try {
          if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) {
            ws.close()
          }
        } catch {}
      }, 2000)
    } catch (error) {
      // WebSocket not available, continue without real-time notification
      console.log('WebSocket not available, notification saved to database only:', error)
    }

    console.log(`Notification created for user ${userId}:`, {
      id: notification.notification_id,
      title,
      message,
      type
    })

    return {
      success: true,
      notification: {
        id: notification.notification_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        timestamp: notification.createdAt,
        isRead: notification.isRead,
        link: notification.link
      }
    }
  } catch (error) {
    console.error('Error creating notification:', error)
    return {
      success: false,
      error: 'Failed to create notification'
    }
  }
}

// Helper functions for common notification types
export async function notifyLeaveApplicationSubmitted(userId: string, applicationId: number) {
  return createNotification({
    userId,
    title: 'Leave Application Submitted',
    message: 'Your leave application has been submitted successfully and is pending approval.',
    type: 'SUCCESS',
    link: `/teacher/leave/${applicationId}`
  })
}

export async function notifyLeaveApplicationApproved(userId: string, applicationId: number) {
  return createNotification({
    userId,
    title: 'Leave Application Approved',
    message: 'Your leave application has been approved by the Dean.',
    type: 'SUCCESS',
    link: `/teacher/leave/${applicationId}`
  })
}

export async function notifyLeaveApplicationRejected(userId: string, applicationId: number, reason: string) {
  return createNotification({
    userId,
    title: 'Leave Application Rejected',
    message: `Your leave application has been rejected. Reason: ${reason}`,
    type: 'ERROR',
    link: `/teacher/leave/${applicationId}`
  })
}

export async function notifyNewApplicationForDean(deanUserId: string, teacherName: string, applicationId: number) {
  return createNotification({
    userId: deanUserId,
    title: 'New Leave Application',
    message: `${teacherName} has submitted a new leave application that requires your review.`,
    type: 'INFO',
    link: `/dean/applications/${applicationId}`
  })
}

export async function notifySystemMessage(userId: string, title: string, message: string) {
  return createNotification({
    userId,
    title,
    message,
    type: 'INFO'
  })
}

// Finance approval/rejection notifications
export async function notifyFinanceApproval(userId: string, applicationId: number) {
  return createNotification({
    userId,
    title: 'Leave Application Fully Approved',
    message: 'Your leave application has been fully approved by Finance and is ready for printing.',
    type: 'SUCCESS',
    link: `/teacher/leave/${applicationId}`
  })
}

export async function notifyFinanceRejectionToDean(deanUserId: string, teacherName: string, applicationId: number, rejectionReason: string) {
  return createNotification({
    userId: deanUserId,
    title: 'Finance Rejection Requires Review',
    message: `Finance has rejected ${teacherName}'s leave application. Please review the rejection before notifying the applicant.`,
    type: 'WARNING',
    link: `/dean/applications/${applicationId}`
  })
}

export async function notifyFinanceRejectionToApplicant(userId: string, applicationId: number, rejectionReason: string) {
  return createNotification({
    userId,
    title: 'Leave Application Rejected',
    message: `Your leave application has been rejected by Finance. Reason: ${rejectionReason}`,
    type: 'ERROR',
    link: `/teacher/leave/${applicationId}`
  })
}
