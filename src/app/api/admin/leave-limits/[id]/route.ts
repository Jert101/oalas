import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT /api/admin/leave-limits/[id] - Update leave limit
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const leaveLimitId = parseInt(id)
    
    if (isNaN(leaveLimitId)) {
      return NextResponse.json(
        { error: "Invalid leave limit ID" },
        { status: 400 }
      )
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

    // Check if leave limit exists
    const existingLimit = await prisma.leaveLimit.findUnique({
      where: { leave_limit_id: leaveLimitId }
    })

    if (!existingLimit) {
      return NextResponse.json(
        { error: "Leave limit not found" },
        { status: 404 }
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

    // Check for duplicate combination (excluding current record)
    const duplicateLimit = await prisma.leaveLimit.findFirst({
      where: {
        status_id: parseInt(status_id),
        term_type_id: parseInt(term_type_id),
        leave_type_id: parseInt(leave_type_id),
        leave_limit_id: { not: leaveLimitId }
      }
    })

    if (duplicateLimit) {
      return NextResponse.json(
        { error: "Leave limit already exists for this combination" },
        { status: 400 }
      )
    }

    // Update the leave limit
    const updatedLeaveLimit = await prisma.leaveLimit.update({
      where: { leave_limit_id: leaveLimitId },
      data: {
        status_id: parseInt(status_id),
        term_type_id: parseInt(term_type_id),
        leave_type_id: parseInt(leave_type_id),
        daysAllowed: parseInt(daysAllowed)
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

    return NextResponse.json(updatedLeaveLimit, { status: 200 })
  } catch (error) {
    console.error("Error updating leave limit:", error)
    return NextResponse.json(
      { error: "Failed to update leave limit" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/leave-limits/[id] - Delete leave limit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const leaveLimitId = parseInt(id)
    
    if (isNaN(leaveLimitId)) {
      return NextResponse.json(
        { error: "Invalid leave limit ID" },
        { status: 400 }
      )
    }

    // Check if leave limit exists
    const existingLimit = await prisma.leaveLimit.findUnique({
      where: { leave_limit_id: leaveLimitId }
    })

    if (!existingLimit) {
      return NextResponse.json(
        { error: "Leave limit not found" },
        { status: 404 }
      )
    }

    // Delete the leave limit
    await prisma.leaveLimit.delete({
      where: { leave_limit_id: leaveLimitId }
    })

    return NextResponse.json(
      { message: "Leave limit deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting leave limit:", error)
    return NextResponse.json(
      { error: "Failed to delete leave limit" },
      { status: 500 }
    )
  }
}
