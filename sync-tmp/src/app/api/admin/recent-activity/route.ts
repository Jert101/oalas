import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      )
    }

    // Get recent activities from the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Get recent user creations
    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      select: {
        users_id: true,
        name: true,
        email: true,
        profilePicture: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Get recent leave applications (submitted and approved)
    const recentLeaveApplications = await prisma.leaveApplication.findMany({
      where: {
        OR: [
          {
            appliedAt: {
              gte: sevenDaysAgo
            }
          },
          {
            reviewedAt: {
              gte: sevenDaysAgo
            }
          }
        ]
      },
      include: {
        user: {
          select: {
            name: true,
            profilePicture: true
          }
        },
        leaveType: {
          select: {
            name: true
          }
        },
        reviewer: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        appliedAt: 'desc'
      },
      take: 10
    })

    // Get recent probations
    const recentProbations = await prisma.probation.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      include: {
        user: {
          select: {
            name: true,
            profilePicture: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Combine and sort all activities
    const activities = [
      // User creations
      ...recentUsers.map(user => ({
        id: `user_${user.users_id}`,
        type: 'user_created' as const,
        description: 'New user account created',
        user: {
          name: user.name,
          profilePicture: user.profilePicture
        },
        timestamp: user.createdAt.toISOString()
      })),
      
      // Leave applications (submitted and approved)
      ...recentLeaveApplications.flatMap(app => {
        const activities = []
        
        // Add submission activity
        activities.push({
          id: `leave_submitted_${app.leave_application_id}`,
          type: 'leave_submitted' as const,
          description: `Leave application submitted for ${app.leaveType?.name || 'leave'}`,
          user: {
            name: app.user.name,
            profilePicture: app.user.profilePicture
          },
          timestamp: app.appliedAt.toISOString()
        })
        
        // Add approval activity if reviewed
        if (app.reviewedAt && app.status === 'APPROVED') {
          activities.push({
            id: `leave_approved_${app.leave_application_id}`,
            type: 'leave_approved' as const,
            description: `Leave application approved by ${app.reviewer?.name || 'admin'}`,
            user: {
              name: app.user.name,
              profilePicture: app.user.profilePicture
            },
            timestamp: app.reviewedAt.toISOString()
          })
        }
        
        return activities
      }),
      
      // Probations
      ...recentProbations.map(probation => ({
        id: `probation_${probation.probation_id}`,
        type: 'probation_started' as const,
        description: 'Probationary period initiated',
        user: {
          name: probation.user.name,
          profilePicture: probation.user.profilePicture
        },
        timestamp: probation.createdAt.toISOString()
      }))
    ]

    // Sort by timestamp (most recent first) and take top 10
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      data: {
        activities: sortedActivities,
        totalCount: sortedActivities.length
      }
    })

  } catch (error) {
    console.error("Error fetching recent activity:", error)
    return NextResponse.json(
      { error: "Failed to fetch recent activity" },
      { status: 500 }
    )
  }
}
