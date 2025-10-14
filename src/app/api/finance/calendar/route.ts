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

    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    // Default to current month/year if not provided
    const currentDate = new Date()
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1
    const targetYear = year ? parseInt(year) : currentDate.getFullYear()

    // Get start and end dates for the month
    const startDate = new Date(targetYear, targetMonth - 1, 1)
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59)

    // Get all leave applications for the specified month
    const leaveApplications = await prisma.leaveApplication.findMany({
      where: {
        OR: [
          {
            startDate: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            endDate: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: endDate } }
            ]
          }
        ]
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
        leave_types: {
          select: {
            name: true,
            description: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    })

    // Format calendar events
    const calendarEvents = leaveApplications.map(app => {
      const startDate = new Date(app.startDate)
      const endDate = new Date(app.endDate)
      
      return {
        id: app.leave_application_id,
        title: `${app.user.name} - ${app.leave_types?.name || 'Leave'}`,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        allDay: true,
        status: app.status,
        user: {
          name: app.user.name,
          email: app.user.email,
          profilePicture: app.user.profilePicture,
          department: app.user.department?.name || 'Not assigned'
        },
        leaveType: app.leave_types?.name || 'Unknown',
        numberOfDays: app.numberOfDays,
        reason: app.reason,
        appliedAt: app.appliedAt
      }
    })

    // Get calendar summary
    const summary = {
      totalEvents: calendarEvents.length,
      approvedEvents: calendarEvents.filter(event => event.status === 'APPROVED').length,
      pendingEvents: calendarEvents.filter(event => event.status === 'PENDING' || event.status === 'DEAN_APPROVED').length,
      deniedEvents: calendarEvents.filter(event => event.status === 'DENIED').length,
      byLeaveType: calendarEvents.reduce((acc, event) => {
        acc[event.leaveType] = (acc[event.leaveType] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byDepartment: calendarEvents.reduce((acc, event) => {
        const dept = event.user.department
        acc[dept] = (acc[dept] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        events: calendarEvents,
        summary,
        month: targetMonth,
        year: targetYear
      }
    })
  } catch (error) {
    console.error("Error fetching finance calendar:", error)
    return NextResponse.json(
      { error: "Failed to fetch calendar data" },
      { status: 500 }
    )
  }
}
