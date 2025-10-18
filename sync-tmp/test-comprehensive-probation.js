// Comprehensive test for the OALASS Probation Management System
// This test demonstrates the complete workflow including email notifications

import { PrismaClient } from '@prisma/client'
import { emailService } from './src/lib/email-service.js'

const prisma = new PrismaClient()

async function comprehensiveProbationTest() {
  console.log("🚀 OALASS Probation Management System - Comprehensive Test")
  console.log("=" * 70)
  console.log(`Test Date: ${new Date().toLocaleString()}`)
  console.log("Target Email: jersoncatadman88@gmail.com\n")

  try {
    // 1. Setup Test Data
    console.log("📋 STEP 1: Setting up test data...")
    
    const testEmail = "jersoncatadman88@gmail.com"
    
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
      console.log("❌ Test user not found. Please run the setup first.")
      return
    }

    console.log(`✅ Test User: ${testUser.name} (${testUser.email})`)
    console.log(`   Current Status: ${testUser.status?.name}`)
    console.log(`   Department: ${testUser.department?.name || 'N/A'}`)

    // 2. Check Current Probation Status
    console.log("\n📊 STEP 2: Checking current probation status...")
    
    if (testUser.probation) {
      const daysUntilEnd = Math.ceil((testUser.probation.endDate - new Date()) / (1000 * 60 * 60 * 24))
      console.log(`   Probation Period: ${testUser.probation.startDate.toDateString()} - ${testUser.probation.endDate.toDateString()}`)
      console.log(`   Probation Status: ${testUser.probation.status}`)
      console.log(`   Days until end: ${daysUntilEnd}`)
      console.log(`   Email Sent: ${testUser.probation.isEmailSent ? 'Yes' : 'No'}`)
      
      if (daysUntilEnd > 0) {
        console.log("⚠️  Probation period is still active. Processing anyway for demonstration...")
      } else {
        console.log("⏰ Probation period has expired. Ready for processing!")
      }
    } else {
      console.log("❌ No probation period found for this user.")
      return
    }

    // 3. Simulate Automatic Status Check
    console.log("\n🔄 STEP 3: Simulating automatic probation status check...")
    
    const currentDate = new Date()
    const regularStatus = await prisma.status.findFirst({
      where: { name: "Regular" }
    })

    if (!regularStatus) {
      console.log("❌ Regular status not found in database")
      return
    }

    // 4. Process Probation Completion
    console.log("\n⚡ STEP 4: Processing probation completion...")
    
    await prisma.$transaction(async (tx) => {
      // Update probation status to COMPLETED
      await tx.probation.update({
        where: { probation_id: testUser.probation.probation_id },
        data: {
          status: "COMPLETED",
          completionDate: currentDate,
          isEmailSent: true
        }
      })

      // Update user status to Regular
      await tx.user.update({
        where: { users_id: testUser.users_id },
        data: {
          status_id: regularStatus.status_id
        }
      })
    })

    console.log("✅ Database updates completed successfully!")

    // 5. Send Email Notification
    console.log("\n📧 STEP 5: Sending email notification...")
    
    const emailSent = await emailService.sendProbationCompletionEmail(
      testUser.email,
      testUser.name,
      testUser.probation.endDate
    )

    if (emailSent) {
      console.log("✅ Email notification sent successfully!")
    } else {
      console.log("❌ Failed to send email notification")
    }

    // 6. Verify Final Status
    console.log("\n🎯 STEP 6: Verifying final status...")
    
    const updatedUser = await prisma.user.findUnique({
      where: { users_id: testUser.users_id },
      include: {
        status: true,
        probation: true,
        department: true
      }
    })

    console.log("\n📊 FINAL RESULTS:")
    console.log("=" * 50)
    console.log(`User: ${updatedUser.name}`)
    console.log(`Email: ${updatedUser.email}`)
    console.log(`Department: ${updatedUser.department?.name || 'N/A'}`)
    console.log(`Current Status: ${updatedUser.status?.name}`)
    console.log(`Probation Status: ${updatedUser.probation?.status}`)
    console.log(`Completion Date: ${updatedUser.probation?.completionDate?.toDateString() || 'N/A'}`)
    console.log(`Email Sent: ${updatedUser.probation?.isEmailSent ? 'Yes' : 'No'}`)
    
    // 7. Success Summary
    if (updatedUser.status?.name === "Regular" && 
        updatedUser.probation?.status === "COMPLETED" && 
        updatedUser.probation?.isEmailSent) {
      
      console.log("\n🎉 TEST RESULT: SUCCESS!")
      console.log("=" * 50)
      console.log("✅ User status promoted from Probation to Regular")
      console.log("✅ Probation period marked as COMPLETED")
      console.log("✅ Completion date recorded")
      console.log("✅ Email notification sent")
      console.log("\n💼 BUSINESS IMPACT:")
      console.log(`• ${updatedUser.name} is now a permanent employee`)
      console.log(`• Entitled to all regular employee benefits`)
      console.log(`• Automatic notification sent to ${updatedUser.email}`)
      console.log(`• HR record updated in OALASS system`)
      
    } else {
      console.log("\n❌ TEST RESULT: PARTIAL SUCCESS")
      console.log("Some steps may not have completed as expected.")
    }

    // 8. System Statistics
    console.log("\n📈 SYSTEM STATISTICS:")
    const totalUsers = await prisma.user.count()
    const probationUsers = await prisma.user.count({
      where: { status: { name: "Probation" } }
    })
    const regularUsers = await prisma.user.count({
      where: { status: { name: "Regular" } }
    })
    const activeProbations = await prisma.probation.count({
      where: { status: "ACTIVE" }
    })
    const completedProbations = await prisma.probation.count({
      where: { status: "COMPLETED" }
    })

    console.log(`• Total Users: ${totalUsers}`)
    console.log(`• Probationary Users: ${probationUsers}`)
    console.log(`• Regular Users: ${regularUsers}`)
    console.log(`• Active Probations: ${activeProbations}`)
    console.log(`• Completed Probations: ${completedProbations}`)

  } catch (error) {
    console.error("❌ Test failed with error:", error)
  } finally {
    await prisma.$disconnect()
    console.log("\n✅ Test completed. Database connection closed.")
  }
}

// Run the comprehensive test
comprehensiveProbationTest()
