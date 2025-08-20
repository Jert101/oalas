import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/leave-limits - Get all leave limits
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const leaveLimits = await prisma.leaveLimit.findMany({
      include: {
        status: {
          select: {
            status_id: true,
            name: true
          }
        },
        leaveType: {
          select: {
            leave_type_id: true,
            name: true
          }
        },
        termType: {
          select: {
            term_type_id: true,
            name: true
          }
        }
      },
      orderBy: [
        { status_id: 'asc' },
        { term_type_id: 'asc' },
        { leave_type_id: 'asc' }
      ]
    })

    return NextResponse.json(leaveLimits, { status: 200 })
  } catch (error) {
    console.error("Error fetching leave limits:", error)
    return NextResponse.json(
      { error: "Failed to fetch leave limits" },
      { status: 500 }
    )
  }
}

// POST /api/admin/leave-limits - Create new leave limit
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status_id, term_type_id, leave_type_id, daysAllowed } = body

    // Validate required fields
    if (!status_id || !term_type_id || !leave_type_id || daysAllowed === undefined || daysAllowed === null) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate days allowed
    if (daysAllowed < 0) {
      return NextResponse.json(
        { error: "Days allowed must be at least 0" },
        { status: 400 }
      )
    }

    // Check if status exists
    const status = await prisma.status.findUnique({
      where: { status_id: parseInt(status_id) }
    })

    if (!status) {
      return NextResponse.json(
        { error: "Status not found" },
        { status: 404 }
      )
    }

    // Check if term type exists
    const termType = await prisma.termType.findUnique({
      where: { term_type_id: parseInt(term_type_id) }
    })

    if (!termType) {
      return NextResponse.json(
        { error: "Term type not found" },
        { status: 404 }
      )
    }

    // Check if leave type exists
    const leaveType = await prisma.leave_types.findUnique({
      where: { leave_type_id: parseInt(leave_type_id) }
    })

    if (!leaveType) {
      return NextResponse.json(
        { error: "Leave type not found" },
        { status: 404 }
      )
    }

    // Check for duplicate combination
    const existingLimit = await prisma.leaveLimit.findFirst({
      where: {
        status_id: parseInt(status_id),
        term_type_id: parseInt(term_type_id),
        leave_type_id: parseInt(leave_type_id)
      }
    })

    if (existingLimit) {
      return NextResponse.json(
        { error: "Leave limit already exists for this combination" },
        { status: 400 }
      )
    }

    // Create the leave limit
    const leaveLimit = await prisma.leaveLimit.create({
      data: {
        status_id: parseInt(status_id),
        term_type_id: parseInt(term_type_id),
        leave_type_id: parseInt(leave_type_id),
        daysAllowed: parseInt(daysAllowed),
        isActive: true
      },
      include: {
        status: {
          select: {
            status_id: true,
            name: true
          }
        },
        leaveType: {
          select: {
            leave_type_id: true,
            name: true
          }
        },
        termType: {
          select: {
            term_type_id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(leaveLimit, { status: 201 })
  } catch (error) {
    console.error("Error creating leave limit:", error)
    return NextResponse.json(
      { error: "Failed to create leave limit" },
      { status: 500 }
    )
  }
}
