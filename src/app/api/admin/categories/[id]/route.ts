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

    const categoryId = parseInt(params.id)
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 })
    }

    const { name, description, color, isActive } = await req.json()
    
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Check if another category with the same name exists (excluding current category)
    const existingCategory = await prisma.roleCategory.findFirst({
      where: {
        name: name.trim(),
        category_id: { not: categoryId }
      }
    })

    if (existingCategory) {
      return NextResponse.json({ error: "Category name already exists" }, { status: 409 })
    }

    const updatedCategory = await prisma.roleCategory.update({
      where: { category_id: categoryId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || "#6b7280",
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const categoryId = parseInt(params.id)
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 })
    }

    // Check if category is in use by any roles
    const rolesWithCategory = await prisma.role.count({
      where: { category_id: categoryId }
    })

    if (rolesWithCategory > 0) {
      return NextResponse.json({ 
        error: `Cannot delete category. ${rolesWithCategory} role(s) are assigned to this category.` 
      }, { status: 409 })
    }

    await prisma.roleCategory.delete({
      where: { category_id: categoryId }
    })

    return NextResponse.json({ message: "Category deleted successfully" })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}






