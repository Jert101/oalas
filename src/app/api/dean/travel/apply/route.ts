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

    // Verify user is a Dean/Program Head or has department head privileges
    const allowedRoles = ["Dean/Program Head", "Department Head"]
    const isAllowed = user.role?.name && allowedRoles.includes(user.role.name)
    const isDepartmentHead = user.isDepartmentHead === true
    
    console.log('🔍 Dean Travel Apply API - User verification:', {
      role: user.role?.name,
      isDepartmentHead: isDepartmentHead,
      isAllowed: isAllowed
    })
    
    if (!isAllowed && !isDepartmentHead) {
      console.log('❌ Access denied - User role:', user.role?.name, 'Expected: Dean/Program Head or Department Head')
      return NextResponse.json({ error: "Access denied. Dean/Program Head or Department Head role required." }, { status: 403 })
    }

    const body = await request.json()
    const {
      destination,
      dateOfTravel,
      expectedReturn,
      purpose,
      supportingDocuments
    } = body

    // Validate required fields
    if (!destination || !dateOfTravel || !expectedReturn || !purpose) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create the travel order with automatic dean approval
    const travelOrder = await prisma.travelOrder.create({
      data: {
        users_id: user.users_id,
        destination: destination,
        startDate: new Date(dateOfTravel),
        endDate: new Date(expectedReturn),
        transportationFee: 0,
        seminarConferenceFee: 0,
        mealsAccommodations: 0,
        totalCashRequested: 0,
        remarks: purpose,
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

















