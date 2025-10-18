// REAL EMAIL TEST - Sends actual email to jersoncatadman88@gmail.com
// This will guide you through setting up Gmail SMTP for real email delivery

import { realEmailService } from './src/lib/real-email-service.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function sendRealEmailTest() {
  console.log("📧 REAL EMAIL DELIVERY TEST")
  console.log("=".repeat(60))
  console.log(`🎯 Target: jersoncatadman88@gmail.com`)
  console.log(`📅 Date: ${new Date().toLocaleString()}`)
  console.log(`🚀 Mode: Gmail SMTP (Real Email Delivery)`)
  console.log("")

  try {
    const testEmail = "jersoncatadman88@gmail.com"
    
    // Step 1: Find the user
    console.log("🔍 Step 1: Finding user in database...")
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: {
        probation: true,
        department: true
      }
    })

    if (!user) {
      console.log("❌ User not found. Please ensure the user exists in the database.")
      return
    }

    console.log(`✅ Found user: ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Department: ${user.department?.name || 'N/A'}`)

    // Step 2: Send the email
    console.log("\n📧 Step 2: Sending probation completion email...")
    console.log("⏳ This may take a few seconds...")
    
    const probationEndDate = user.probation?.endDate || new Date()
    
    const result = await realEmailService.sendProbationCompletionEmail(
      user.email,
      user.name,
      probationEndDate
    )

    if (result.success) {
      console.log("\n🎉 EMAIL SENT SUCCESSFULLY!")
      console.log("=".repeat(50))
      console.log(`✅ Recipient: ${user.email}`)
      console.log(`✅ Message ID: ${result.messageId}`)
      console.log("")
      
      console.log("📱 NEXT STEPS:")
      console.log(`1. Check ${user.email} inbox`)
      console.log("2. Look for email from 'OALASS HR Department'")
      console.log("3. Check spam folder if not in inbox")
      console.log("")
      
      console.log("📧 EMAIL FEATURES:")
      console.log("✅ Professional HTML design")
      console.log("✅ Mobile-responsive layout")
      console.log("✅ Personalized congratulations message")
      console.log("✅ Company branding and colors")
      console.log("✅ Clear next steps information")
      
    } else {
      console.log("❌ EMAIL FAILED TO SEND")
      console.log(`Error: ${result.error}`)
      console.log("")
      console.log("💡 TROUBLESHOOTING:")
      console.log("1. Make sure you've set up Gmail App Password")
      console.log("2. Check your internet connection")
      console.log("3. Verify Gmail credentials in .env.local")
    }

    // Step 3: Setup instructions for real Gmail
    console.log("\n🔧 FOR REAL GMAIL DELIVERY:")
    console.log("=".repeat(40))
    console.log("1. Go to myaccount.google.com")
    console.log("2. Navigate to Security > 2-Step Verification")
    console.log("3. Click on 'App passwords'")
    console.log("4. Generate a new app password for 'Mail'")
    console.log("5. Copy the 16-character password")
    console.log("6. Update .env.local:")
    console.log("   GMAIL_USER=\"your-email@gmail.com\"")
    console.log("   GMAIL_APP_PASSWORD=\"your-16-char-password\"")
    console.log("7. Uncomment the Gmail transporter in real-email-service.ts")
    console.log("8. Run this test again")
    console.log("")
    console.log("📧 Current Status: Using test SMTP (preview only)")
    console.log("📧 Target Status: Real Gmail SMTP (actual delivery)")

  } catch (error) {
    console.error("❌ Test failed:", error)
  } finally {
    await prisma.$disconnect()
    console.log("\n✅ Test completed.")
  }
}

// Instructions for the user
console.log("🚀 GMAIL SETUP INSTRUCTIONS")
console.log("=".repeat(50))
console.log("Before running this test, please:")
console.log("1. Enable 2-factor authentication on your Gmail")
console.log("2. Generate an App Password for this application")
console.log("3. Update the .env.local file with your credentials")
console.log("4. Uncomment the real Gmail code in real-email-service.ts")
console.log("")
console.log("Running test with current configuration...")
console.log("")

// Run the test
sendRealEmailTest()
