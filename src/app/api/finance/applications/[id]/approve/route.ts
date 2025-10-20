import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyFinanceApproval } from '@/lib/notification-service'
import { emailService } from '@/lib/email-service'

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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'Finance Department' && session.user.role !== 'Finance Officer' && session.user.role !== 'Finance Office Head')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Handle different ID formats: "leave_24", "travel_5", or just "24"
    const originalId = params.id
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

    // Get the application (handle both leave and travel orders)
    let application
    if (isTravelOrder) {
      // For travel orders, update the travel order status
      application = await prisma.travelOrder.findUnique({
        where: {
          travel_order_id: applicationId
        }
      })
    } else {
      // For leave applications
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

    // Check if application is in the correct status for finance approval
    if (application.status !== 'DEAN_APPROVED') {
      return NextResponse.json(
        { success: false, error: 'Application must be approved by dean before finance can approve' },
        { status: 400 }
      )
    }

    // Update the application status to APPROVED
    let updatedApplication
    if (isTravelOrder) {
      updatedApplication = await prisma.travelOrder.update({
        where: {
          travel_order_id: applicationId
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
    } else {
      updatedApplication = await prisma.leaveApplication.update({
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

    // Deduct leave balance only for leave applications (not travel orders)
    // Travel orders don't affect leave balances
    if (!isTravelOrder) {
      try {
        console.log('🔍 Finance Approval - Starting leave balance deduction process')
        const appId = updatedApplication.leave_application_id || updatedApplication.travel_order_id
        console.log('🔍 Finance Approval - Application details:', {
          applicationId: appId,
          userId: updatedApplication.users_id,
          leaveTypeId: updatedApplication.leave_type_id,
          numberOfDays: updatedApplication.numberOfDays,
          calendarPeriodId: updatedApplication.calendar_period_id,
          isTravelOrder: isTravelOrder
        })
        
        // Get current calendar period to check if it's summer (shared balance)
        const currentPeriod = await prisma.calendarPeriod.findFirst({
          where: { isCurrent: true },
          include: {
            termType: true
          }
        })

        console.log('🔍 Finance Approval - Current period:', {
          periodId: currentPeriod?.calendar_period_id,
          periodName: currentPeriod?.academicYear,
          termTypeName: currentPeriod?.termType?.name,
          isCurrent: currentPeriod?.isCurrent
        })

        if (currentPeriod) {
          const isSummerPeriod = currentPeriod.termType?.name?.toLowerCase().includes('summer')
          console.log('🔍 Finance Approval - Is summer period:', isSummerPeriod)
          
          if (isSummerPeriod) {
            // For summer period, update shared leave balance
            // Find any leave balance record for this user and period (they should all be the same)
            console.log('🔍 Finance Approval - Looking for shared leave balance (summer period)')
            const sharedLeaveBalance = await prisma.leaveBalance.findFirst({
              where: {
                users_id: updatedApplication.users_id,
                calendar_period_id: updatedApplication.calendar_period_id
              }
            })

            console.log('🔍 Finance Approval - Shared leave balance found:', !!sharedLeaveBalance)
            if (sharedLeaveBalance) {
              console.log('🔍 Finance Approval - Shared leave balance details:', {
                balanceId: sharedLeaveBalance.leave_balance_id,
                currentUsedDays: sharedLeaveBalance.usedDays,
                currentRemainingDays: sharedLeaveBalance.remainingDays,
                daysToDeduct: updatedApplication.numberOfDays
              })
              
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
              console.log('🔍 Finance Approval - Available leave balances for this user:', await prisma.leaveBalance.findMany({
                where: { users_id: updatedApplication.users_id },
                select: { leave_balance_id: true, calendar_period_id: true, leave_type_id: true, usedDays: true, remainingDays: true }
              }))
            }
          } else {
            // For non-summer periods, update specific leave type balance
            console.log('🔍 Finance Approval - Looking for specific leave type balance (non-summer period)')
            const leaveBalance = await prisma.leaveBalance.findFirst({
              where: {
                users_id: updatedApplication.users_id,
                calendar_period_id: updatedApplication.calendar_period_id,
                leave_type_id: updatedApplication.leave_type_id
              }
            })

            console.log('🔍 Finance Approval - Specific leave balance found:', !!leaveBalance)
            if (leaveBalance) {
              console.log('🔍 Finance Approval - Specific leave balance details:', {
                balanceId: leaveBalance.leave_balance_id,
                currentUsedDays: leaveBalance.usedDays,
                currentRemainingDays: leaveBalance.remainingDays,
                daysToDeduct: updatedApplication.numberOfDays
              })
              
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
              console.log('🔍 Finance Approval - Available leave balances for this user:', await prisma.leaveBalance.findMany({
                where: { users_id: updatedApplication.users_id },
                select: { leave_balance_id: true, calendar_period_id: true, leave_type_id: true, usedDays: true, remainingDays: true }
              }))
            }
          }
        } else {
          console.log('⚠️ Finance Approval - No current period found, skipping leave balance deduction')
        }
      } catch (balanceError) {
        console.error('❌ Finance Approval - Error during leave balance deduction:', balanceError)
        // Don't fail the entire approval if balance deduction fails
      }
    } else {
      console.log('🔍 Finance Approval - Travel order approved, no leave balance deduction needed')
    }

    // Send notification and email to applicant
    try {
      await notifyFinanceApproval(
        application.users_id,  // Fixed: was application.userId
        applicationId,
        isTravelOrder ? 'Travel Order' : (leaveType?.name || 'Leave')
      )
      
      console.log(`✅ Finance approval notifications sent to ${application.user.name}`)
    } catch (error) {
      console.error('❌ Error sending finance approval notifications:', error)
      // Don't fail the approval if notifications fail
    }

    // Send real-time application update
    await sendRealtimeApplicationUpdate(application.users_id, applicationWithLeaveType, 'update')  // Fixed: was application.userId

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
