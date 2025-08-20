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
      leaveTypeId,
      startDate,
      endDate,
      numberOfDays,
      hours,
      reason,
      specificPurpose,
      descriptionOfSickness,
      paymentStatus,
      medicalProof,
      status,
      deanReviewedAt,
      deanReviewedBy,
      deanComments
    } = body

    // Validate required fields
    if (!leaveTypeId || !startDate || !endDate || !numberOfDays) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create the leave application with automatic dean approval
    const leaveApplication = await prisma.leaveApplication.create({
      data: {
        users_id: user.users_id,
        leave_type_id: leaveTypeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        numberOfDays: numberOfDays,
        hours: hours || 0,
        reason: reason || null,
        specificPurpose: specificPurpose || null,
        descriptionOfSickness: descriptionOfSickness || null,
        paymentStatus: paymentStatus || 'UNPAID',
        medicalProof: medicalProof || null,
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
        },
        leaveType: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: "Leave application submitted and automatically approved",
      data: {
        application: leaveApplication
      }
    })

  } catch (error) {
    console.error('Error creating leave application:', error)
    return NextResponse.json(
      { error: "Failed to create leave application" },
      { status: 500 }
    )
  }
}



