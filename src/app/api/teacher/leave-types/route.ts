import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get leave types (excluding Travel Order)
    const leaveTypes = await prisma.leave_types.findMany({
      where: {
        name: {
          not: 'Travel Order'
        }
      },
      orderBy: {
        name: 'asc'
      },
      take: 5
    })

    return NextResponse.json({
      leave_types: leaveTypes
    })

  } catch (error) {
    console.error('Error fetching leave types:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
