import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch fresh profile picture from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { profilePicture: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      profilePicture: user.profilePicture 
    })

  } catch (error) {
    console.error("Error refreshing avatar:", error)
    return NextResponse.json(
      { error: "Failed to refresh avatar" },
      { status: 500 }
    )
  }
}





