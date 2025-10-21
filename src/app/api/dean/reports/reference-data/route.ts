import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Enhanced role-based access control for deans
    const allowedRoles = ['Dean', 'Admin']
    if (!session || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get dean's department
    const deanUser = await prisma.user.findUnique({
      where: { users_id: session.user.id },
      include: { department: true }
    })

    if (!deanUser || !deanUser.department) {
      return NextResponse.json({ error: "Dean department not found" }, { status: 404 })
    }

    const deanDepartmentId = deanUser.department.department_id

    // Get reference data
    const [departments, leaveTypes, statuses, calendarPeriods] = await Promise.all([
      // Only get dean's department
      prisma.department.findMany({
        where: { department_id: deanDepartmentId },
        select: {
          department_id: true,
          name: true
        }
      }),
      prisma.leaveType.findMany({
        select: {
          leave_type_id: true,
          name: true
        }
      }),
      prisma.status.findMany({
        select: {
          status_id: true,
          name: true
        }
      }),
      prisma.calendarPeriod.findMany({
        select: {
          calendar_period_id: true,
          academicYear: true,
          startDate: true
        },
        orderBy: { academicYear: 'desc' }
      })
    ])

    return NextResponse.json({
      departments,
      leaveTypes,
      statuses,
      calendarPeriods
    })

  } catch (error) {
    console.error("Error loading dean reference data:", error)
    return NextResponse.json(
      { error: "Failed to load reference data" },
      { status: 500 }
    )
  }
}
