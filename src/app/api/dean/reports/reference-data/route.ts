import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user with role information
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        department: true,
        role: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user has dean, admin, or department head role
    const allowedRoles = ['Dean', 'Admin', 'Dean/Program Head', 'Department Head']
    if (!allowedRoles.includes(user.role.name)) {
      return NextResponse.json({ error: "Access denied. Dean or Department Head role required." }, { status: 403 })
    }

    // Get dean's department
    if (!user.department) {
      return NextResponse.json({ error: "Dean department not found" }, { status: 404 })
    }

    const deanDepartmentId = user.department.department_id

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
