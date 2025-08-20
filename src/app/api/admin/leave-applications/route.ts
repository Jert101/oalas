import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/leave-applications - Get leave applications for a specific period
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get("periodId")

    if (!periodId) {
      return NextResponse.json(
        { error: "Period ID is required" },
        { status: 400 }
      )
    }

    const leaveApplications = await prisma.leaveApplication.findMany({
      where: {
        calendar_period_id: parseInt(periodId)
      },
      include: {
        user: {
          select: {
            users_id: true,
            name: true,
            email: true,
            department: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        appliedAt: 'desc'
      }
    })

    return NextResponse.json(leaveApplications, { status: 200 })
  } catch (error) {
    console.error("Error fetching leave applications:", error)
    return NextResponse.json(
      { error: "Failed to fetch leave applications" },
      { status: 500 }
    )
  }
}
