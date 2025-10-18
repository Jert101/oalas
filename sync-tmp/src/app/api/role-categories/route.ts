import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.roleCategory.findMany({
      select: {
        category_id: true,
        name: true,
        description: true,
        color: true,
      },
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      categories
    })
  } catch (error) {
    console.error("Error fetching role categories:", error)
    return NextResponse.json(
      { error: "Failed to fetch role categories" },
      { status: 500 }
    )
  }
}





