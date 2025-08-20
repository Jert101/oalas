import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testAuth() {
  console.log('Testing authentication logic...')
  
  try {
    const credentials = {
      email: 'admin@admin.com',
      password: 'password'
    }
    
    console.log("🔑 Auth attempt for:", credentials.email)
    
    if (!credentials.email || !credentials.password) {
      console.log("❌ Missing credentials")
      throw new Error("Email and password required")
    }

    let user;
    try {
      console.log("📊 Attempting database query...")
      user = await prisma.user.findUnique({
        where: { email: credentials.email },
        select: {
          users_id: true,
          email: true,
          password: true,
          name: true,
          profilePicture: true,
          isEmailVerified: true,
          isActive: true,
          lockUntil: true,
          loginAttempts: true,
          role: {
            select: {
              name: true
            }
          }
        }
      })
      console.log("🎯 Database query completed")
    } catch (dbError) {
      console.error("💥 Database error:", dbError)
      throw new Error("Database connection failed")
    }

    console.log("👤 User found:", user ? "YES" : "NO")
    if (user) {
      console.log("📧 Email:", user.email)
      console.log("🔒 Has password:", !!user.password)
      console.log("✅ Is active:", user.isActive)
      console.log("🔐 Login attempts:", user.loginAttempts)
      console.log("⏰ Lock until:", user.lockUntil)
      
      if (user.password) {
        console.log("🔍 Comparing passwords...")
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        console.log("✅ Password valid:", isPasswordValid)
        
        if (isPasswordValid) {
          console.log("🎉 Authentication successful!")
          return {
            id: user.users_id,
            email: user.email,
            name: user.name,
            role: user.role?.name || "Guest",
            isEmailVerified: user.isEmailVerified,
            profilePicture: user.profilePicture || "/ckcm.png",
          }
        } else {
          console.log("❌ Password mismatch")
        }
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAuth()
