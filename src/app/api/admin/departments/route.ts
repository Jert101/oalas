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
  const { name, description, category } = await req.json()
  if (!name || !category) return NextResponse.json({ error: "Name and category required" }, { status: 400 })
  const created = await prisma.department.upsert({ where: { name }, update: { description, category }, create: { name, description, category } })
  return NextResponse.json(created, { status: 201 })
}

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const departments = await prisma.department.findMany({
      select: {
        department_id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      departments
    })

  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
