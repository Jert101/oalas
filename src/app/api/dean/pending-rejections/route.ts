import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is authorized (Dean/Program Head or Department Head)
    const allowedRoles = ["Dean/Program Head", "Department Head"]
    const isAllowed = user.role?.name && allowedRoles.includes(user.role.name)
    const isDepartmentHead = user.isDepartmentHead === true

    if (!isAllowed && !isDepartmentHead) {
      return NextResponse.json({ error: "Access denied. Dean/Program Head or Department Head role required." }, { status: 403 })
    }

    // Get pending rejections that need acknowledgment
    // These are applications that:
    // 1. Have status 'REJECTED'
    // 2. Are in the same department as the dean
    // 3. Haven't been acknowledged by the dean yet (deanAcknowledgedRejection = false or null)

    // Get leave applications pending acknowledgment
    const pendingLeaveApplications = await prisma.leaveApplication.findMany({
      where: {
        status: 'REJECTED',
        user: {
          department: user.department
        },
        deanAcknowledgedRejection: {
          not: true
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            department: true
          }
        },
        leaveType: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Get travel orders pending acknowledgment
    const pendingTravelOrders = await prisma.travelOrder.findMany({
      where: {
        status: 'REJECTED',
        user: {
          department: user.department
        },
        deanAcknowledgedRejection: {
          not: true
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            department: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Format the data for frontend
    const formattedLeaveApplications = pendingLeaveApplications.map(app => ({
      id: `leave_${app.leave_application_id}`,
      type: 'leave',
      applicantName: app.user.name,
      applicantEmail: app.user.email,
      leaveType: app.leaveType.name,
      startDate: app.startDate,
      endDate: app.endDate,
      appliedAt: app.appliedAt,
      updatedAt: app.updatedAt,
      rejectionReason: app.comments || 'No reason provided',
      department: app.user.department
    }))

    const formattedTravelOrders = pendingTravelOrders.map(order => ({
      id: `travel_${order.travel_order_id}`,
      type: 'travel',
      applicantName: order.user.name,
      applicantEmail: order.user.email,
      leaveType: 'Travel Order',
      startDate: order.dateOfTravel,
      endDate: order.expectedReturn,
      appliedAt: order.appliedAt,
      updatedAt: order.updatedAt,
      rejectionReason: order.comments || 'No reason provided',
      department: order.user.department
    }))

    // Combine and sort by update date
    const allPendingRejections = [...formattedLeaveApplications, ...formattedTravelOrders]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    return NextResponse.json({
      success: true,
      pendingRejections: allPendingRejections,
      count: allPendingRejections.length
    })

  } catch (error) {
    console.error('Error fetching pending rejections:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
