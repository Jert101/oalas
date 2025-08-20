import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      },
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
        role: {
          select: {
            name: true
          }
        },
        department: {
          select: {
            name: true
          }
        },
        status: {
          select: {
            name: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user
    })

  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, firstName, middleName, lastName, suffix, email } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      )
    }

    // Check if email is being changed and if it already exists
    if (email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        )
      }
    }

    const updatedUser = await prisma.user.update({
      where: {
        email: session.user.email
      },
      data: {
        name,
        firstName: firstName || null,
        middleName: middleName || null,
        lastName: lastName || null,
        suffix: suffix || null,
        email
      },
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
        role: {
          select: {
            name: true
          }
        },
        department: {
          select: {
            name: true
          }
        },
        status: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully"
    })

  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    )
  }
}
