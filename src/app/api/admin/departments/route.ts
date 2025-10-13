import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "Admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const items = await prisma.department.findMany({ orderBy: { name: "asc" } })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "Admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name, description } = await req.json()
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 })
  const created = await prisma.department.upsert({ 
    where: { name }, 
    update: { description }, 
    create: { name, description, category: 'ACADEMIC_DEPARTMENT' } // Default to academic department
  })
  return NextResponse.json(created, { status: 201 })
}

