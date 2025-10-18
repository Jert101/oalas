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

    // Get recent applications (last 5)
    const applications = await prisma.leaveApplication.findMany({
      where: {
        users_id: user.users_id,
        calendar_period_id: currentPeriod.calendar_period_id
      },
      include: {
        leaveType: true
      },
      orderBy: {
        appliedAt: 'desc'
      },
      take: 5
    })

    // Format applications for frontend
    const formattedApplications = applications.map(app => ({
      id: app.leave_application_id,
      leaveType: app.leaveType.name,
      startDate: app.startDate.toISOString(),
      endDate: app.endDate.toISOString(),
      status: app.status,
      appliedAt: app.appliedAt.toISOString(),
      reason: app.reason,
      numberOfDays: app.numberOfDays
    }))

    return NextResponse.json({
      applications: formattedApplications
    })

  } catch (error) {
    console.error('Error fetching recent applications:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
