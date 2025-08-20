import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
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

    // Get the application (finance can see any application)
    const application = await prisma.leaveApplication.findUnique({
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
        }
      }
    })

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      )
    }

    // Get leave type information
    const leaveType = await prisma.leave_types.findUnique({
      where: {
        leave_type_id: application.leave_type_id
      },
      select: {
        leave_type_id: true,
        name: true,
        description: true
      }
    })

    // Add leave type information to application
    const applicationWithLeaveType = {
      ...application,
      leaveType: leaveType || null
    }

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
