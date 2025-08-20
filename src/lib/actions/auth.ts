"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { prisma } from "@/lib/prisma"
import { sendPasswordResetEmail, sendEmailVerification } from "@/lib/email"
import { forgotPasswordSchema, resetPasswordSchema, createUserSchema } from "@/lib/validators/auth"
import { revalidatePath } from "next/cache"

export async function forgotPassword(values: z.infer<typeof forgotPasswordSchema>) {
  try {
    const { email } = forgotPasswordSchema.parse(values)

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Don't reveal if user exists
      return { 
        success: true, 
        message: "If an account exists, you'll receive a reset email" 
      }
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    const emailResult = await sendPasswordResetEmail(email, resetToken)

    if (!emailResult.success) {
      return { 
        success: false, 
        error: "Failed to send reset email" 
      }
    }

    return { 
      success: true, 
      message: "Password reset email sent successfully" 
    }

  } catch (error) {
    console.error('Forgot password error:', error)
    return { 
      success: false, 
      error: "Something went wrong" 
    }
  }
}

export async function resetPassword(values: z.infer<typeof resetPasswordSchema>) {
  try {
    const { token, password } = resetPasswordSchema.parse(values)

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    })

    if (!user) {
      return { 
        success: false, 
        error: "Invalid or expired reset token" 
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        loginAttempts: 0, // Reset login attempts
        lockUntil: null
      }
    })

    return { 
      success: true, 
      message: "Password reset successfully" 
    }

  } catch (error) {
    console.error('Reset password error:', error)
    return { 
      success: false, 
      error: "Something went wrong" 
    }
  }
}

export async function createUser(values: z.infer<typeof createUserSchema>) {
  try {
    const { email, name, password, role, isActive } = createUserSchema.parse(values)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return { 
        success: false, 
        error: "User already exists" 
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        isActive,
        isEmailVerified: false
      }
    })

    // Send verification email
    const verificationToken = randomBytes(32).toString('hex')
    
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: verificationToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    })

    await sendEmailVerification(user.email, verificationToken)

    revalidatePath('/admin/users')

    return { 
      success: true, 
      message: "User created successfully" 
    }

  } catch (error) {
    console.error('Create user error:', error)
    return { 
      success: false, 
      error: "Something went wrong" 
    }
  }
}

export async function verifyEmail(token: string) {
  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    })

    if (!verificationToken || verificationToken.expires < new Date()) {
      return { 
        success: false, 
        error: "Invalid or expired verification token" 
      }
    }

    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      }
    })

    await prisma.verificationToken.delete({
      where: { token }
    })

    return { 
      success: true, 
      message: "Email verified successfully" 
    }

  } catch (error) {
    console.error('Verify email error:', error)
    return { 
      success: false, 
      error: "Something went wrong" 
    }
  }
}
