import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const categoryId = url.searchParams.get('category_id')

    const whereClause = categoryId 
      ? { category_id: parseInt(categoryId) }
      : {}

    const roles = await prisma.role.findMany({
      select: {
        role_id: true,
        name: true,
        description: true,
        category_id: true,
      },
      where: whereClause,
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      roles
    })
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    )
  }
}






