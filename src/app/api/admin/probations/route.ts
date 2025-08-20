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

    if (user.status?.name !== "Probation") {
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
