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
        status: true,
        role: true
      }
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

    // Get leave balances for current period
    const leaveBalances = await prisma.leaveBalance.findMany({
      where: {
        users_id: user.users_id,
        calendar_period_id: currentPeriod.calendar_period_id
      },
      include: {
        leaveType: true
      }
    })

    // Calculate total statistics
    const totalLeaveDays = leaveBalances.reduce((sum, balance) => sum + balance.allowedDays, 0)
    const usedLeaveDays = leaveBalances.reduce((sum, balance) => sum + balance.usedDays, 0)
    const remainingLeaveDays = leaveBalances.reduce((sum, balance) => sum + balance.remainingDays, 0)

    // Get application counts
    const applications = await prisma.leaveApplication.findMany({
      where: {
        users_id: user.users_id,
        calendar_period_id: currentPeriod.calendar_period_id
      }
    })

    const pendingApplications = applications.filter(app => app.status === 'PENDING').length
    const approvedApplications = applications.filter(app => app.status === 'APPROVED').length
    const rejectedApplications = applications.filter(app => app.status === 'REJECTED').length

    return NextResponse.json({
      totalLeaveDays,
      usedLeaveDays,
      remainingLeaveDays,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      user: {
        name: user.name,
        department: user.department?.name,
        status: user.status?.name,
        role: user.role?.name
      }
    })

  } catch (error) {
    console.error('Error fetching teacher dashboard data:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
