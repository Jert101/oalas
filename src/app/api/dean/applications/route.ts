import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('🔍 Dean Applications API - Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userRole: (session?.user as any)?.role,
      userId: session?.user?.id
    })
    
    if (!session?.user?.email) {
      console.log('❌ No session or user email found')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        department: true,
        role: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Allow both Dean/Program Head and Department Head to access applications
    const allowedRoles = ["Dean/Program Head", "Department Head"]
    const isAllowed = user.role?.name && allowedRoles.includes(user.role.name)
    const isDepartmentHead = user.isDepartmentHead === true
    
    console.log('🔍 Dean Applications API - User verification:', {
      userId: user.users_id,
      userEmail: user.email,
      userName: user.name,
      roleName: user.role?.name,
      roleId: user.role?.role_id,
      departmentId: user.department_id,
      departmentName: user.department?.name,
      isDepartmentHead: isDepartmentHead
    })
    
    if (!isAllowed && !isDepartmentHead) {
      console.log('❌ Access denied - User role:', user.role?.name, 'Expected: Dean/Program Head or Department Head')
      return NextResponse.json({ error: "Access denied. Dean/Program Head or Department Head role required." }, { status: 403 })
    }
    
    console.log('✅ User verified as:', user.role?.name)

    // Get current calendar period
    const currentPeriod = await prisma.calendarPeriod.findFirst({
      where: { isCurrent: true }
    })

    if (!currentPeriod) {
      return NextResponse.json({ error: "No current calendar period found" }, { status: 404 })
    }

    // Get both leave applications and travel orders for faculty in the dean's department
    const [leaveApplications, travelOrders] = await Promise.all([
      // Leave applications
      prisma.leaveApplication.findMany({
        where: {
          calendar_period_id: currentPeriod.calendar_period_id,
          user: {
            department_id: user.department_id,
            isActive: true
          }
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
      }),
      // Travel orders
      prisma.travelOrder.findMany({
        where: {
          calendar_period_id: currentPeriod.calendar_period_id,
          user: {
            department_id: user.department_id,
            isActive: true
          }
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

    // Get leave types for all leave applications
    const leaveTypeIds = [...new Set(leaveApplications.map(app => app.leave_type_id))]
    const leaveTypes = await prisma.leave_types.findMany({
      where: {
        leave_type_id: {
          in: leaveTypeIds
        }
      }
    })

    // Transform leave applications to match expected format
    const formattedLeaveApplications = leaveApplications.map(app => ({
      ...app,
      leaveType: leaveTypes.find(lt => lt.leave_type_id === app.leave_type_id),
      id: `leave_${app.leave_application_id}`,
      type: 'leave' as const
    }))

    // Transform travel orders to match expected format
    const formattedTravelOrders = travelOrders.map(order => ({
      ...order,
      id: `travel_${order.travel_order_id}`,
      type: 'travel' as const,
      leaveType: null, // Travel orders don't have leave types
      // Map travel order date fields to expected format
      startDate: order.dateOfTravel,
      endDate: order.expectedReturn
    }))

    // Combine both types of applications
    const allApplications = [...formattedLeaveApplications, ...formattedTravelOrders]
    
    // Sort by appliedAt date (most recent first)
    allApplications.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())

    return NextResponse.json({
      success: true,
      data: {
        applications: allApplications,
        deanDepartment: user.department?.name,
        currentPeriod: {
          academicYear: currentPeriod.academicYear,
          startDate: currentPeriod.startDate,
          endDate: currentPeriod.endDate
        }
      }
    })

  } catch (error) {
    console.error('Error fetching dean applications:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
