import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/probations - Get all probation records
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const probations = await prisma.probation.findMany({
      include: {
        user: {
          select: {
            users_id: true,
            name: true,
            email: true,
            profilePicture: true,
            department: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(probations, { status: 200 })
  } catch (error) {
    console.error("Error fetching probations:", error)
    return NextResponse.json(
      { error: "Failed to fetch probations" },
      { status: 500 }
    )
  }
}

// POST /api/admin/probations - Create new probation record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { users_id, startDate, endDate, probationDays, status } = body

    // Validate required fields
    if (!users_id || !startDate || !endDate || !probationDays) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start >= end) {
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      )
    }

    // Check if user exists and has probationary status
    const user = await prisma.user.findUnique({
      where: { users_id },
      include: {
        status: true,
        probation: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    if (user.status?.name !== "Under Probation") {
      return NextResponse.json(
        { error: "User must have probationary status" },
        { status: 400 }
      )
    }

    if (user.probation) {
      return NextResponse.json(
        { error: "User already has a probation period assigned" },
        { status: 400 }
      )
    }

    // Create the probation record
    const probation = await prisma.probation.create({
      data: {
        users_id,
        startDate: start,
        endDate: end,
        probationDays: parseInt(probationDays),
        status: status || "ACTIVE",
        isEmailSent: false
      },
      include: {
        user: {
          select: {
            users_id: true,
            name: true,
            email: true,
            department: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(probation, { status: 201 })
  } catch (error) {
    console.error("Error creating probation:", error)
    return NextResponse.json(
      { error: "Failed to create probation" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/probations - Update probation record
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { probation_id, startDate, endDate, probationDays, status } = body

    // Validate required fields
    if (!probation_id || !startDate || !endDate || !probationDays) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start >= end) {
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      )
    }

    // Check if probation record exists
    const existingProbation = await prisma.probation.findUnique({
      where: { probation_id: parseInt(probation_id) }
    })

    if (!existingProbation) {
      return NextResponse.json(
        { error: "Probation record not found" },
        { status: 404 }
      )
    }

    // Update the probation record
    const updatedProbation = await prisma.probation.update({
      where: { probation_id: parseInt(probation_id) },
      data: {
        startDate: start,
        endDate: end,
        probationDays: parseInt(probationDays),
        status: status || "ACTIVE"
      },
      include: {
        user: {
          select: {
            users_id: true,
            name: true,
            email: true,
            department: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedProbation, { status: 200 })
  } catch (error) {
    console.error("Error updating probation:", error)
    return NextResponse.json(
      { error: "Failed to update probation" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/probations - Delete probation record
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const probation_id = searchParams.get('probation_id')

    if (!probation_id) {
      return NextResponse.json(
        { error: "Probation ID is required" },
        { status: 400 }
      )
    }

    // Check if probation record exists
    const existingProbation = await prisma.probation.findUnique({
      where: { probation_id: parseInt(probation_id) }
    })

    if (!existingProbation) {
      return NextResponse.json(
        { error: "Probation record not found" },
        { status: 404 }
      )
    }

    // Delete the probation record
    await prisma.probation.delete({
      where: { probation_id: parseInt(probation_id) }
    })

    return NextResponse.json(
      { message: "Probation record deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting probation:", error)
    return NextResponse.json(
      { error: "Failed to delete probation" },
      { status: 500 }
    )
  }
}
