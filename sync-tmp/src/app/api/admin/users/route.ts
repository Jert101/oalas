import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      )
    }

    // Fetch all users with their related data
    const users = await prisma.user.findMany({
      select: {
        users_id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        middleName: true,
        suffix: true,
        profilePicture: true,
        isActive: true,
        createdAt: true,
        role_id: true,
        department_id: true,
        status_id: true,
        role: {
          select: {
            role_id: true,
            name: true
          }
        },
        department: {
          select: {
            department_id: true,
            name: true
          }
        },
        status: {
          select: {
            status_id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      users: users,
      count: users.length
    })

  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}
