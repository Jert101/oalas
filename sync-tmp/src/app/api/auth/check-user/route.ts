import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      )
    }

    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        users_id: true,
        email: true,
        name: true,
        isActive: true,
        isEmailVerified: true,
        role: {
          select: {
            name: true
          }
        }
      }
    })

    if (user) {
      return NextResponse.json({
        exists: true,
        user: user
      })
    } else {
      return NextResponse.json({
        exists: false,
        user: null
      })
    }

  } catch (error) {
    console.error("Error checking user:", error)
    return NextResponse.json(
      { error: "Failed to check user" },
      { status: 500 }
    )
  }
}









