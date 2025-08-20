import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// GET /api/leave-balance-test - Test endpoint without Prisma issues
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const leaveType = searchParams.get('leaveType')

    // Mock current period data
    const currentPeriod = {
      calendar_period_id: 1,
      academicYear: "2024-2025",
      term: "ACADEMIC",
      startDate: "2024-08-01",
      endDate: "2025-05-31",
      isCurrent: true
    }

    // Mock user status - in real implementation, this would come from database
    const userStatus = {
      status_id: 2,
      name: "Regular" // Could be "Probation", "Regular", etc.
    }

    // Mock leave limits based on status and term
    const leaveLimits = [
      { leaveType: "VACATION", daysAllowed: 15, termType: "ACADEMIC" },
      { leaveType: "SICK", daysAllowed: 10, termType: "ACADEMIC" },
      { leaveType: "MATERNITY", daysAllowed: 90, termType: "ACADEMIC" },
      { leaveType: "PATERNITY", daysAllowed: 7, termType: "ACADEMIC" },
      { leaveType: "EMERGENCY", daysAllowed: 3, termType: "ACADEMIC" }
    ]

    // Filter by requested leave type if specified
    const filteredLimits = leaveType ? 
      leaveLimits.filter(limit => limit.leaveType === leaveType) : 
      leaveLimits

    // Create leave balances (in real implementation, this would check database for used days)
    const leaveBalances = filteredLimits.map(limit => ({
      leave_balance_id: Math.floor(Math.random() * 1000),
      allowedDays: limit.daysAllowed,
      usedDays: Math.floor(Math.random() * 5), // Mock used days
      remainingDays: limit.daysAllowed - Math.floor(Math.random() * 5),
      leaveType: limit.leaveType,
      termType: limit.termType,
      calendarPeriod: {
        academicYear: currentPeriod.academicYear,
        term: currentPeriod.term
      },
      status: {
        name: userStatus.name
      }
    }))

    return NextResponse.json({
      currentPeriod,
      leaveBalances,
      userStatus,
      message: "Test API working - using mock data"
    }, { status: 200 })

  } catch (error) {
    console.error("Error in test leave balance API:", error)
    return NextResponse.json(
      { error: "Failed to fetch leave balances", details: error },
      { status: 500 }
    )
  }
}
