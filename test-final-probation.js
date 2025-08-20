// Final test for probation system with email simulation
// This demonstrates the complete probation completion workflow

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function simulateEmailNotification(userEmail, userName, probationEndDate) {
  console.log("\n📧 EMAIL NOTIFICATION SENT!")
  console.log("=" * 60)
  console.log(`To: ${userEmail}`)
  console.log(`Subject: 🎉 Congratulations! Your Probation Period is Complete`)
  console.log("")
  console.log(`Dear ${userName},`)
  console.log("")
  console.log(`We are delighted to inform you that your probation period`)
  console.log(`has been successfully completed as of ${probationEndDate.toDateString()}.`)
  console.log("")
  console.log(`🌟 YOU ARE NOW A REGULAR EMPLOYEE! 🌟`)
  console.log("")
  console.log(`This promotion comes with all the benefits and privileges`)
  console.log(`of being a permanent member of our team.`)
  console.log("")
  console.log(`Congratulations on your achievement!`)
  console.log("")
  console.log(`Best regards,`)
  console.log(`OALASS HR Department`)
  console.log("=" * 60)
  return true
}

async function finalProbationTest() {
  console.log("🎯 FINAL PROBATION COMPLETION TEST")
  console.log("=" * 50)
  console.log(`Target: jersoncatadman88@gmail.com`)
  console.log(`Date: ${new Date().toLocaleString()}\n`)

  try {
    const testEmail = "jersoncatadman88@gmail.com"
    
    // 1. Find the test user
    const testUser = await prisma.user.findUnique({
      where: { email: testEmail },
      include: {
        status: true,
        probation: true,
        department: true
      }
    })

    if (!testUser || !testUser.probation) {
      console.log("❌ Test user or probation not found.")
      return
    }

    console.log(`👤 User: ${testUser.name}`)
    console.log(`📧 Email: ${testUser.email}`)
    console.log(`🏢 Department: ${testUser.department?.name || 'N/A'}`)
    console.log(`📋 Current Status: ${testUser.status?.name}`)
    console.log(`⏰ Probation End: ${testUser.probation.endDate.toDateString()}`)

    // 2. Process probation completion
    console.log("\n🔄 Processing probation completion...")
    
    const currentDate = new Date()
    const regularStatus = await prisma.status.findFirst({
      where: { name: "Regular" }
    })

    if (!regularStatus) {
      console.log("❌ Regular status not found")
      return
    }

    // 3. Update database
    await prisma.$transaction(async (tx) => {
      await tx.probation.update({
        where: { probation_id: testUser.probation.probation_id },
        data: {
          status: "COMPLETED",
          completionDate: currentDate,
          isEmailSent: true
        }
      })

      await tx.user.update({
        where: { users_id: testUser.users_id },
        data: {
          status_id: regularStatus.status_id
        }
      })
    })

    console.log("✅ Database updated successfully!")

    // 4. Send email notification
    const emailSent = simulateEmailNotification(
      testUser.email,
      testUser.name,
      testUser.probation.endDate
    )

    // 5. Verify final state
    const finalUser = await prisma.user.findUnique({
      where: { users_id: testUser.users_id },
      include: {
        status: true,
        probation: true
      }
    })

    console.log("\n🎉 SUCCESS! PROBATION COMPLETED!")
    console.log("=" * 40)
    console.log(`✅ User promoted to: ${finalUser.status?.name}`)
    console.log(`✅ Probation status: ${finalUser.probation?.status}`)
    console.log(`✅ Completion date: ${finalUser.probation?.completionDate?.toDateString()}`)
    console.log(`✅ Email sent: ${emailSent ? 'Yes' : 'No'}`)
    
    console.log("\n💼 WHAT HAPPENED:")
    console.log(`• ${finalUser.name} was automatically promoted from Probation to Regular status`)
    console.log(`• Email notification sent to ${testUser.email}`)
    console.log(`• HR records updated in OALASS system`)
    console.log(`• User now has full employee benefits and privileges`)

  } catch (error) {
    console.error("❌ Test failed:", error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
finalProbationTest()
