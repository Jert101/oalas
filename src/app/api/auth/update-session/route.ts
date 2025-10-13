import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "No active session" }, { status: 401 })
    }

    // Force session refresh by returning current session data
    return NextResponse.json({ 
      success: true, 
      session: {
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: (session.user as any).role,
          profilePicture: (session.user as any).profilePicture,
          userId: (session.user as any).userId,
          isEmailVerified: (session.user as any).isEmailVerified,
        }
      }
    })
  } catch (error) {
    console.error("Error updating session:", error)
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
  }
}







