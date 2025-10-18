import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/calendar-period/current - Get current calendar period
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentPeriod = await prisma.calendarPeriod.findFirst({
      where: { 
        isCurrent: true,
        isActive: true 
      },
      include: {
        termType: true
      }
    })

    if (!currentPeriod) {
      return NextResponse.json({ 
        error: "No current calendar period set" 
      }, { status: 404 })
    }

    return NextResponse.json(currentPeriod, { status: 200 })
  } catch (error) {
    console.error("Error fetching current calendar period:", error)
    return NextResponse.json(
      { error: "Failed to fetch current calendar period" },
      { status: 500 }
    )
  }
}
