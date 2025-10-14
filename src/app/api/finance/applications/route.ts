import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'Finance Department' && session.user.role !== 'Finance Officer' && session.user.role !== 'Finance Office Head')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get ALL applications (finance can see all applications regardless of period)
    const applications = await prisma.leaveApplication.findMany({
      where: {
        // No period filter - finance can see all applications
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
      },
      orderBy: {
        appliedAt: 'desc'
      }
    })

    // Add leave type information to applications (already included in the query)
    const applicationsWithLeaveTypes = applications

    const data = {
      applications: applicationsWithLeaveTypes,
      currentPeriod: {
        academicYear: 'All Periods',
        startDate: 'N/A',
        endDate: 'N/A'
      }
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Error fetching finance applications:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
