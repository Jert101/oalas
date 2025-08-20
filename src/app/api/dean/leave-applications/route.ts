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
      include: {
        department: true,
        role: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify user is a Dean/Program Head
    if (user.role?.name !== "Dean/Program Head") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get all leave applications for this dean
    const leaveApplications = await prisma.leaveApplication.findMany({
      where: {
        users_id: user.users_id
      },
      include: {
        leaveType: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        appliedAt: 'desc'
      }
    })

    // Transform the applications to match the expected format
    const formattedApplications = leaveApplications.map(app => ({
      id: `leave_${app.leave_application_id}`,
      type: 'leave' as const,
      leaveType: app.leaveType?.name || 'Unknown',
      startDate: app.startDate,
      endDate: app.endDate,
      status: app.status,
      appliedAt: app.appliedAt,
      reason: app.reason,
      numberOfDays: app.numberOfDays,
      comments: app.comments,
      specificPurpose: app.specificPurpose,
      descriptionOfSickness: app.descriptionOfSickness,
      paymentStatus: app.paymentStatus,
      medicalProof: app.medicalProof,
      deanReviewedAt: app.deanReviewedAt,
      deanReviewedBy: app.deanReviewedBy,
      deanComments: app.deanComments,
      deanRejectionReason: app.deanRejectionReason,
      reviewedAt: app.reviewedAt,
      reviewer: app.reviewer
    }))

    // Get all travel orders for this dean
    const travelOrders = await prisma.travelOrder.findMany({
      where: {
        users_id: user.users_id
      },
      orderBy: {
        appliedAt: 'desc'
      }
    })

    // Transform travel orders to match the expected format
    const formattedTravelOrders = travelOrders.map(order => ({
      id: `travel_${order.travel_order_id}`,
      type: 'travel' as const,
      leaveType: 'Travel Order',
      startDate: order.dateOfTravel,
      endDate: order.expectedReturn,
      status: order.status,
      appliedAt: order.appliedAt,
      reason: order.purpose,
      numberOfDays: 0, // Travel orders don't have numberOfDays
      comments: order.remarks,
      destination: order.destination,
      purpose: order.purpose,
      deanReviewedAt: order.deanReviewedAt,
      deanReviewedBy: order.deanReviewedBy,
      deanComments: order.deanComments,
      deanRejectionReason: order.deanRejectionReason,
      reviewedAt: order.reviewedAt,
      reviewer: order.reviewer
    }))

    // Combine and sort all applications by appliedAt date
    const allApplications = [...formattedApplications, ...formattedTravelOrders]
      .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())

    return NextResponse.json({
      success: true,
      applications: allApplications
    })

  } catch (error) {
    console.error('Error fetching dean applications:', error)
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    )
  }
}



