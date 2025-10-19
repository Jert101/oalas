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
    const [leaveApplications, travelOrders] = await Promise.all([
      // Leave applications
      prisma.leaveApplication.findMany({
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
      }),
      // Travel orders
      prisma.travelOrder.findMany({
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
    ])

    // Transform leave applications to match expected format
    const formattedLeaveApplications = leaveApplications.map(app => ({
      ...app,
      id: `leave_${app.leave_application_id}`,
      type: 'leave' as const
    }))

    // Transform travel orders to match expected format
    const formattedTravelOrders = travelOrders.map(order => ({
      ...order,
      id: `travel_${order.travel_order_id}`,
      type: 'travel' as const,
      leaveType: null // Travel orders don't have leave types
    }))

    // Combine both types of applications
    const allApplications = [...formattedLeaveApplications, ...formattedTravelOrders]
    
    // Sort by appliedAt date (most recent first)
    allApplications.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())

    const data = {
      applications: allApplications,
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
