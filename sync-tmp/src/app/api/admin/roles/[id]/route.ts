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

    const roleId = parseInt(params.id)
    if (isNaN(roleId)) {
      return NextResponse.json({ error: "Invalid role ID" }, { status: 400 })
    }

    const { name, description, category_id } = await req.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }
    if (!category_id) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 })
    }

    // Verify category exists
    const categoryExists = await prisma.roleCategory.findUnique({ where: { category_id: parseInt(category_id) } })
    if (!categoryExists) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }

    // Check if another role with the same name exists (excluding current role)
    const existingRole = await prisma.role.findFirst({
      where: {
        name,
        role_id: { not: roleId }
      }
    })

    if (existingRole) {
      return NextResponse.json({ error: "Role name already exists" }, { status: 409 })
    }

    const updatedRole = await prisma.role.update({
      where: { role_id: roleId },
      data: { name: name.trim(), description: description?.trim() || null, category_id: parseInt(category_id) },
      include: { category: true }
    })

    return NextResponse.json(updatedRole)
  } catch (error) {
    console.error("Error updating role:", error)
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const roleId = parseInt(params.id)
    if (isNaN(roleId)) {
      return NextResponse.json({ error: "Invalid role ID" }, { status: 400 })
    }

    // Check if role is in use by any users
    const usersWithRole = await prisma.user.count({
      where: { role_id: roleId }
    })

    if (usersWithRole > 0) {
      return NextResponse.json({ 
        error: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role.` 
      }, { status: 409 })
    }

    // Check if role is referenced in account setup requests
    const setupRequestsWithRole = await prisma.accountSetupRequest.count({
      where: { role_id: roleId }
    })

    if (setupRequestsWithRole > 0) {
      return NextResponse.json({ 
        error: `Cannot delete role. ${setupRequestsWithRole} account setup request(s) reference this role.` 
      }, { status: 409 })
    }

    await prisma.role.delete({
      where: { role_id: roleId }
    })

    return NextResponse.json({ message: "Role deleted successfully" })
  } catch (error) {
    console.error("Error deleting role:", error)
    return NextResponse.json({ error: "Failed to delete role" }, { status: 500 })
  }
}
