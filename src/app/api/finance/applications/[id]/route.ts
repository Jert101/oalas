import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
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

    console.log('🔍 Finance Application Detail API - Request details:', {
      applicationId: applicationId,
      originalId: originalId,
      isTravelOrder: isTravelOrder,
      isNaN: isNaN(applicationId)
    })

    if (isNaN(applicationId)) {
      console.log('❌ Invalid application ID:', originalId)
      return NextResponse.json(
        { success: false, error: 'Invalid application ID' },
        { status: 400 }
      )
    }

    // Get the application (either leave or travel - finance can see any application)
    console.log('🔍 Finance Application Detail API - Looking up application:', applicationId, 'Type:', isTravelOrder ? 'travel' : 'leave')
    
    let application
    if (isTravelOrder) {
      application = await prisma.travelOrder.findUnique({
        where: {
          travel_order_id: applicationId
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
      application = await prisma.leaveApplication.findUnique({
        where: {
          leave_application_id: applicationId
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
          },
          leaveType: {
            select: {
              leave_type_id: true,
              name: true,
              description: true
            }
          }
        }
      })
    }

    console.log('🔍 Finance Application Detail API - Application found:', !!application)
    if (application) {
      const appId = isTravelOrder ? application.travel_order_id : application.leave_application_id
      console.log('🔍 Finance Application Detail API - Application details:', {
        id: appId,
        type: isTravelOrder ? 'travel' : 'leave',
        applicantName: application.user.name,
        applicantEmail: application.user.email,
        applicantDeptName: application.user.department?.name
      })
    }

    if (!application) {
      console.log('❌ Finance Application Detail API - Application not found')
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      )
    }

    // For travel orders, leaveType is null; for leave applications, it's already included
    const applicationWithLeaveType = {
      ...application,
      leaveType: isTravelOrder ? null : application.leaveType,
      // Map travel order date fields to expected format for frontend compatibility
      startDate: isTravelOrder ? application.dateOfTravel : application.startDate,
      endDate: isTravelOrder ? application.expectedReturn : application.endDate
    }

    console.log('✅ Finance Application Detail API - Successfully returning application')

    return NextResponse.json({
      success: true,
      data: {
        application: applicationWithLeaveType
      }
    })

  } catch (error) {
    console.error('Error fetching finance application:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
