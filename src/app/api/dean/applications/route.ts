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
      where: { email: session.user.email },
      include: {
        department: true,
        role: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify user is a Dean/Program Head
    if (user.role?.name !== "Dean/Program Head") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get current calendar period
    const currentPeriod = await prisma.calendarPeriod.findFirst({
      where: { isCurrent: true }
    })

    if (!currentPeriod) {
      return NextResponse.json({ error: "No current calendar period found" }, { status: 404 })
    }

    // Get leave applications for faculty in the dean's department
    const leaveApplications = await prisma.leaveApplication.findMany({
      where: {
        calendar_period_id: currentPeriod.calendar_period_id,
        user: {
          department_id: user.department_id,
          isActive: true
        }
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
        calendarPeriod: {
          select: {
            academicYear: true,
            startDate: true,
            endDate: true
          }
        }
      },
      orderBy: {
        appliedAt: 'desc'
      }
    })

    // Get leave types for all applications
    const leaveTypeIds = [...new Set(leaveApplications.map(app => app.leave_type_id))]
    const leaveTypes = await prisma.leave_types.findMany({
      where: {
        leave_type_id: {
          in: leaveTypeIds
        }
      }
    })

    // Map leave types to applications
    const applicationsWithLeaveTypes = leaveApplications.map(app => ({
      ...app,
      leaveType: leaveTypes.find(lt => lt.leave_type_id === app.leave_type_id)
    }))

    return NextResponse.json({
      success: true,
      data: {
        applications: applicationsWithLeaveTypes,
        deanDepartment: user.department?.name,
        currentPeriod: {
          academicYear: currentPeriod.academicYear,
          startDate: currentPeriod.startDate,
          endDate: currentPeriod.endDate
        }
      }
    })

  } catch (error) {
    console.error('Error fetching dean applications:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
