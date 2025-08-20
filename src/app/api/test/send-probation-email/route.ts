import { NextResponse } from "next/server"
import { realEmailService } from "@/lib/real-email-service"
import { prisma } from "@/lib/prisma"

// POST /api/test/send-probation-email - Test endpoint to send probation completion email
export async function POST() {
  try {
    const testEmail = "jersoncatadman88@gmail.com"
    
    console.log(`🧪 Testing email send to: ${testEmail}`)
    
    // Find the test user
    const testUser = await prisma.user.findUnique({
      where: { email: testEmail },
      include: {
        status: true,
        probation: true,
        department: true
      }
    })

    if (!testUser) {
      return NextResponse.json(
        { error: "Test user not found", email: testEmail },
        { status: 404 }
      )
    }

    console.log(`✅ Found user: ${testUser.name}`)

    // Send email using real email service
    const emailResult = await realEmailService.sendProbationCompletionEmail(
      testUser.email,
      testUser.name,
      testUser.probation?.endDate || new Date()
    )

    if (emailResult.success) {
      console.log("✅ Email sent successfully!")
      console.log(`Message ID: ${emailResult.messageId}`)

      return NextResponse.json({
        success: true,
        message: "Email sent successfully!",
        recipient: testUser.email,
        userName: testUser.name,
        messageId: emailResult.messageId,
        timestamp: new Date().toISOString()
      }, { status: 200 })
    } else {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("❌ Test email failed:", error)
    return NextResponse.json(
      { 
        error: "Failed to send test email", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
