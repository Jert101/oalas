import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notifyLeaveApplicationApproved } from "@/lib/notification-service"
import { realEmailService } from "@/lib/real-email-service"

export async function POST(
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

    const resolvedParams = await params
    const applicationId = parseInt(resolvedParams.id)

    if (isNaN(applicationId)) {
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 })
    }

    // Get the application
    const application = await prisma.leaveApplication.findUnique({
      where: {
        leave_application_id: applicationId
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            users_id: true,
            department: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Verify the application belongs to a faculty member in the dean's department
    if (application.user.department?.name !== user.department?.name) {
      return NextResponse.json({ error: "Access denied - Application not in your department" }, { status: 403 })
    }

    // Check if application is in PENDING status
    if (application.status !== 'PENDING') {
      return NextResponse.json({ error: "Application is not in pending status" }, { status: 400 })
    }

    // Update application status to DEAN_APPROVED
    const updatedApplication = await prisma.leaveApplication.update({
      where: {
        leave_application_id: applicationId
      },
      data: {
        status: 'DEAN_APPROVED',
        deanReviewedAt: new Date(),
        deanReviewedBy: user.users_id,
        deanComments: 'Approved by Dean'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Send notification to applicant
    await notifyLeaveApplicationApproved(application.user.users_id, applicationId)

    // Send email notification to applicant
    await realEmailService.sendLeaveApplicationApprovedEmail(
      application.user.email,
      application.user.name,
      applicationId,
      user.name
    )

    return NextResponse.json({
      success: true,
      message: "Application approved successfully",
      data: {
        application: updatedApplication
      }
    })

  } catch (error) {
    console.error('Error approving application:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
