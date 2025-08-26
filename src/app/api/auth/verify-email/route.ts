import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token || typeof token !== "string") {
      return NextResponse.json({ success: false, error: "Missing token" }, { status: 400 })
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    })

    if (!verificationToken || verificationToken.expires < new Date()) {
      return NextResponse.json({ success: false, error: "Invalid or expired verification token" }, { status: 400 })
    }

    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      }
    })

    await prisma.verificationToken.delete({ where: { token } })

    return NextResponse.json({ success: true, message: "Email verified successfully" })
  } catch (error) {
    console.error("Verify email API error:", error)
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 })
  }
}


