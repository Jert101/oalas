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
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get current calendar period
    const currentPeriod = await prisma.calendarPeriod.findFirst({
      where: { isCurrent: true }
    })

    if (!currentPeriod) {
      return NextResponse.json({ error: "No current calendar period found" }, { status: 404 })
    }

    // Get URL parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause - filter by current calendar period
    const whereClause: {
      users_id: string;
      calendar_period_id: number;
      status?: string;
    } = {
      users_id: user.users_id,
      calendar_period_id: currentPeriod.calendar_period_id // Only show applications from current period
    }

    if (status && status !== 'all') {
      whereClause.status = status
    }

    // Get applications with pagination
    const [applications, totalCount] = await Promise.all([
      prisma.leaveApplication.findMany({
        where: whereClause,
        include: {
          calendarPeriod: {
            include: {
              termType: true
            }
          }
        },
        orderBy: {
          appliedAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.leaveApplication.count({
        where: whereClause
      })
    ])

    // Get travel orders for the same user and period
    const travelOrders = await prisma.travelOrder.findMany({
      where: {
        users_id: user.users_id,
        calendar_period_id: currentPeriod.calendar_period_id
      },
      include: {
        calendarPeriod: {
          include: {
            termType: true
          }
        }
      },
      orderBy: {
        appliedAt: 'desc'
      }
    })

    // Format applications for frontend
    const formattedApplications = []
    
    for (const app of applications) {
      const leaveType = await prisma.leave_types.findUnique({
        where: { leave_type_id: app.leave_type_id }
      })
      
             // Get dean reviewer information if available
      let deanReviewer = null
      if (app.deanReviewedBy) {
        const deanUser = await prisma.user.findUnique({
          where: { users_id: app.deanReviewedBy },
          select: { name: true }
        })
        deanReviewer = deanUser?.name
      }

      const formattedApp = {
         id: `leave_${app.leave_application_id}`,
         type: 'leave', // Add type to distinguish from travel orders
        leaveType: leaveType?.name || 'Unknown',
        startDate: app.startDate.toISOString(),
        endDate: app.endDate.toISOString(),
        status: app.status,
        appliedAt: app.appliedAt.toISOString(),
        reason: app.reason,
        numberOfDays: app.numberOfDays,
        hours: app.hours,
        comments: app.comments,
        reviewedAt: app.reviewedAt?.toISOString(),
        reviewedBy: app.reviewedBy,
        deanReviewedAt: app.deanReviewedAt?.toISOString(),
        deanReviewedBy: deanReviewer,
        deanComments: app.deanComments,
        deanRejectionReason: app.deanRejectionReason,
        paymentStatus: app.paymentStatus,
        specificPurpose: app.specificPurpose,
        descriptionOfSickness: app.descriptionOfSickness,
        academicYear: app.calendarPeriod?.academicYear,
        termType: app.calendarPeriod?.termType?.name
      }
      
      formattedApplications.push(formattedApp)
    }

    // Format travel orders for frontend
    for (const order of travelOrders) {
             const formattedOrder = {
         id: `travel_${order.travel_order_id}`,
         type: 'travel', // Add type to distinguish from leave applications
        leaveType: 'Travel Order', // Use consistent naming
        startDate: order.dateOfTravel.toISOString(),
        endDate: order.expectedReturn.toISOString(),
        status: order.status,
        appliedAt: order.appliedAt.toISOString(),
        reason: order.purpose, // Use purpose as reason
        numberOfDays: Math.ceil((new Date(order.expectedReturn).getTime() - new Date(order.dateOfTravel).getTime()) / (1000 * 60 * 60 * 24)),
        hours: 0, // Travel orders don't have hours
        comments: order.comments,
        reviewedAt: order.reviewedAt?.toISOString(),
        reviewedBy: order.reviewedBy,
        paymentStatus: 'N/A', // Travel orders don't have payment status
        specificPurpose: order.purpose,
        descriptionOfSickness: null,
        academicYear: order.calendarPeriod?.academicYear,
        termType: order.calendarPeriod?.termType?.name,
        // Additional travel order specific fields
        destination: order.destination,
        transportationFee: order.transportationFee,
        seminarConferenceFee: order.seminarConferenceFee,
        mealsAccommodations: order.mealsAccommodations,
        totalCashRequested: order.totalCashRequested,
        remarks: order.remarks
      }
      
      formattedApplications.push(formattedOrder)
    }

    // Sort all applications by applied date (most recent first)
    formattedApplications.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())

    // Apply pagination to combined results
    const paginatedApplications = formattedApplications.slice(skip, skip + limit)
    const totalCombinedCount = formattedApplications.length

    return NextResponse.json({
      applications: paginatedApplications,
      pagination: {
        page,
        limit,
        total: totalCombinedCount,
        totalPages: Math.ceil(totalCombinedCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching leave applications:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
