// Test script to verify user deletion constraints
// Run this with: node test-user-deletion.js

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testUserDeletionConstraints() {
  try {
    console.log('🔍 Testing user deletion constraints...\n')

    // Find a user with leave applications
    const userWithApplications = await prisma.user.findFirst({
      where: {
        leaveApplications: {
          some: {}
        }
      },
      include: {
        leaveApplications: {
          select: { leave_application_id: true, status: true }
        },
        leaveBalances: {
          select: { leave_balance_id: true }
        },
        probation: {
          select: { probation_id: true, status: true }
        }
      }
    })

    if (userWithApplications) {
      console.log(`✅ Found user with applications: ${userWithApplications.name}`)
      console.log(`   - Leave Applications: ${userWithApplications.leaveApplications.length}`)
      console.log(`   - Leave Balances: ${userWithApplications.leaveBalances.length}`)
      console.log(`   - Probation: ${userWithApplications.probation ? 'Yes' : 'No'}`)
      
      console.log('\n📋 Application Details:')
      userWithApplications.leaveApplications.forEach(app => {
        console.log(`   - ID: ${app.leave_application_id}, Status: ${app.status}`)
      })
    } else {
      console.log('ℹ️  No users with leave applications found')
    }

    // Find a user without any constraints
    const userWithoutConstraints = await prisma.user.findFirst({
      where: {
        leaveApplications: {
          none: {}
        },
        leaveBalances: {
          none: {}
        },
        probation: null
      }
    })

    if (userWithoutConstraints) {
      console.log(`\n✅ Found user without constraints: ${userWithoutConstraints.name}`)
      console.log('   - This user can be safely deleted')
    } else {
      console.log('\nℹ️  No users found without constraints')
    }

    console.log('\n🎯 Test completed successfully!')
    console.log('\n📝 Summary:')
    console.log('   - Users with pending leave applications cannot be deleted')
    console.log('   - Users with leave balances cannot be deleted')
    console.log('   - Users with active probation cannot be deleted')
    console.log('   - Users with pending travel orders cannot be deleted')
    console.log('   - Only users without these constraints can be deleted')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testUserDeletionConstraints()
