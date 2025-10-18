import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, userId, ...data } = body

    if (!type || !userId) {
      return NextResponse.json(
        { error: "Type and userId are required" },
        { status: 400 }
      )
    }

    // Forward the message to the WebSocket server
    const wsServerUrl = process.env.WEBSOCKET_SERVER_URL || 'http://localhost:3001'
    
    const response = await fetch(`${wsServerUrl}/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        userId,
        data
      })
    })

    if (!response.ok) {
      console.error('Failed to forward message to WebSocket server:', response.statusText)
      return NextResponse.json(
        { error: "Failed to send notification" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Notification sent successfully"
    })

  } catch (error) {
    console.error("Error sending WebSocket notification:", error)
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    )
  }
}









