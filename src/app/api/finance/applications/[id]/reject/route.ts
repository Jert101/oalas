import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyFinanceRejectionToDean, notifyFinanceRejectionToApplicant } from '@/lib/notification-service'

// Function to send real-time application updates
async function sendRealtimeApplicationUpdate(userId: string, application: any, updateType: 'update') {
  try {
    const message = {
      type: 'application_update',
      userId: userId,
      data: {
        type: updateType,
        application: {
          id: application.leave_application_id,
          leaveType: application.leaveType?.name || 'Unknown',
          startDate: application.startDate,
          endDate: application.endDate,
          status: application.status,
          appliedAt: application.appliedAt,
          reason: application.reason,
          numberOfDays: application.numberOfDays,
          comments: application.comments,
          type: 'leave'
        }
      }
    }
    
    // Send via HTTP to WebSocket server API
    const response = await fetch(`http://localhost:3001/api/realtime/application`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        type: updateType,
        application: message.data.application
      })
    })
    
    if (response.ok) {
      console.log('✅ Real-time application update sent successfully')
    } else {
      console.warn('⚠️ Failed to send real-time application update:', response.status)
    }
  } catch (error) {
    console.warn('Failed to send real-time application update:', error)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'Finance Department' && session.user.role !== 'Finance Officer' && session.user.role !== 'Finance Office Head')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    
    // Handle different ID formats: "leave_24", "travel_5", or just "24"
    const originalId = resolvedParams.id
    let applicationId: number
    let isTravelOrder = false
    
    if (originalId.startsWith('leave_')) {
      applicationId = parseInt(originalId.replace('leave_', ''))
      isTravelOrder = false
    } else if (originalId.startsWith('travel_')) {
      applicationId = parseInt(originalId.replace('travel_', ''))
      isTravelOrder = true
    } else {
      applicationId = parseInt(originalId)
      isTravelOrder = false
    }

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

    // Get the application (handle both leave and travel orders)
    let application
    if (isTravelOrder) {
      application = await prisma.travelOrder.findUnique({
        where: {
          travel_order_id: applicationId
        }
      })
    } else {
      application = await prisma.leaveApplication.findUnique({
        where: {
          leave_application_id: applicationId
        }
      })
    }

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
    let updatedApplication
    if (isTravelOrder) {
      updatedApplication = await prisma.travelOrder.update({
        where: {
          travel_order_id: applicationId
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
    } else {
      updatedApplication = await prisma.leaveApplication.update({
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
    }

    // Get leave type information (only for leave applications)
    let leaveType = null
    if (!isTravelOrder && updatedApplication.leave_type_id) {
      leaveType = await prisma.leave_types.findUnique({
        where: {
          leave_type_id: updatedApplication.leave_type_id
        },
        select: {
          leave_type_id: true,
          name: true,
          description: true
        }
      })
    }

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

      // Send notification and email to applicant about rejection
      try {
        const isTravelOrder = application.travel_order_id !== null
        const leaveType = isTravelOrder ? 'Travel Order' : (application.leaveType?.name || 'Leave')
        
        await notifyFinanceRejectionToApplicant(
          application.users_id,
          applicationId,
          rejectionReason.trim(),
          leaveType
        )
        console.log(`✅ Finance rejection notification sent to Applicant: ${application.user.name}`)
      } catch (error) {
        console.error('❌ Error sending finance rejection notification to Applicant:', error)
      }
    } catch (error) {
      console.error('❌ Error sending finance rejection notification to Dean:', error)
      // Don't fail the rejection if notification fails
    }

    // Send real-time application update
    await sendRealtimeApplicationUpdate(application.users_id, applicationWithLeaveType, 'update')

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
