import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid leave type ID" }, { status: 400 })
    }

    const { name, description } = await req.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Check if leave type exists
    const existingLeaveType = await prisma.leave_types.findUnique({
      where: { leave_type_id: id }
    })

    if (!existingLeaveType) {
      return NextResponse.json({ error: "Leave type not found" }, { status: 404 })
    }

    // Check if name already exists (but not for the current leave type)
    const nameExists = await prisma.leave_types.findFirst({
      where: { 
        name: name.trim(),
        NOT: { leave_type_id: id }
      }
    })

    if (nameExists) {
      return NextResponse.json({ error: "Leave type name already exists" }, { status: 409 })
    }

    const updated = await prisma.leave_types.update({
      where: { leave_type_id: id },
      data: { 
        name: name.trim(), 
        description: description?.trim() || null 
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating leave type:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid leave type ID" }, { status: 400 })
    }

    // Check if leave type exists
    const existingLeaveType = await prisma.leave_types.findUnique({
      where: { leave_type_id: id },
      include: { 
        _count: { 
          select: { 
            leaveApplications: true,
            leaveLimits: true 
          } 
        } 
      }
    })

    if (!existingLeaveType) {
      return NextResponse.json({ error: "Leave type not found" }, { status: 404 })
    }

    // Check if leave type is being used
    const totalUsage = existingLeaveType._count.leaveApplications + existingLeaveType._count.leaveLimits
    if (totalUsage > 0) {
      return NextResponse.json({ 
        error: `Cannot delete leave type. It is being used in ${existingLeaveType._count.leaveApplications} leave application(s) and ${existingLeaveType._count.leaveLimits} leave limit(s).` 
      }, { status: 409 })
    }

    await prisma.leave_types.delete({
      where: { leave_type_id: id }
    })

    return NextResponse.json({ message: "Leave type deleted successfully" })
  } catch (error) {
    console.error("Error deleting leave type:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}





