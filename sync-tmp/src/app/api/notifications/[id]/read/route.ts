import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const notificationId = parseInt(resolvedParams.id)

    if (isNaN(notificationId)) {
      return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update notification as read
    const notification = await prisma.notification.update({
      where: {
        notification_id: notificationId,
        userId: user.users_id // Ensure user owns this notification
      },
      data: {
        isRead: true
      }
    })

    return NextResponse.json({
      success: true,
      message: "Notification marked as read"
    })

  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
