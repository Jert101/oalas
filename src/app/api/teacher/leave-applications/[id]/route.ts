import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params
    const applicationId = resolvedParams.id
    
    // Parse the application ID (format: leave_123 or travel_123)
    let actualId: number
    let type: 'leave' | 'travel'
    
    if (applicationId.includes('_')) {
      const parts = applicationId.split('_')
      type = parts[0] as 'leave' | 'travel'
      actualId = parseInt(parts[1])
    } else {
      // Default to leave application for backward compatibility
      type = 'leave'
      actualId = parseInt(applicationId)
    }
    
    if (isNaN(actualId)) {
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 })
    }

    const body = await request.json()
    const {
      startDate,
      endDate,
      reason,
      numberOfDays,
      hours,
      specificPurpose,
      descriptionOfSickness,
      paymentStatus,
      medicalProof
    } = body

    // Validate required fields
    if (!startDate || !endDate || !reason || !numberOfDays || !hours) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (type === 'leave') {
      // Update leave application
      const existingApplication = await prisma.leaveApplication.findFirst({
        where: {
          leave_application_id: actualId,
          users_id: user.users_id // Ensure user can only update their own applications
        }
      })

      if (!existingApplication) {
        return NextResponse.json({ error: "Application not found" }, { status: 404 })
      }

      // Check if application can be updated (only PENDING applications can be updated)
      if (existingApplication.status !== 'PENDING') {
        return NextResponse.json({ 
          error: "Only pending applications can be updated" 
        }, { status: 400 })
      }

      // Update the leave application
      const updatedApplication = await prisma.leaveApplication.update({
        where: {
          leave_application_id: actualId
        },
        data: {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          reason: reason,
          numberOfDays: numberOfDays,
          hours: hours,
          specificPurpose: specificPurpose || null,
          descriptionOfSickness: descriptionOfSickness || null,
          paymentStatus: paymentStatus || 'PAID',
          medicalProof: medicalProof || null,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: "Leave application updated successfully",
        application: updatedApplication
      })

    } else if (type === 'travel') {
      // Update travel order
      const existingTravelOrder = await prisma.travelOrder.findFirst({
        where: {
          travel_order_id: actualId,
          users_id: user.users_id // Ensure user can only update their own travel orders
        }
      })

      if (!existingTravelOrder) {
        return NextResponse.json({ error: "Travel order not found" }, { status: 404 })
      }

      // Check if travel order can be updated (only PENDING travel orders can be updated)
      if (existingTravelOrder.status !== 'PENDING') {
        return NextResponse.json({ 
          error: "Only pending travel orders can be updated" 
        }, { status: 400 })
      }

      // Update the travel order
      const updatedTravelOrder = await prisma.travelOrder.update({
        where: {
          travel_order_id: actualId
        },
        data: {
          destination: body.destination,
          purpose: body.purpose,
          transportationFee: parseFloat(body.transportationFee) || 0,
          seminarConferenceFee: parseFloat(body.seminarConferenceFee) || 0,
          mealsAccommodations: parseFloat(body.mealsAccommodations) || 0,
          totalCashRequested: parseFloat(body.totalCashRequested) || 0,
          supportingDocuments: body.supportingDocuments || null,
          remarks: body.remarks || null,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: "Travel order updated successfully",
        travelOrder: updatedTravelOrder
      })
    }

    return NextResponse.json({ error: "Invalid application type" }, { status: 400 })

  } catch (error) {
    console.error('Error updating application:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params
    const applicationId = resolvedParams.id
    
    // Parse the application ID (format: leave_123 or travel_123)
    let actualId: number
    let type: 'leave' | 'travel'
    
    if (applicationId.includes('_')) {
      const parts = applicationId.split('_')
      type = parts[0] as 'leave' | 'travel'
      actualId = parseInt(parts[1])
    } else {
      // Default to leave application for backward compatibility
      type = 'leave'
      actualId = parseInt(applicationId)
    }
    
    if (isNaN(actualId)) {
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 })
    }

    if (type === 'leave') {
      // Delete leave application
      const existingApplication = await prisma.leaveApplication.findFirst({
        where: {
          leave_application_id: actualId,
          users_id: user.users_id // Ensure user can only delete their own applications
        }
      })

      if (!existingApplication) {
        return NextResponse.json({ error: "Application not found" }, { status: 404 })
      }

      // Check if application can be deleted (only PENDING applications can be deleted)
      if (existingApplication.status !== 'PENDING') {
        return NextResponse.json({ 
          error: "Only pending applications can be deleted" 
        }, { status: 400 })
      }

      // Delete the leave application
      await prisma.leaveApplication.delete({
        where: {
          leave_application_id: actualId
        }
      })

      return NextResponse.json({
        success: true,
        message: "Leave application deleted successfully"
      })

    } else if (type === 'travel') {
      // Delete travel order
      const existingTravelOrder = await prisma.travelOrder.findFirst({
        where: {
          travel_order_id: actualId,
          users_id: user.users_id // Ensure user can only delete their own travel orders
        }
      })

      if (!existingTravelOrder) {
        return NextResponse.json({ error: "Travel order not found" }, { status: 404 })
      }

      // Check if travel order can be deleted (only PENDING travel orders can be deleted)
      if (existingTravelOrder.status !== 'PENDING') {
        return NextResponse.json({ 
          error: "Only pending travel orders can be deleted" 
        }, { status: 400 })
      }

      // Delete the travel order
      await prisma.travelOrder.delete({
        where: {
          travel_order_id: actualId
        }
      })

      return NextResponse.json({
        success: true,
        message: "Travel order deleted successfully"
      })
    }

    return NextResponse.json({ error: "Invalid application type" }, { status: 400 })

  } catch (error) {
    console.error('Error deleting application:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
