// Test script for expired probation period with email notification
// This will simulate a probation period that has ended and test the email system

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testExpiredProbation() {
  console.log("🧪 Testing Expired Probation Period with Email Notification\n")
  
  try {
    // 1. First, let's find or create the probation status
    let probationStatus = await prisma.status.findFirst({
      where: { name: "Probation" }
    })
    
    if (!probationStatus) {
      probationStatus = await prisma.status.create({
        data: {
          name: "Probation",
          description: "Employee on probation"
        }
      })
      console.log("✅ Created Probation status")
    }

    // 2. Find or create regular status
    let regularStatus = await prisma.status.findFirst({
      where: { name: "Regular" }
    })
    
    if (!regularStatus) {
      regularStatus = await prisma.status.create({
        data: {
          name: "Regular",
          description: "Regular employee"
        }
      })
      console.log("✅ Created Regular status")
    }

    // 3. Find or create a department
    let department = await prisma.department.findFirst()
    
    if (!department) {
      department = await prisma.department.create({
        data: {
          name: "Information Technology",
          description: "IT Department"
        }
      })
      console.log("✅ Created IT Department")
    }

    // 4. Find or create admin role
    let adminRole = await prisma.role.findFirst({
      where: { name: "Admin" }
    })
    
    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          name: "Admin",
          description: "Administrator"
        }
      })
      console.log("✅ Created Admin role")
    }

    // 5. Create or update test user with the provided email
    const testEmail = "jersoncatadman88@gmail.com"
    let testUser = await prisma.user.findUnique({
      where: { email: testEmail }
    })

    if (!testUser) {
      // Generate a unique user ID
      const userCount = await prisma.user.count()
      const newUserId = `OALASS${String(userCount + 1).padStart(3, '0')}`
      
      testUser = await prisma.user.create({
        data: {
          users_id: newUserId,
          name: "Jerson Catadman",
          email: testEmail,
          password: "$2a$10$hash", // Dummy hash
          department_id: department.department_id,
          role_id: adminRole.role_id,
          status_id: probationStatus.status_id,
          profile_picture_url: null
        }
      })
      console.log(`✅ Created test user: ${testUser.name} (${testUser.email})`)
    } else {
      // Update existing user to probation status
      testUser = await prisma.user.update({
        where: { email: testEmail },
        data: {
          status_id: probationStatus.status_id
        }
      })
      console.log(`✅ Updated existing user to probation status: ${testUser.name}`)
    }

    // 6. Delete any existing probation for this user
    await prisma.probation.deleteMany({
      where: { users_id: testUser.users_id }
    })

    // 7. Create an expired probation period (ended 5 days ago)
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - 5) // 5 days ago
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 95) // 90 days probation, ended 5 days ago

    const expiredProbation = await prisma.probation.create({
      data: {
        users_id: testUser.users_id,
        startDate: startDate,
        endDate: endDate,
        probationDays: 90,
        status: "ACTIVE", // Still active, needs to be processed
        isEmailSent: false
      }
    })

    console.log(`✅ Created expired probation period:`)
    console.log(`   User: ${testUser.name} (${testUser.email})`)
    console.log(`   Start Date: ${startDate.toDateString()}`)
    console.log(`   End Date: ${endDate.toDateString()}`)
    console.log(`   Status: ${expiredProbation.status}`)
    console.log(`   Days: ${expiredProbation.probationDays}`)
    console.log("")

    // 8. Now test the expired probation check API
    console.log("🔄 Testing automatic probation expiry check...")
    
    // Simulate the API call to check expired probations
    const response = await fetch('http://localhost:3000/api/admin/probations/check-expired', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real scenario, you'd need proper authentication headers
      }
    })

    if (response.ok) {
      const result = await response.json()
      console.log("✅ API Response:", result)
      
      // 9. Verify the changes were made
      const updatedUser = await prisma.user.findUnique({
        where: { users_id: testUser.users_id },
        include: {
          status: true,
          probation: true
        }
      })

      console.log("\n📊 User Status After Processing:")
      console.log(`   Name: ${updatedUser.name}`)
      console.log(`   Email: ${updatedUser.email}`)
      console.log(`   Current Status: ${updatedUser.status?.name}`)
      console.log(`   Probation Status: ${updatedUser.probation?.status}`)
      console.log(`   Completion Date: ${updatedUser.probation?.completionDate?.toDateString() || 'N/A'}`)
      
      if (updatedUser.status?.name === "Regular" && updatedUser.probation?.status === "COMPLETED") {
        console.log("\n🎉 SUCCESS! User has been automatically promoted to Regular status!")
        console.log(`📧 Email notification should be sent to: ${testUser.email}`)
      } else {
        console.log("\n⚠️  Something didn't work as expected...")
      }
      
    } else {
      console.log("❌ API call failed:", response.statusText)
    }

  } catch (error) {
    console.error("❌ Error in test:", error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testExpiredProbation()
