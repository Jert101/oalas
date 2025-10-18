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

    const roleCategories = await prisma.roleCategory.findMany({ 
      orderBy: { name: "asc" }
    })

    return NextResponse.json({ roleCategories })
  } catch (error) {
    console.error("Error fetching role categories:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description } = await req.json()
    if (!name) {
      return NextResponse.json({ error: "Name required" }, { status: 400 })
    }

    const created = await prisma.roleCategory.create({ 
      data: { name, description }
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("Error creating role category:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
