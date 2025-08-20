import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyFinanceRejectionToDean } from '@/lib/notification-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'Finance Officer') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const applicationId = parseInt(params.id)
    if (isNaN(applicationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid application ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { rejectionReason } = body

    if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    // Get the application
    const application = await prisma.leaveApplication.findUnique({
      where: {
        leave_application_id: applicationId
      }
    })

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      )
    }

    // Check if application is in the correct status for finance rejection
    if (application.status !== 'DEAN_APPROVED') {
      return NextResponse.json(
        { success: false, error: 'Application must be approved by dean before finance can reject' },
        { status: 400 }
      )
    }

    // Update the application status to DENIED
    const updatedApplication = await prisma.leaveApplication.update({
      where: {
        leave_application_id: applicationId
      },
      data: {
        status: 'DENIED',
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
        comments: `Rejected by Finance Officer: ${rejectionReason.trim()}`
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
        reviewer: {
          select: {
            name: true,
            email: true
          }
        },
        calendarPeriod: {
          select: {
            academicYear: true,
            startDate: true,
            endDate: true
          }
        }
      }
    })

    // Get leave type information
    const leaveType = await prisma.leave_types.findUnique({
      where: {
        leave_type_id: updatedApplication.leave_type_id
      },
      select: {
        leave_type_id: true,
        name: true,
        description: true
      }
    })

    // Add leave type information to application
    const applicationWithLeaveType = {
      ...updatedApplication,
      leaveType: leaveType || null
    }

    // Notify Dean about the rejection (Dean needs to review before applicant is notified)
    try {
      // Find Dean user
      const deanUser = await prisma.user.findFirst({
        where: {
          role: {
            name: 'Dean/Program Head'
          }
        }
      })

      if (deanUser) {
        await notifyFinanceRejectionToDean(
          deanUser.users_id,
          application.user.name,
          applicationId,
          rejectionReason.trim()
        )
        console.log(`✅ Finance rejection notification sent to Dean: ${deanUser.name}`)
      } else {
        console.log('⚠️ No Dean user found to notify about finance rejection')
      }
    } catch (error) {
      console.error('❌ Error sending finance rejection notification to Dean:', error)
      // Don't fail the rejection if notification fails
    }

    return NextResponse.json({
      success: true,
      data: {
        application: applicationWithLeaveType
      }
    })

  } catch (error) {
    console.error('Error rejecting finance application:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
