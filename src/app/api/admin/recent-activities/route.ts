import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch recent activities from various sources
    const [
      recentLeaveApplications,
      recentAccountSetupRequests,
      recentUserCreations,
      recentNotifications
    ] = await Promise.all([
      // Recent leave applications (last 10)
      prisma.leaveApplication.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true }
          },
          leaveType: {
            select: { name: true }
          }
        }
      }),

      // Recent account setup requests (last 10)
      prisma.accountSetupRequest.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: {
          department: {
            select: { name: true }
          },
          role: {
            select: { name: true }
          }
        }
      }),

      // Recent user creations (last 10)
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          users_id: true,
          name: true,
          email: true,
          createdAt: true,
          department: {
            select: { name: true }
          },
          role: {
            select: { name: true }
          }
        }
      }),

      // Recent system notifications (last 10)
      prisma.notification.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          notification_id: true,
          title: true,
          message: true,
          type: true,
          createdAt: true,
          user: {
            select: { name: true }
          }
        }
      })
    ])

    // Combine and format activities
    const activities = [
      // Leave applications
      ...recentLeaveApplications.map(app => ({
        id: `leave_${app.leave_application_id}`,
        type: 'leave_application',
        title: `Leave Application - ${app.user.name}`,
        description: `${app.leaveType.name} leave from ${new Date(app.startDate).toLocaleDateString()} to ${new Date(app.endDate).toLocaleDateString()}`,
        status: app.status,
        timestamp: app.createdAt,
        user: app.user.name,
        action: 'submitted'
      })),

      // Account setup requests
      ...recentAccountSetupRequests.map(req => ({
        id: `setup_${req.id}`,
        type: 'account_setup',
        title: `Account Setup Request - ${req.email}`,
        description: `Request for ${req.role.name} role in ${req.department.name} department`,
        status: req.status,
        timestamp: req.created_at,
        user: req.email,
        action: 'requested'
      })),

      // User creations
      ...recentUserCreations.map(user => ({
        id: `user_${user.users_id}`,
        type: 'user_creation',
        title: `New User Created - ${user.name}`,
        description: `${user.role?.name || 'Unknown role'} in ${user.department?.name || 'Unknown department'}`,
        status: 'completed',
        timestamp: user.createdAt,
        user: user.name,
        action: 'created'
      })),

      // System notifications
      ...recentNotifications.map(notif => ({
        id: `notification_${notif.notification_id}`,
        type: 'notification',
        title: notif.title,
        description: notif.message,
        status: notif.isRead ? 'read' : 'unread',
        timestamp: notif.createdAt,
        user: notif.user.name,
        action: 'sent'
      }))
    ]

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Return top 15 most recent activities
    const recentActivities = activities.slice(0, 15)

    return NextResponse.json({ 
      success: true, 
      data: recentActivities 
    })
  } catch (error) {
    console.error("Error fetching recent activities:", error)
    return NextResponse.json(
      { error: "Failed to fetch recent activities" },
      { status: 500 }
    )
  }
}











