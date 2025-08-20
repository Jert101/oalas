import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      )
    }

    // Get current calendar period
    const currentPeriod = await prisma.calendarPeriod.findFirst({
      where: { isCurrent: true }
    })

    if (!currentPeriod) {
      return NextResponse.json(
        { error: "No current calendar period found" },
        { status: 404 }
      )
    }

    // Get total users count
    const totalUsers = await prisma.user.count()

    // Get recent users (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    })

    // Get active probations
    const activeProbations = await prisma.probation.count({
      where: {
        status: 'ACTIVE'
      }
    })

    // Get pending leave applications for current period only
    const pendingLeaveApplications = await prisma.leaveApplication.count({
      where: {
        status: 'PENDING',
        calendar_period_id: currentPeriod.calendar_period_id
      }
    })

    // Get total leave applications this month for current period only
    const currentMonth = new Date()
    currentMonth.setDate(1)
    const nextMonth = new Date(currentMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    const monthlyLeaveApplications = await prisma.leaveApplication.count({
      where: {
        appliedAt: {
          gte: currentMonth,
          lt: nextMonth
        },
        calendar_period_id: currentPeriod.calendar_period_id
      }
    })

    // Get roles and statuses with counts
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    const statuses = await prisma.status.findMany({
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    // Calculate growth rate (compare with previous month)
    const previousMonth = new Date(currentMonth)
    previousMonth.setMonth(previousMonth.getMonth() - 1)
    
    const previousMonthUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: previousMonth,
          lt: currentMonth
        }
      }
    })

    const growthRate = previousMonthUsers > 0 
      ? ((recentUsers - previousMonthUsers) / previousMonthUsers * 100).toFixed(1)
      : "0"

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        recentUsers,
        activeProbations,
        pendingLeaveApplications,
        monthlyLeaveApplications,
        growthRate: parseFloat(growthRate),
        roles: roles.map((role: { role_id: number; name: string; _count: { users: number } }) => ({
          id: role.role_id,
          name: role.name,
          count: role._count.users
        })),
        statuses: statuses.map((status: { status_id: number; name: string; _count: { users: number } }) => ({
          id: status.status_id,
          name: status.name,
          count: status._count.users
        }))
      }
    })

  } catch (error) {
    console.error("Error fetching dashboard statistics:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    )
  }
}
