import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { RealEmailService } from "@/lib/real-email-service"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentDate = new Date()
    
    // Find all active probations that have ended
    const expiredProbations = await prisma.probation.findMany({
      where: {
        status: "ACTIVE",
        endDate: {
          lte: currentDate
        }
      },
      include: {
        user: {
          select: {
            users_id: true,
            name: true,
            email: true,
            status_id: true
          }
        }
      }
    })

    if (expiredProbations.length === 0) {
      return NextResponse.json(
        { message: "No expired probations found", updatedCount: 0 },
        { status: 200 }
      )
    }

    // Get the "Regular" status ID
    const regularStatus = await prisma.status.findFirst({
      where: { name: "Regular" }
    })

    if (!regularStatus) {
      return NextResponse.json(
        { error: "Regular status not found in database" },
        { status: 500 }
      )
    }

    const updatedUsers = []

    // Process each expired probation
    for (const probation of expiredProbations) {
      try {
        // Update probation status to COMPLETED
        await prisma.probation.update({
          where: { probation_id: probation.probation_id },
          data: {
            status: "COMPLETED",
            completionDate: currentDate,
            isEmailSent: true
          }
        })

        // Update user status to Regular
        await prisma.user.update({
          where: { users_id: probation.users_id },
          data: {
            status_id: regularStatus.status_id
          }
        })

        // Send email notification using real email service
        const emailService = RealEmailService.getInstance()
        const emailResult = await emailService.sendProbationCompletionEmail(
          probation.user.email,
          probation.user.name,
          probation.endDate
        )

        if (!emailResult.success) {
          console.error(`Failed to send email to ${probation.user.email}`)
        } else {
          console.log(`✅ Email sent to ${probation.user.email}`)
          console.log(`📧 Message ID: ${emailResult.messageId}`)
        }

        updatedUsers.push({
          users_id: probation.users_id,
          name: probation.user.name,
          email: probation.user.email,
          emailSent: emailResult.success,
          messageId: emailResult.messageId
        })

      } catch (error) {
        console.error(`Error updating probation for user ${probation.users_id}:`, error)
      }
    }

    return NextResponse.json({
      message: `Successfully processed ${updatedUsers.length} expired probations`,
      updatedCount: updatedUsers.length,
      updatedUsers,
      emailsSent: updatedUsers.filter(u => u.emailSent).length
    }, { status: 200 })

  } catch (error) {
    console.error("Error checking expired probations:", error)
    return NextResponse.json(
      { error: "Failed to check expired probations" },
      { status: 500 }
    )
  }
}
