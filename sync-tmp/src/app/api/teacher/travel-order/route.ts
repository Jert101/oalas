import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { validateNewApplication } from "@/lib/validation-service"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      destination,
      purpose,
      dateOfTravel,
      expectedReturn,
      transportationFee,
      seminarConferenceFee,
      mealsAccommodations,
      totalCashRequested,
      remarks,
      supportingDocuments
    } = body

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

    // Validate required fields
    if (!destination || !purpose || !dateOfTravel || !expectedReturn) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate application (check for pending applications and date conflicts)
    const validation = await validateNewApplication(user.users_id, new Date(dateOfTravel), new Date(expectedReturn))
    if (!validation.canApply) {
      return NextResponse.json({ 
        error: validation.reason,
        validationDetails: validation
      }, { status: 400 })
    }

    // Create travel order
    const travelOrder = await prisma.travelOrder.create({
      data: {
        users_id: user.users_id,
        calendar_period_id: currentPeriod.calendar_period_id,
        destination: destination,
        purpose: purpose,
        dateOfTravel: new Date(dateOfTravel),
        expectedReturn: new Date(expectedReturn),
        transportationFee: transportationFee || 0,
        seminarConferenceFee: seminarConferenceFee || 0,
        mealsAccommodations: mealsAccommodations || 0,
        totalCashRequested: totalCashRequested || 0,
        remarks: remarks || null,
        status: 'PENDING',
        appliedAt: new Date()
      }
    })

    return NextResponse.json({
      message: "Travel order submitted successfully",
      orderId: travelOrder.travel_order_id
    })

  } catch (error) {
    console.error('Error submitting travel order:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
