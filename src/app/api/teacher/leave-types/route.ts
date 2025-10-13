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

    // Get all leave types from the database
    const leaveTypes = await prisma.leave_types.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    console.log('[teacher/leave-types] Count:', leaveTypes.length, 'Time:', new Date().toISOString())

    return NextResponse.json(
      { leave_types: leaveTypes },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    )

  } catch (error) {
    console.error('Error fetching leave types:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
