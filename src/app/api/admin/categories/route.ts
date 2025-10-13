import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const categories = await prisma.roleCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { roles: true }
        }
      }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, color } = await req.json()
    
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const category = await prisma.roleCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || "#6b7280"
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    console.error("Error creating category:", error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Category name already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
