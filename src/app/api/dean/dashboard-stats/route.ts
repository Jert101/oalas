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

    // Get faculty members in the dean's department
    const facultyMembers = await prisma.user.findMany({
      where: {
        department_id: user.department_id,
        role: {
          name: "Teacher/Instructor"
        },
        isActive: true
      },
      include: {
        department: true,
        status: true
      }
    })

    // Get leave applications for faculty in the dean's department
    const leaveApplications = await prisma.leaveApplication.findMany({
      where: {
        calendar_period_id: currentPeriod.calendar_period_id,
        user: {
          department_id: user.department_id
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            profilePicture: true
          }
        }
      },
      orderBy: {
        appliedAt: 'desc'
      }
    })

    // Calculate statistics
    const pendingApplications = leaveApplications.filter(app => app.status === 'PENDING').length
    const approvedApplications = leaveApplications.filter(app => app.status === 'APPROVED').length
    const deniedApplications = leaveApplications.filter(app => app.status === 'DENIED').length
    const totalFaculty = facultyMembers.length

    // Get recent applications (last 5)
    const recentApplications = leaveApplications.slice(0, 5)

    // Get department statistics
    const departmentStats = {
      totalFaculty,
      activeFaculty: facultyMembers.filter(f => f.status?.name === 'Regular').length,
      probationaryFaculty: facultyMembers.filter(f => f.status?.name === 'Probation').length
    }

    // Get monthly trends (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyTrends = await prisma.leaveApplication.groupBy({
      by: ['status'],
      where: {
        calendar_period_id: currentPeriod.calendar_period_id,
        user: {
          department_id: user.department_id
        },
        appliedAt: {
          gte: sixMonthsAgo
        }
      },
      _count: {
        status: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        pendingApplications,
        approvedApplications,
        deniedApplications,
        totalFaculty,
        departmentStats,
        recentApplications,
        monthlyTrends,
        currentPeriod: {
          academicYear: currentPeriod.academicYear,
          startDate: currentPeriod.startDate,
          endDate: currentPeriod.endDate
        },
        dean: {
          name: user.name,
          department: user.department?.name,
          email: user.email
        }
      }
    })

  } catch (error) {
    console.error('Error fetching dean dashboard data:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
