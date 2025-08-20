import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notifyLeaveApplicationSubmitted, notifyNewApplicationForDean } from "@/lib/notification-service"
import { validateNewApplication } from "@/lib/validation-service"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      leaveTypeId,
      startDate,
      endDate,
      numberOfDays,
      hours,
      paymentStatus,
      specificPurpose,
      descriptionOfSickness,
      medicalProof
    } = body

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

    // Validate required fields
    if (!leaveTypeId || !startDate || !endDate || !numberOfDays || !hours) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate application (check for pending applications and date conflicts)
    const validation = await validateNewApplication(user.users_id, new Date(startDate), new Date(endDate))
    if (!validation.canApply) {
      return NextResponse.json({ 
        error: validation.reason,
        validationDetails: validation
      }, { status: 400 })
    }

    // Create leave application
    const leaveApplication = await prisma.leaveApplication.create({
      data: {
        users_id: user.users_id,
        calendar_period_id: currentPeriod.calendar_period_id,
        leave_type_id: leaveTypeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason: specificPurpose || descriptionOfSickness || "Leave application",
        status: 'PENDING',
        appliedAt: new Date(),
        paymentStatus: paymentStatus || 'PAID',
        numberOfDays: numberOfDays,
        hours: hours,
        specificPurpose: specificPurpose || null,
        descriptionOfSickness: descriptionOfSickness || null
      }
    })

    // Note: Leave balance will be deducted only when both dean and finance approve
    // This prevents deduction for rejected applications

    // Send notification to the applicant
    await notifyLeaveApplicationSubmitted(user.users_id, leaveApplication.leave_application_id)

    // Send notification to the dean of the department
    if (user.department_id) {
      const dean = await prisma.user.findFirst({
        where: {
          department_id: user.department_id,
          role: {
            name: "Dean/Program Head"
          }
        }
      })

      if (dean) {
        await notifyNewApplicationForDean(
          dean.users_id, 
          user.name, 
          leaveApplication.leave_application_id
        )
      }
    }

    return NextResponse.json({
      message: "Leave application submitted successfully",
      applicationId: leaveApplication.leave_application_id
    })

  } catch (error) {
    console.error('Error submitting leave application:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
