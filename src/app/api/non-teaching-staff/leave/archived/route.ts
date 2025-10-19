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

    // Get all past calendar periods (not current)
    const archivedPeriods = await prisma.calendarPeriod.findMany({
      where: { 
        isCurrent: false,
        isActive: true
      },
      include: {
        termType: true
      },
      orderBy: {
        calendar_period_id: 'desc'
      }
    })

    // For each period, get the user's applications
    const periodsWithApplications = []

    for (const period of archivedPeriods) {
      const [applications, travelOrders] = await Promise.all([
        prisma.leaveApplication.findMany({
          where: {
            users_id: user.users_id,
            calendar_period_id: period.calendar_period_id
          },
          orderBy: {
            appliedAt: 'desc'
          }
        }),
        prisma.travelOrder.findMany({
          where: {
            users_id: user.users_id,
            calendar_period_id: period.calendar_period_id
          },
          orderBy: {
            appliedAt: 'desc'
          }
        })
      ])

      // Only include periods that have applications or travel orders
      if (applications.length > 0 || travelOrders.length > 0) {
        // Format applications for frontend
        const formattedApplications = []
        
        for (const app of applications) {
          const leaveType = await prisma.leave_types.findUnique({
            where: { leave_type_id: app.leave_type_id }
          })
          
                     const formattedApp = {
             id: `leave_${app.leave_application_id}`,
             type: 'leave',
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
            paymentStatus: app.paymentStatus,
            specificPurpose: app.specificPurpose,
            descriptionOfSickness: app.descriptionOfSickness,
            academicYear: period.academicYear,
            termType: period.termType.name
          }
          
          formattedApplications.push(formattedApp)
        }

        // Format travel orders for frontend
        for (const order of travelOrders) {
                     const formattedOrder = {
             id: `travel_${order.travel_order_id}`,
             type: 'travel',
            leaveType: 'Travel Order',
            startDate: order.dateOfTravel.toISOString(),
            endDate: order.expectedReturn.toISOString(),
            status: order.status,
            appliedAt: order.appliedAt.toISOString(),
            reason: order.purpose,
            numberOfDays: Math.ceil((new Date(order.expectedReturn).getTime() - new Date(order.dateOfTravel).getTime()) / (1000 * 60 * 60 * 24)),
            hours: 0,
            comments: order.comments,
            reviewedAt: order.reviewedAt?.toISOString(),
            reviewedBy: order.reviewedBy,
            paymentStatus: 'N/A',
            specificPurpose: order.purpose,
            descriptionOfSickness: null,
            academicYear: period.academicYear,
            termType: period.termType.name,
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

        periodsWithApplications.push({
          calendar_period_id: period.calendar_period_id,
          academicYear: period.academicYear,
          termType: {
            name: period.termType.name
          },
          startDate: period.startDate.toISOString(),
          endDate: period.endDate.toISOString(),
          applications: formattedApplications
        })
      }
    }

    return NextResponse.json({
      periods: periodsWithApplications
    })

  } catch (error) {
    console.error('Error fetching archived data:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
