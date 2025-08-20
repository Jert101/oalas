import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params
    const applicationId = parseInt(resolvedParams.id)
    
    if (isNaN(applicationId)) {
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 })
    }

    // Get the leave application
    const application = await prisma.leaveApplication.findFirst({
      where: {
        leave_application_id: applicationId,
        users_id: user.users_id // Ensure user can only access their own applications
      },
      include: {
        calendarPeriod: {
          include: {
            termType: true
          }
        }
      }
    })

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Get leave type name
    const leaveType = await prisma.leave_types.findUnique({
      where: { leave_type_id: application.leave_type_id }
    })

    // Format the response
    const formattedApplication = {
      id: `leave_${application.leave_application_id}`,
      type: 'leave',
      leaveType: leaveType?.name || 'Unknown',
      startDate: application.startDate.toISOString(),
      endDate: application.endDate.toISOString(),
      status: application.status,
      appliedAt: application.appliedAt.toISOString(),
      reason: application.reason,
      numberOfDays: application.numberOfDays,
      hours: application.hours,
      comments: application.comments,
      reviewedAt: application.reviewedAt?.toISOString(),
      reviewedBy: application.reviewedBy,
      paymentStatus: application.paymentStatus,
      specificPurpose: application.specificPurpose,
      descriptionOfSickness: application.descriptionOfSickness,
      academicYear: application.calendarPeriod?.academicYear,
      termType: application.calendarPeriod?.termType?.name
    }

    return NextResponse.json(formattedApplication)

  } catch (error) {
    console.error('Error fetching leave application:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

