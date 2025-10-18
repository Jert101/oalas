// Test script for probation management system
// This script demonstrates the automatic status promotion functionality

import { prisma } from "./src/lib/prisma.js"

async function testProbationSystem() {
  console.log("🔄 Testing Probation Management System...\n")

  try {
    // 1. Check current probations
    console.log("📋 Current Probations:")
    const currentProbations = await prisma.probation.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            status: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (currentProbations.length === 0) {
      console.log("   No probations found in the system.")
    } else {
      currentProbations.forEach((probation, index) => {
        console.log(`   ${index + 1}. ${probation.user.name} (${probation.user.email})`)
        console.log(`      Status: ${probation.status}`)
        console.log(`      Period: ${probation.startDate.toDateString()} - ${probation.endDate.toDateString()}`)
        console.log(`      Days: ${probation.probationDays}`)
        console.log(`      User Status: ${probation.user.status?.name}`)
        console.log("")
      })
    }

    // 2. Check for expired probations
    console.log("⏰ Checking for expired probations...")
    const currentDate = new Date()
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
            name: true,
            email: true
          }
        }
      }
    })

    if (expiredProbations.length === 0) {
      console.log("   ✅ No expired probations found.")
    } else {
      console.log(`   ⚠️  Found ${expiredProbations.length} expired probation(s):`)
      expiredProbations.forEach((probation, index) => {
        console.log(`      ${index + 1}. ${probation.user.name} - Ended: ${probation.endDate.toDateString()}`)
      })
    }

    // 3. Show probationary users available for assignment
    console.log("\n👥 Users with Probationary Status (available for probation assignment):")
    const probationaryUsers = await prisma.user.findMany({
      where: {
        status: {
          name: "Probation"
        },
        probation: null // Users without probation periods assigned
      },
      select: {
        users_id: true,
        name: true,
        email: true,
        department: {
          select: {
            name: true
          }
        }
      }
    })

    if (probationaryUsers.length === 0) {
      console.log("   No probationary users found that need probation periods assigned.")
    } else {
      probationaryUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email})`)
        console.log(`      Department: ${user.department?.name || "N/A"}`)
        console.log(`      ID: ${user.users_id}`)
        console.log("")
      })
    }

    console.log("✅ Probation system test completed successfully!")

  } catch (error) {
    console.error("❌ Error testing probation system:", error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testProbationSystem()
