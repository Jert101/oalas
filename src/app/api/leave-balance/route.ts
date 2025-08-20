import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/leave-balance - Get leave balances for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const leaveType = searchParams.get('leaveType')

    // Get current calendar period
    const currentPeriod = await prisma.calendarPeriod.findFirst({
      where: { 
        isCurrent: true,
        isActive: true 
      }
    })

    if (!currentPeriod) {
      return NextResponse.json({ 
        error: "No current calendar period found" 
      }, { status: 404 })
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { users_id: session.user.id },
      include: { status: true }
    })

    if (!user || !user.status) {
      return NextResponse.json({ 
        error: "User or status not found" 
      }, { status: 404 })
    }

    // Get leave limits for user's status and current period
    const leaveLimitsWhere = {
      status_id: user.status_id!,
      termType: currentPeriod.term,
      isActive: true,
      ...(leaveType && { leaveType: leaveType as string })
    }

    const leaveLimits = await prisma.leaveLimit.findMany({
      where: leaveLimitsWhere,
      include: { status: true }
    })

    // Calculate leave balances based on leave limits
    const leaveBalances = await Promise.all(
      leaveLimits.map(async (limit) => {
        // Calculate used days from approved leave applications
        const usedApplications = await prisma.leaveApplication.findMany({
          where: {
            users_id: session.user.id,
            calendar_period_id: currentPeriod.calendar_period_id,
            leaveType: limit.leaveType,
            status: 'APPROVED'
          }
        })

        // Calculate total used days
        const usedDays = usedApplications.reduce((total, app) => {
          const startDate = new Date(app.startDate)
          const endDate = new Date(app.endDate)
          const days = calculateBusinessDays(startDate, endDate)
          return total + days
        }, 0)

        return {
          leave_balance_id: limit.leave_limit_id, // Use limit ID as placeholder
          allowedDays: limit.daysAllowed,
          usedDays: usedDays,
          remainingDays: limit.daysAllowed - usedDays,
          leaveType: limit.leaveType,
          termType: limit.termType,
          calendarPeriod: {
            academicYear: currentPeriod.academicYear,
            term: currentPeriod.term
          },
          status: user.status ? {
            name: user.status.name
          } : {
            name: "Unknown"
          }
        }
      })
    )

    return NextResponse.json({
      currentPeriod,
      leaveBalances,
      userStatus: user.status
    }, { status: 200 })

  } catch (error) {
    console.error("Error fetching leave balances:", error)
    return NextResponse.json(
      { error: "Failed to fetch leave balances" },
      { status: 500 }
    )
  }
}

// Function to calculate business days between two dates
function calculateBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      count++
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return count
}
