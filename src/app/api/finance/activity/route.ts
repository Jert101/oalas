import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'Finance Department' && session.user.role !== 'Finance Officer' && session.user.role !== 'Finance Office Head')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get recent activity from leave applications
    const recentActivity = await prisma.leaveApplication.findMany({
      take: 20,
      orderBy: {
        appliedAt: 'desc'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            profilePicture: true,
            department: {
              select: {
                name: true
              }
            }
          }
        },
        leaveType: {
          select: {
            name: true
          }
        },
        reviewer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Format activity data
    const activities = recentActivity.map(app => {
      let activityType = 'applied'
      let description = `${app.user.name} applied for ${app.leaveType?.name || 'leave'}`
      let timestamp = app.appliedAt

      if (app.status === 'APPROVED') {
        activityType = 'approved'
        description = `${app.reviewer?.name || 'Finance Officer'} approved ${app.user.name}'s ${app.leaveType?.name || 'leave'} application`
        timestamp = app.reviewedAt || app.appliedAt
      } else if (app.status === 'DENIED') {
        activityType = 'denied'
        description = `${app.reviewer?.name || 'Finance Officer'} denied ${app.user.name}'s ${app.leaveType?.name || 'leave'} application`
        timestamp = app.reviewedAt || app.appliedAt
      } else if (app.status === 'DEAN_APPROVED') {
        activityType = 'dean_approved'
        description = `Dean approved ${app.user.name}'s ${app.leaveType?.name || 'leave'} application - ready for finance review`
        timestamp = app.reviewedAt || app.appliedAt
      }

      return {
        id: app.leave_application_id,
        type: activityType,
        description,
        timestamp,
        user: {
          name: app.user.name,
          email: app.user.email,
          profilePicture: app.user.profilePicture,
          department: app.user.department?.name || 'Not assigned'
        },
        application: {
          leaveType: app.leaveType?.name || 'Unknown',
          status: app.status,
          startDate: app.startDate,
          endDate: app.endDate,
          numberOfDays: app.numberOfDays
        }
      }
    })

    // Get activity summary
    const summary = {
      totalActivities: activities.length,
      applicationsToday: activities.filter(activity => {
        const today = new Date()
        const activityDate = new Date(activity.timestamp)
        return activityDate.toDateString() === today.toDateString()
      }).length,
      applicationsThisWeek: activities.filter(activity => {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return new Date(activity.timestamp) >= weekAgo
      }).length,
      byType: activities.reduce((acc, activity) => {
        acc[activity.type] = (acc[activity.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        activities,
        summary
      }
    })
  } catch (error) {
    console.error("Error fetching finance activity:", error)
    return NextResponse.json(
      { error: "Failed to fetch activity data" },
      { status: 500 }
    )
  }
}
