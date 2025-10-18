import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "Admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const items = await prisma.role.findMany({ 
    orderBy: { name: "asc" },
    include: {
      category: true
    }
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "Admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name, description, category_id } = await req.json()
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 })
  if (!category_id) return NextResponse.json({ error: "Category required" }, { status: 400 })
  
  // Verify category exists
  const categoryExists = await prisma.roleCategory.findUnique({ where: { category_id: parseInt(category_id) } })
  if (!categoryExists) return NextResponse.json({ error: "Invalid category" }, { status: 400 })
  
  const created = await prisma.role.upsert({ 
    where: { name }, 
    update: { description, category_id: parseInt(category_id) }, 
    create: { name, description, category_id: parseInt(category_id) },
    include: { category: true }
  })
  return NextResponse.json(created, { status: 201 })
}

