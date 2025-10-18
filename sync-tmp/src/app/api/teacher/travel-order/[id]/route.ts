import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get a specific travel order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const travelOrder = await prisma.travelOrder.findFirst({
      where: {
        travel_order_id: parseInt(params.id),
        users_id: user.users_id
      }
    })

    if (!travelOrder) {
      return NextResponse.json({ error: "Travel order not found" }, { status: 404 })
    }

    return NextResponse.json(travelOrder)
  } catch (error) {
    console.error('Error fetching travel order:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Update a travel order
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if travel order exists and belongs to user
    const existingTravelOrder = await prisma.travelOrder.findFirst({
      where: {
        travel_order_id: parseInt(params.id),
        users_id: user.users_id
      }
    })

    if (!existingTravelOrder) {
      return NextResponse.json({ error: "Travel order not found" }, { status: 404 })
    }

    // Only allow editing if status is PENDING
    if (existingTravelOrder.status !== 'PENDING') {
      return NextResponse.json({ 
        error: "Cannot edit travel order that is not pending" 
      }, { status: 400 })
    }

    const body = await request.json()
    const { destination, purpose, dateOfTravel, expectedReturn, transportationFee, seminarConferenceFee, mealsAccommodations, totalCashRequested, remarks, supportingDocuments } = body



    // Validate required fields
    if (!destination || !purpose || !dateOfTravel || !expectedReturn) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Update the travel order
    
    const updatedTravelOrder = await prisma.travelOrder.update({
      where: {
        travel_order_id: parseInt(params.id)
      },
      data: {
        destination,
        purpose,
        dateOfTravel: new Date(dateOfTravel),
        expectedReturn: new Date(expectedReturn),
        transportationFee: parseFloat(transportationFee || '0'),
        seminarConferenceFee: parseFloat(seminarConferenceFee || '0'),
        mealsAccommodations: parseFloat(mealsAccommodations || '0'),
        totalCashRequested: parseFloat(totalCashRequested || '0'),
        remarks: remarks || null,
        supportingDocuments: supportingDocuments || null,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedTravelOrder)
  } catch (error) {
    console.error('Error updating travel order:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a travel order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if travel order exists and belongs to user
    const existingTravelOrder = await prisma.travelOrder.findFirst({
      where: {
        travel_order_id: parseInt(params.id),
        users_id: user.users_id
      }
    })

    if (!existingTravelOrder) {
      return NextResponse.json({ error: "Travel order not found" }, { status: 404 })
    }

    // Only allow deletion if status is PENDING
    if (existingTravelOrder.status !== 'PENDING') {
      return NextResponse.json({ 
        error: "Cannot delete travel order that is not pending" 
      }, { status: 400 })
    }

    // Delete the travel order
    await prisma.travelOrder.delete({
      where: {
        travel_order_id: parseInt(params.id)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting travel order:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

