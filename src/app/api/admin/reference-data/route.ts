import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch all reference data
    const [roles, departments, statuses] = await Promise.all([
      prisma.role.findMany({
        orderBy: { name: 'asc' }
      }),
      prisma.department.findMany({
        orderBy: { name: 'asc' }
      }),
      prisma.status.findMany({
        orderBy: { name: 'asc' }
      })
    ])

    return NextResponse.json({
      roles,
      departments,
      statuses
    })

  } catch (error) {
    console.error("Error fetching reference data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
