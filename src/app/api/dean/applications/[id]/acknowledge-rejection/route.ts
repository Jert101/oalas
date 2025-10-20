import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyFinanceRejectionToApplicant } from '@/lib/notification-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const applicationId = resolvedParams.id

    // Verify user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is authorized (Dean/Program Head or Department Head)
    const allowedRoles = ["Dean/Program Head", "Department Head"]
    const isAllowed = user.role?.name && allowedRoles.includes(user.role.name)
    const isDepartmentHead = user.isDepartmentHead === true

    if (!isAllowed && !isDepartmentHead) {
      return NextResponse.json({ error: "Access denied. Dean/Program Head or Department Head role required." }, { status: 403 })
    }

    // Parse the application ID to determine if it's a leave application or travel order
    const isLeaveApplication = applicationId.startsWith('leave_')
    const isTravelOrder = applicationId.startsWith('travel_')
    
    if (!isLeaveApplication && !isTravelOrder) {
      return NextResponse.json({ error: "Invalid application ID format" }, { status: 400 })
    }

    const numericId = parseInt(applicationId.split('_')[1])
    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 })
    }

    // Fetch the application
    let application = null
    if (isLeaveApplication) {
      application = await prisma.leaveApplication.findUnique({
        where: { leave_application_id: numericId },
        include: {
          user: true,
          leaveType: true
        }
      })
    } else if (isTravelOrder) {
      application = await prisma.travelOrder.findUnique({
        where: { travel_order_id: numericId },
        include: {
          user: true
        }
      })
    }

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Check if the application was rejected by finance
    if (application.status !== 'REJECTED') {
      return NextResponse.json({ error: "Application is not in rejected status" }, { status: 400 })
    }

    // Check if this dean is authorized to handle this application
    if (isLeaveApplication) {
      // For leave applications, check if the applicant is in the same department
      if (application.user.department !== user.department) {
        return NextResponse.json({ error: "You can only acknowledge rejections for applications in your department" }, { status: 403 })
      }
    } else if (isTravelOrder) {
      // For travel orders, check if the applicant is in the same department
      if (application.user.department !== user.department) {
        return NextResponse.json({ error: "You can only acknowledge rejections for applications in your department" }, { status: 403 })
      }
    }

    // Update the application status to indicate dean acknowledgment
    if (isLeaveApplication) {
      await prisma.leaveApplication.update({
        where: { leave_application_id: numericId },
        data: {
          deanAcknowledgedRejection: true,
          deanAcknowledgedAt: new Date(),
          deanAcknowledgedBy: user.users_id
        }
      })
    } else if (isTravelOrder) {
      await prisma.travelOrder.update({
        where: { travel_order_id: numericId },
        data: {
          deanAcknowledgedRejection: true,
          deanAcknowledgedAt: new Date(),
          deanAcknowledgedBy: user.users_id
        }
      })
    }

    // Send notification and email to the applicant about the rejection
    try {
      const isTravelOrderApp = application.travel_order_id !== null
      const leaveType = isTravelOrderApp ? 'Travel Order' : (application.leaveType?.name || 'Leave')
      const rejectionReason = application.comments || 'No reason provided'
      
      await notifyFinanceRejectionToApplicant(
        application.users_id,
        numericId,
        rejectionReason,
        leaveType
      )
      
      console.log(`✅ Dean acknowledged rejection and notified applicant: ${application.user.name}`)
    } catch (error) {
      console.error('❌ Error sending rejection notification to applicant:', error)
      // Don't fail the acknowledgment if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Rejection acknowledged and applicant notified successfully',
      applicationId: numericId,
      applicantName: application.user.name
    })

  } catch (error) {
    console.error('Error acknowledging rejection:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
