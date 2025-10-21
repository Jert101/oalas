import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Enhanced role-based access control
    const allowedRoles = ['Finance Department', 'Finance Officer', 'Finance Office Head', 'Admin']
    if (!session || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch reference data for filters
    const [departments, leaveTypes, statuses, calendarPeriods] = await Promise.all([
      prisma.department.findMany({
        select: {
          department_id: true,
          name: true
        },
        orderBy: { name: 'asc' }
      }),
      prisma.leave_types.findMany({
        select: {
          leave_type_id: true,
          name: true
        },
        where: { isActive: true },
        orderBy: { name: 'asc' }
      }),
      prisma.status.findMany({
        select: {
          status_id: true,
          name: true
        },
        orderBy: { name: 'asc' }
      }),
      prisma.calendarPeriod.findMany({
        select: {
          calendar_period_id: true,
          academicYear: true,
          startDate: true
        },
        where: { isActive: true },
        orderBy: { startDate: 'desc' }
      })
    ])

    return NextResponse.json({
      departments,
      leaveTypes,
      statuses,
      calendarPeriods
    })

  } catch (error) {
    console.error('Error fetching reference data:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
