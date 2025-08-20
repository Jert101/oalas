import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      destination,
      startDate,
      endDate,
      transportationFee,
      seminarConferenceFee,
      mealsAccommodations,
      totalCashRequested,
      remarks,
      supportingDocuments,
      status,
      deanReviewedAt,
      deanReviewedBy,
      deanComments
    } = body

    // Validate required fields
    if (!destination || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create the travel order with automatic dean approval
    const travelOrder = await prisma.travelOrder.create({
      data: {
        users_id: user.users_id,
        destination: destination,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        transportationFee: transportationFee || 0,
        seminarConferenceFee: seminarConferenceFee || 0,
        mealsAccommodations: mealsAccommodations || 0,
        totalCashRequested: totalCashRequested || 0,
        remarks: remarks || null,
        supportingDocuments: supportingDocuments || null,
        status: 'DEAN_APPROVED', // Automatically approved by dean
        appliedAt: new Date(),
        deanReviewedAt: new Date(),
        deanReviewedBy: user.users_id,
        deanComments: 'Automatically approved by Dean'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            users_id: true,
            department: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: "Travel order submitted and automatically approved",
      data: {
        application: travelOrder
      }
    })

  } catch (error) {
    console.error('Error creating travel order:', error)
    return NextResponse.json(
      { error: "Failed to create travel order" },
      { status: 500 }
    )
  }
}



