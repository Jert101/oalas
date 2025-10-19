import { prisma } from "@/lib/prisma"
import { sendEmail, emailTemplates } from "@/lib/email-service"

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
  sendEmail?: boolean
  emailTemplate?: 'leaveApplicationSubmitted' | 'leaveApplicationApproved' | 'leaveApplicationRejected' | 'newApplicationForReviewer'
  emailData?: {
    userName?: string
    applicationId?: number
    leaveType?: string
    rejectionReason?: string
    approverName?: string
  }
}

export async function createNotification({
  userId,
  title,
  message,
  type = 'INFO',
  link,
  sendEmail = false,
  emailTemplate,
  emailData
}: CreateNotificationParams) {
  try {
    // Get user information for email
    let userEmail = null
    let userName = 'User'
    
    if (sendEmail && emailTemplate) {
      try {
        const user = await prisma.user.findUnique({
          where: { users_id: userId },
          select: { email: true, name: true }
        })
        userEmail = user?.email
        userName = user?.name || 'User'
      } catch (error) {
        console.error('Error fetching user for email:', error)
      }
    }

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

    // Send email notification if requested
    if (sendEmail && userEmail && emailTemplate && emailData) {
      try {
        const template = emailTemplates[emailTemplate]
        if (template) {
          const emailContent = template(
            emailData.userName || userName,
            emailData.applicationId || 0,
            emailData.leaveType || 'Leave',
            emailData.rejectionReason || '',
            emailData.approverName || 'Administrator'
          )
          
          const emailResult = await sendEmail(userEmail, emailContent.subject, emailContent.html)
          
          if (emailResult.success) {
            console.log(`✅ Email notification sent to ${userEmail}`)
          } else {
            console.error(`❌ Failed to send email to ${userEmail}:`, emailResult.error)
          }
        }
      } catch (error) {
        console.error('Error sending email notification:', error)
        // Don't fail the notification if email fails
      }
    }

    // Send real-time notification via HTTP to WebSocket server
    try {
      const response = await fetch(`http://localhost:3001/api/realtime/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
      })
      
      if (response.ok) {
        console.log('✅ Real-time notification sent successfully')
      } else {
        console.warn('⚠️ Failed to send real-time notification:', response.status)
      }
    } catch (error) {
      // WebSocket not available, continue without real-time notification
      console.log('WebSocket not available, notification saved to database only:', error)
    }

    console.log(`Notification created for user ${userId}:`, {
      id: notification.notification_id,
      title,
      message,
      type,
      emailSent: sendEmail && userEmail ? 'Yes' : 'No'
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
export async function notifyLeaveApplicationSubmitted(userId: string, applicationId: number, leaveType?: string) {
  return createNotification({
    userId,
    title: 'Leave Application Submitted',
    message: 'Your leave application has been submitted successfully and is pending approval.',
    type: 'SUCCESS',
    link: `/teacher/leave/${applicationId}`,
    sendEmail: true,
    emailTemplate: 'leaveApplicationSubmitted',
    emailData: {
      applicationId,
      leaveType: leaveType || 'Leave'
    }
  })
}

export async function notifyLeaveApplicationApproved(userId: string, applicationId: number, approverName?: string, leaveType?: string) {
  return createNotification({
    userId,
    title: 'Leave Application Approved',
    message: 'Your leave application has been approved.',
    type: 'SUCCESS',
    link: `/teacher/leave/${applicationId}`,
    sendEmail: true,
    emailTemplate: 'leaveApplicationApproved',
    emailData: {
      applicationId,
      leaveType: leaveType || 'Leave',
      approverName: approverName || 'Administrator'
    }
  })
}

export async function notifyLeaveApplicationRejected(userId: string, applicationId: number, reason: string, approverName?: string, leaveType?: string) {
  return createNotification({
    userId,
    title: 'Leave Application Rejected',
    message: `Your leave application has been rejected. Reason: ${reason}`,
    type: 'ERROR',
    link: `/teacher/leave/${applicationId}`,
    sendEmail: true,
    emailTemplate: 'leaveApplicationRejected',
    emailData: {
      applicationId,
      leaveType: leaveType || 'Leave',
      rejectionReason: reason,
      approverName: approverName || 'Administrator'
    }
  })
}

export async function notifyNewApplicationForDean(deanUserId: string, teacherName: string, applicationId: number, leaveType?: string) {
  return createNotification({
    userId: deanUserId,
    title: 'New Leave Application',
    message: `${teacherName} has submitted a new leave application that requires your review.`,
    type: 'INFO',
    link: `/dean/applications/${applicationId}`,
    sendEmail: true,
    emailTemplate: 'newApplicationForReviewer',
    emailData: {
      applicationId,
      leaveType: leaveType || 'Leave'
    }
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
export async function notifyFinanceApproval(userId: string, applicationId: number, leaveType?: string) {
  return createNotification({
    userId,
    title: 'Leave Application Fully Approved',
    message: 'Your leave application has been fully approved by Finance and is ready for printing.',
    type: 'SUCCESS',
    link: `/teacher/leave/${applicationId}`,
    sendEmail: true,
    emailTemplate: 'leaveApplicationApproved',
    emailData: {
      applicationId,
      leaveType: leaveType || 'Leave',
      approverName: 'Finance Department'
    }
  })
}

export async function notifyFinanceRejectionToDean(deanUserId: string, teacherName: string, applicationId: number, rejectionReason: string) {
  return createNotification({
    userId: deanUserId,
    title: 'Finance Rejection Requires Review',
    message: `Finance has rejected ${teacherName}'s leave application. Please review the rejection before notifying the applicant.`,
    type: 'WARNING',
    link: `/dean/applications/${applicationId}`,
    sendEmail: false // Don't send email for internal dean notifications
  })
}

export async function notifyFinanceRejectionToApplicant(userId: string, applicationId: number, rejectionReason: string, leaveType?: string) {
  return createNotification({
    userId,
    title: 'Leave Application Rejected',
    message: `Your leave application has been rejected by Finance. Reason: ${rejectionReason}`,
    type: 'ERROR',
    link: `/teacher/leave/${applicationId}`,
    sendEmail: true,
    emailTemplate: 'leaveApplicationRejected',
    emailData: {
      applicationId,
      leaveType: leaveType || 'Leave',
      rejectionReason,
      approverName: 'Finance Department'
    }
  })
}
