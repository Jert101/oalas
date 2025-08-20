import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get current calendar period
    const currentPeriod = await prisma.calendarPeriod.findFirst({
      where: { isCurrent: true },
      include: {
        termType: true
      }
    })

    if (!currentPeriod) {
      return NextResponse.json({ error: "No current calendar period found" }, { status: 404 })
    }

    // Check if current period is summer (shared balance)
    const isSummerPeriod = currentPeriod.termType?.name?.toLowerCase().includes('summer')
    
    if (!isSummerPeriod) {
      return NextResponse.json({ error: "Shared leave balance only applies to summer period" }, { status: 400 })
    }

    // For summer period, get the total allowed days from any leave limit (they should all be the same)
    const leaveLimit = await prisma.leaveLimit.findFirst({
      where: {
        status_id: user.status_id || 1,
        termType: {
          term_type_id: currentPeriod.termType?.term_type_id
        },
        isActive: true
      }
    })

    if (!leaveLimit) {
      return NextResponse.json({ error: "No leave limits found for current period" }, { status: 404 })
    }

    const totalAllowedDays = leaveLimit.daysAllowed

    // Calculate total used days from ALL approved leave applications in this period
    const approvedApplications = await prisma.leaveApplication.findMany({
      where: {
        users_id: user.users_id,
        calendar_period_id: currentPeriod.calendar_period_id,
        status: 'APPROVED' // Only count fully approved applications
      }
    })

    const totalUsedDays = approvedApplications.reduce((total, app) => {
      return total + app.numberOfDays
    }, 0)

    const totalRemainingDays = totalAllowedDays - totalUsedDays

    // Get breakdown by leave type
    const leaveTypeBreakdown = await Promise.all(
      approvedApplications.map(async (app) => {
        const leaveType = await prisma.leave_types.findUnique({
          where: { leave_type_id: app.leave_type_id }
        })
        
        return {
          leaveType: leaveType?.name || 'Unknown',
          daysUsed: app.numberOfDays,
          startDate: app.startDate,
          endDate: app.endDate
        }
      })
    )

    // Group by leave type
    const groupedBreakdown = leaveTypeBreakdown.reduce((acc, item) => {
      if (!acc[item.leaveType]) {
        acc[item.leaveType] = 0
      }
      acc[item.leaveType] += item.daysUsed
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      sharedBalance: {
        totalAllowedDays,
        totalUsedDays,
        totalRemainingDays,
        period: currentPeriod.academicYear,
        termType: currentPeriod.termType?.name
      },
      breakdown: groupedBreakdown,
      applications: leaveTypeBreakdown
    })

  } catch (error) {
    console.error('Error fetching shared leave balance:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}



