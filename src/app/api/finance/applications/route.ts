import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'Finance Officer') {
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
        }
      },
      orderBy: {
        appliedAt: 'desc'
      }
    })

    // Get leave types for all applications
    const leaveTypeIds = [...new Set(applications.map(app => app.leave_type_id))]
    const leaveTypes = await prisma.leave_types.findMany({
      where: {
        leave_type_id: {
          in: leaveTypeIds
        }
      },
      select: {
        leave_type_id: true,
        name: true,
        description: true
      }
    })

    // Create a map for quick lookup
    const leaveTypeMap = new Map(leaveTypes.map(lt => [lt.leave_type_id, lt]))

    // Add leave type information to applications
    const applicationsWithLeaveTypes = applications.map(app => ({
      ...app,
      leaveType: leaveTypeMap.get(app.leave_type_id) || null
    }))

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
