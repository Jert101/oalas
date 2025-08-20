import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyFinanceRejectionToApplicant } from '@/lib/notification-service'
import { emailService } from '@/lib/email-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'Dean/Program Head') {
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

    // Get the application
    const application = await prisma.leaveApplication.findUnique({
      where: {
        leave_application_id: applicationId
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

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      )
    }

    // Check if application is in DENIED status (rejected by Finance)
    if (application.status !== 'DENIED') {
      return NextResponse.json(
        { success: false, error: 'Application is not in rejected status' },
        { status: 400 }
      )
    }

    // Extract rejection reason from comments
    const rejectionReason = application.comments?.replace('Rejected by Finance Officer: ', '') || 'No reason provided'

    // Send notification and email to applicant
    try {
      // Send in-app notification
      await notifyFinanceRejectionToApplicant(application.userId, applicationId, rejectionReason)
      
      // Send email notification
      await emailService.sendFinanceRejectionEmail(
        application.user.email,
        application.user.name,
        applicationId,
        rejectionReason
      )
      
      console.log(`✅ Rejection notification sent to applicant: ${application.user.name}`)
    } catch (error) {
      console.error('❌ Error sending rejection notification to applicant:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to send notification to applicant' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Applicant has been notified about the rejection'
    })

  } catch (error) {
    console.error('Error notifying applicant about rejection:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
