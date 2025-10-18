// Direct database test for expired probation period with email simulation
// This bypasses API authentication and directly tests the database logic

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function simulateEmailNotification(user, probationEndDate) {
  console.log("\n📧 SIMULATING EMAIL NOTIFICATION:")
  console.log("=" * 50)
  console.log(`To: ${user.email}`)
  console.log(`Subject: Congratulations! Your Probation Period is Complete`)
  console.log("")
  console.log(`Dear ${user.name},`)
  console.log("")
  console.log(`We are pleased to inform you that your probation period has been successfully completed as of ${probationEndDate.toDateString()}.`)
  console.log("")
  console.log(`You have now been promoted to Regular Employee status and will enjoy all the benefits and privileges that come with this position.`)
  console.log("")
  console.log(`Congratulations on your achievement, and we look forward to your continued success with our organization.`)
  console.log("")
  console.log(`Best regards,`)
  console.log(`OALASS HR Department`)
  console.log("=" * 50)
  console.log("✅ Email notification sent successfully!")
}

async function testExpiredProbationDirect() {
  console.log("🧪 Direct Database Test for Expired Probation Period\n")
  
  try {
    const testEmail = "jersoncatadman88@gmail.com"
    
    // 1. Find the user
    const testUser = await prisma.user.findUnique({
      where: { email: testEmail },
      include: {
        status: true,
        probation: true,
        department: true
      }
    })

    if (!testUser) {
      console.log("❌ Test user not found. Please run the setup test first.")
      return
    }

    console.log(`✅ Found test user: ${testUser.name} (${testUser.email})`)
    console.log(`   Current Status: ${testUser.status?.name}`)
    console.log(`   Department: ${testUser.department?.name}`)

    // 2. Find expired probations
    const currentDate = new Date()
    const expiredProbations = await prisma.probation.findMany({
      where: {
        users_id: testUser.users_id,
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
      console.log("⚠️  No expired probations found for this user.")
      
      // Check if there are any probations at all
      const allProbations = await prisma.probation.findMany({
        where: { users_id: testUser.users_id }
      })
      
      if (allProbations.length > 0) {
        console.log("\n📋 Current probations for this user:")
        allProbations.forEach((prob, index) => {
          console.log(`   ${index + 1}. Status: ${prob.status}`)
          console.log(`      Period: ${prob.startDate.toDateString()} - ${prob.endDate.toDateString()}`)
          console.log(`      Days until end: ${Math.ceil((prob.endDate - currentDate) / (1000 * 60 * 60 * 24))}`)
        })
      }
      return
    }

    console.log(`\n⏰ Found ${expiredProbations.length} expired probation(s) for processing...`)

    // 3. Get the "Regular" status
    const regularStatus = await prisma.status.findFirst({
      where: { name: "Regular" }
    })

    if (!regularStatus) {
      console.log("❌ Regular status not found in database")
      return
    }

    // 4. Process each expired probation (direct database logic)
    for (const probation of expiredProbations) {
      console.log(`\n🔄 Processing expired probation for ${probation.user.name}...`)
      console.log(`   Probation ended: ${probation.endDate.toDateString()}`)
      console.log(`   Days overdue: ${Math.ceil((currentDate - probation.endDate) / (1000 * 60 * 60 * 24))}`)

      try {
        // Start a transaction to update both probation and user status
        await prisma.$transaction(async (tx) => {
          // Update probation status to COMPLETED
          await tx.probation.update({
            where: { probation_id: probation.probation_id },
            data: {
              status: "COMPLETED",
              completionDate: currentDate,
              isEmailSent: true // Mark as email sent
            }
          })

          // Update user status to Regular
          await tx.user.update({
            where: { users_id: probation.users_id },
            data: {
              status_id: regularStatus.status_id
            }
          })
        })

        console.log("✅ Database updates completed successfully!")

        // 5. Simulate email notification
        await simulateEmailNotification(probation.user, probation.endDate)

        // 6. Verify the changes
        const updatedUser = await prisma.user.findUnique({
          where: { users_id: probation.users_id },
          include: {
            status: true,
            probation: true
          }
        })

        console.log("\n📊 Final Status:")
        console.log(`   User: ${updatedUser.name}`)
        console.log(`   New Status: ${updatedUser.status?.name}`)
        console.log(`   Probation Status: ${updatedUser.probation?.status}`)
        console.log(`   Completion Date: ${updatedUser.probation?.completionDate?.toDateString()}`)
        console.log(`   Email Sent: ${updatedUser.probation?.isEmailSent ? 'Yes' : 'No'}`)

        if (updatedUser.status?.name === "Regular" && updatedUser.probation?.status === "COMPLETED") {
          console.log("\n🎉 SUCCESS! Automatic probation completion process worked perfectly!")
        }

      } catch (error) {
        console.error(`❌ Error processing probation for user ${probation.users_id}:`, error)
      }
    }

    console.log("\n✅ Expired probation test completed!")

  } catch (error) {
    console.error("❌ Error in test:", error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testExpiredProbationDirect()
