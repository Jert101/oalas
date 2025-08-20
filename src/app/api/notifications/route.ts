import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's notifications (last 50)
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.users_id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    return NextResponse.json({
      success: true,
      notifications: notifications.map(notification => ({
        id: notification.notification_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        timestamp: notification.createdAt,
        isRead: notification.isRead,
        link: notification.link
      }))
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, message, type = 'info', userId, link } = body

    if (!title || !message || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        userId,
        link,
        isRead: false
      }
    })

    // TODO: Send WebSocket notification to the user
    // This would be handled by a WebSocket server

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.notification_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        timestamp: notification.createdAt,
        isRead: notification.isRead,
        link: notification.link
      }
    })

  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
