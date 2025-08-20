// Real email test for probation completion using Gmail service
// This will send an actual email to jersoncatadman88@gmail.com

import { PrismaClient } from '@prisma/client'
import { gmailService } from './src/lib/gmail-service.js'

const prisma = new PrismaClient()

async function realEmailProbationTest() {
  console.log("📧 REAL EMAIL PROBATION TEST")
  console.log("=" * 50)
  console.log(`🎯 Target Email: jersoncatadman88@gmail.com`)
  console.log(`📅 Test Date: ${new Date().toLocaleString()}`)
  console.log(`🔧 Using: Nodemailer with Ethereal Email (test service)`)
  console.log("")

  try {
    const testEmail = "jersoncatadman88@gmail.com"
    
    // 1. Find the test user
    console.log("🔍 Step 1: Finding test user...")
    const testUser = await prisma.user.findUnique({
      where: { email: testEmail },
      include: {
        status: true,
        probation: true,
        department: true
      }
    })

    if (!testUser) {
      console.log("❌ Test user not found. Creating test user...")
      
      // Get required IDs
      const [probationStatus, department, adminRole] = await Promise.all([
        prisma.status.findFirst({ where: { name: "Probation" } }),
        prisma.department.findFirst(),
        prisma.role.findFirst({ where: { name: "Admin" } })
      ])

      if (!probationStatus || !department || !adminRole) {
        console.log("❌ Required database records not found")
        return
      }

      // Create user
      const userCount = await prisma.user.count()
      const newUserId = `OALASS${String(userCount + 1).padStart(3, '0')}`
      
      const newUser = await prisma.user.create({
        data: {
          users_id: newUserId,
          name: "Jerson Catadman",
          email: testEmail,
          password: "$2a$10$hash",
          department_id: department.department_id,
          role_id: adminRole.role_id,
          status_id: probationStatus.status_id,
          profile_picture_url: null
        }
      })
      
      console.log(`✅ Created test user: ${newUser.name}`)
    }

    // Refetch user with latest data
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: {
        status: true,
        probation: true,
        department: true
      }
    })

    console.log(`✅ Found user: ${user.name} (${user.email})`)
    console.log(`   Status: ${user.status?.name}`)
    console.log(`   Department: ${user.department?.name || 'N/A'}`)

    // 2. Ensure probation record exists
    console.log("\n🔍 Step 2: Setting up probation record...")
    
    if (!user.probation) {
      // Create expired probation
      const endDate = new Date()
      endDate.setDate(endDate.getDate() - 3) // 3 days ago
      
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 93) // 90 days probation

      await prisma.probation.create({
        data: {
          users_id: user.users_id,
          startDate: startDate,
          endDate: endDate,
          probationDays: 90,
          status: "ACTIVE",
          isEmailSent: false
        }
      })
      
      console.log(`✅ Created probation record (ended ${endDate.toDateString()})`)
    } else {
      console.log(`✅ Probation exists (ends ${user.probation.endDate.toDateString()})`)
    }

    // 3. Test email sending directly
    console.log("\n📧 Step 3: Sending probation completion email...")
    
    const probationEndDate = user.probation?.endDate || new Date()
    
    const emailResult = await gmailService.sendProbationCompletionEmail(
      user.email,
      user.name,
      probationEndDate
    )

    if (emailResult.success) {
      console.log("\n🎉 EMAIL SENT SUCCESSFULLY!")
      console.log("=" * 40)
      console.log(`✅ Recipient: ${user.email}`)
      console.log(`✅ Message ID: ${emailResult.messageId}`)
      
      if (emailResult.previewUrl) {
        console.log(`🌐 Preview URL: ${emailResult.previewUrl}`)
        console.log("\n📱 IMPORTANT: Open the preview URL above to see the email!")
        console.log("   This is a test email service, so check the preview link.")
      }
      
      // 4. Update database to reflect email sent
      console.log("\n💾 Step 4: Updating database...")
      
      const currentDate = new Date()
      const regularStatus = await prisma.status.findFirst({
        where: { name: "Regular" }
      })

      if (regularStatus) {
        await prisma.$transaction(async (tx) => {
          // Update probation
          await tx.probation.update({
            where: { users_id: user.users_id },
            data: {
              status: "COMPLETED",
              completionDate: currentDate,
              isEmailSent: true
            }
          })

          // Update user status
          await tx.user.update({
            where: { users_id: user.users_id },
            data: {
              status_id: regularStatus.status_id
            }
          })
        })
        
        console.log("✅ Database updated: User promoted to Regular status")
      }

      // 5. Final verification
      console.log("\n📊 Step 5: Final verification...")
      
      const finalUser = await prisma.user.findUnique({
        where: { users_id: user.users_id },
        include: {
          status: true,
          probation: true
        }
      })

      console.log("\n🎯 FINAL RESULTS:")
      console.log("=" * 30)
      console.log(`👤 Name: ${finalUser.name}`)
      console.log(`📧 Email: ${finalUser.email}`)
      console.log(`📋 Status: ${finalUser.status?.name}`)
      console.log(`⏰ Probation: ${finalUser.probation?.status}`)
      console.log(`📅 Completed: ${finalUser.probation?.completionDate?.toDateString()}`)
      console.log(`✉️ Email Sent: ${finalUser.probation?.isEmailSent ? 'Yes' : 'No'}`)

      if (emailResult.previewUrl) {
        console.log("\n🚀 ACTION REQUIRED:")
        console.log(`   1. Open this URL to see the email: ${emailResult.previewUrl}`)
        console.log(`   2. The email was sent to the test service (Ethereal Email)`)
        console.log(`   3. This demonstrates the real email functionality`)
      }

    } else {
      console.log("❌ Failed to send email")
    }

  } catch (error) {
    console.error("❌ Test failed:", error)
  } finally {
    await prisma.$disconnect()
    console.log("\n✅ Test completed. Database connection closed.")
  }
}

// Run the test
realEmailProbationTest()
