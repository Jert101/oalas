import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyFinanceApproval } from '@/lib/notification-service'
import { emailService } from '@/lib/email-service'

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

    // Check if application is in the correct status for finance approval
    if (application.status !== 'DEAN_APPROVED') {
      return NextResponse.json(
        { success: false, error: 'Application must be approved by dean before finance can approve' },
        { status: 400 }
      )
    }

    // Update the application status to APPROVED
    const updatedApplication = await prisma.leaveApplication.update({
      where: {
        leave_application_id: applicationId
      },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
        comments: 'Approved by Finance Officer'
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

    // Deduct leave balance only when both dean and finance approve
    // This ensures balance is only deducted for fully approved applications
    
    // Get current calendar period to check if it's summer (shared balance)
    const currentPeriod = await prisma.calendarPeriod.findFirst({
      where: { isCurrent: true },
      include: {
        termType: true
      }
    })

    if (currentPeriod) {
      const isSummerPeriod = currentPeriod.termType?.name?.toLowerCase().includes('summer')
      
      if (isSummerPeriod) {
        // For summer period, update shared leave balance
        // Find any leave balance record for this user and period (they should all be the same)
        const sharedLeaveBalance = await prisma.leaveBalance.findFirst({
          where: {
            users_id: updatedApplication.users_id,
            calendar_period_id: updatedApplication.calendar_period_id
          }
        })

        if (sharedLeaveBalance) {
          await prisma.leaveBalance.update({
            where: {
              leave_balance_id: sharedLeaveBalance.leave_balance_id
            },
            data: {
              usedDays: {
                increment: updatedApplication.numberOfDays
              },
              remainingDays: {
                decrement: updatedApplication.numberOfDays
              }
            }
          })
          
          console.log(`✅ Shared leave balance updated for summer period - user ${updatedApplication.users_id}: ${updatedApplication.numberOfDays} days deducted`)
        } else {
          console.log(`⚠️ No shared leave balance found for user ${updatedApplication.users_id} in summer period`)
        }
      } else {
        // For non-summer periods, update specific leave type balance
        const leaveBalance = await prisma.leaveBalance.findFirst({
          where: {
            users_id: updatedApplication.users_id,
            calendar_period_id: updatedApplication.calendar_period_id,
            leave_type_id: updatedApplication.leave_type_id
          }
        })

        if (leaveBalance) {
          await prisma.leaveBalance.update({
            where: {
              leave_balance_id: leaveBalance.leave_balance_id
            },
            data: {
              usedDays: {
                increment: updatedApplication.numberOfDays
              },
              remainingDays: {
                decrement: updatedApplication.numberOfDays
              }
            }
          })
          
          console.log(`✅ Leave balance updated for user ${updatedApplication.users_id}: ${updatedApplication.numberOfDays} days deducted`)
        } else {
          console.log(`⚠️ No leave balance found for user ${updatedApplication.users_id}`)
        }
      }
    }

    // Send notification and email to applicant
    try {
      // Send in-app notification
      await notifyFinanceApproval(application.userId, applicationId)
      
      // Send email notification
      await emailService.sendFinanceApprovalEmail(
        application.user.email,
        application.user.name,
        applicationId,
        leaveType?.name || 'Leave',
        application.startDate,
        application.endDate
      )
      
      console.log(`✅ Finance approval notifications sent to ${application.user.name}`)
    } catch (error) {
      console.error('❌ Error sending finance approval notifications:', error)
      // Don't fail the approval if notifications fail
    }

    return NextResponse.json({
      success: true,
      data: {
        application: applicationWithLeaveType
      }
    })

  } catch (error) {
    console.error('Error approving finance application:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
