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

    // Check if user already exists (approved)
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        users_id: true,
        isActive: true,
        role: {
          select: {
            name: true
          }
        }
      }
    })

    if (existingUser) {
      // If user exists, they are approved (regardless of isActive status)
      // isActive is for account suspension, not approval status
      return NextResponse.json({
        status: "approved",
        user: existingUser
      })
    }

    // Check pending setup requests
    const setupRequest = await prisma.accountSetupRequest.findFirst({
      where: { 
        email,
        status: { in: ["pending", "rejected"] }
      },
      orderBy: {
        created_at: "desc"
      }
    })

    if (!setupRequest) {
      return NextResponse.json({
        status: "not_found"
      })
    }

    return NextResponse.json({
      status: setupRequest.status,
      requestId: setupRequest.id,
      createdAt: setupRequest.created_at
    })

  } catch (error) {
    console.error("Error checking approval status:", error)
    return NextResponse.json(
      { error: "Failed to check approval status" },
      { status: 500 }
    )
  }
}


