import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/probationary-users - Get users with probationary status who don't have probation periods
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get users with probationary status who don't already have a probation record
    const probationaryUsers = await prisma.user.findMany({
      where: {
        status: {
          name: "Probation"  // Users with probationary status
        },
        probation: null  // Who don't have probation periods assigned yet
      },
      select: {
        users_id: true,
        name: true,
        email: true,
        profilePicture: true,
        department: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(probationaryUsers, { status: 200 })
  } catch (error) {
    console.error("Error fetching probationary users:", error)
    return NextResponse.json(
      { error: "Failed to fetch probationary users" },
      { status: 500 }
    )
  }
}
