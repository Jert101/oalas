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

    // Get the most recent application (leave or travel) for this dean
    const [latestLeave, latestTravel] = await Promise.all([
      prisma.leaveApplication.findFirst({
        where: {
          users_id: user.users_id,
          status: {
            in: ['PENDING', 'DEAN_APPROVED', 'APPROVED', 'DENIED', 'DEAN_REJECTED']
          }
        },
        orderBy: {
          appliedAt: 'desc'
        },
        include: {
          leaveType: {
            select: {
              name: true
            }
          }
        }
      }),
      prisma.travelOrder.findFirst({
        where: {
          users_id: user.users_id,
          status: {
            in: ['PENDING', 'DEAN_APPROVED', 'APPROVED', 'DENIED', 'DEAN_REJECTED']
          }
        },
        orderBy: {
          appliedAt: 'desc'
        }
      })
    ])

    // Determine which application is more recent
    let currentApplication = null
    let applicationType = null

    if (latestLeave && latestTravel) {
      if (new Date(latestLeave.appliedAt) > new Date(latestTravel.appliedAt)) {
        currentApplication = latestLeave
        applicationType = 'leave'
      } else {
        currentApplication = latestTravel
        applicationType = 'travel'
      }
    } else if (latestLeave) {
      currentApplication = latestLeave
      applicationType = 'leave'
    } else if (latestTravel) {
      currentApplication = latestTravel
      applicationType = 'travel'
    }

    if (!currentApplication) {
      return NextResponse.json({
        success: true,
        application: null
      })
    }

    // Transform the application data to match the expected format
    const transformedApplication = {
      id: `${applicationType}_${currentApplication[applicationType === 'leave' ? 'leave_application_id' : 'travel_order_id']}`,
      type: applicationType,
      status: currentApplication.status,
      appliedAt: currentApplication.appliedAt,
      startDate: currentApplication.startDate,
      endDate: currentApplication.endDate,
      numberOfDays: currentApplication.numberOfDays,
      hours: currentApplication.hours,
      leaveType: currentApplication.leaveType?.name,
      reason: currentApplication.reason,
      specificPurpose: currentApplication.specificPurpose,
      descriptionOfSickness: currentApplication.descriptionOfSickness,
      paymentStatus: currentApplication.paymentStatus,
      medicalProof: currentApplication.medicalProof,
      // Travel order specific fields
      destination: currentApplication.destination,
      transportationFee: currentApplication.transportationFee,
      seminarConferenceFee: currentApplication.seminarConferenceFee,
      mealsAccommodations: currentApplication.mealsAccommodations,
      totalCashRequested: currentApplication.totalCashRequested,
      supportingDocuments: currentApplication.supportingDocuments,
      remarks: currentApplication.remarks,
      // Approval fields
      deanReviewedAt: currentApplication.deanReviewedAt,
      deanReviewedBy: currentApplication.deanReviewedBy,
      deanComments: currentApplication.deanComments,
      deanRejectionReason: currentApplication.deanRejectionReason,
      reviewedAt: currentApplication.reviewedAt,
      reviewer: currentApplication.reviewer,
      comments: currentApplication.comments
    }

    return NextResponse.json({
      success: true,
      application: transformedApplication
    })

  } catch (error) {
    console.error('Error fetching current application:', error)
    return NextResponse.json(
      { error: "Failed to fetch current application" },
      { status: 500 }
    )
  }
}



