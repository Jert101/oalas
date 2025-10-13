import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const statuses = await prisma.status.findMany({
      select: {
        status_id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      statuses
    })
  } catch (error) {
    console.error("Error fetching statuses:", error)
    return NextResponse.json(
      { error: "Failed to fetch statuses" },
      { status: 500 }
    )
  }
}





