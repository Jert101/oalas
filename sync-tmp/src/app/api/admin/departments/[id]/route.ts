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
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 })
    }

    const { name, description } = await req.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { department_id: id }
    })

    if (!existingDepartment) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    // Check if name already exists (but not for the current department)
    const nameExists = await prisma.department.findFirst({
      where: { 
        name: name.trim(),
        NOT: { department_id: id }
      }
    })

    if (nameExists) {
      return NextResponse.json({ error: "Department name already exists" }, { status: 409 })
    }

    const updated = await prisma.department.update({
      where: { department_id: id },
      data: { 
        name: name.trim(), 
        description: description?.trim() || null 
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating department:", error)
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
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 })
    }

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { department_id: id },
      include: { _count: { select: { users: true } } }
    })

    if (!existingDepartment) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    // Check if department has users
    if (existingDepartment._count.users > 0) {
      return NextResponse.json({ 
        error: `Cannot delete department. It has ${existingDepartment._count.users} user(s) assigned to it.` 
      }, { status: 409 })
    }

    await prisma.department.delete({
      where: { department_id: id }
    })

    return NextResponse.json({ message: "Department deleted successfully" })
  } catch (error) {
    console.error("Error deleting department:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}





