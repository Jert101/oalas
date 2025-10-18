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
      where: { isCurrent: true }
    })

    if (!currentPeriod) {
      return NextResponse.json({ error: "No current calendar period found" }, { status: 404 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const leaveTypeId = searchParams.get('leaveTypeId')

    // Build where clause
    const whereClause: {
      status_id: number
      termType: { term_type_id: number | undefined }
      isActive: boolean
      leave_type_id?: number
    } = {
      status_id: user.status_id || 1, // Default to status_id 1 if not set
      termType: {
        term_type_id: currentPeriod.termType?.term_type_id
      },
      isActive: true
    }

    // If leaveTypeId is provided, filter by it
    if (leaveTypeId) {
      whereClause.leave_type_id = parseInt(leaveTypeId)
    }

    // Get leave limits for the current user's status and calendar period's term type
    const leaveLimits = await prisma.leaveLimit.findMany({
      where: whereClause,
      include: {
        leaveType: true
      }
    })

    // If leaveTypeId is provided, return the specific limit
    if (leaveTypeId) {
      const specificLimit = leaveLimits.find(limit => limit.leave_type_id === parseInt(leaveTypeId))
      if (specificLimit) {
        return NextResponse.json({
          leaveLimit: {
            leave_limit_id: specificLimit.leave_limit_id,
            daysAllowed: specificLimit.daysAllowed,
            leave_type_id: specificLimit.leave_type_id,
            leaveType: specificLimit.leaveType
          }
        })
      } else {
        return NextResponse.json({ error: "Leave limit not found for this leave type" }, { status: 404 })
      }
    }

    return NextResponse.json({
      leaveLimits: leaveLimits.map(limit => ({
        leave_limit_id: limit.leave_limit_id,
        daysAllowed: limit.daysAllowed,
        leave_type_id: limit.leave_type_id,
        leaveType: limit.leaveType
      }))
    })

  } catch (error) {
    console.error('Error fetching leave limits:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
