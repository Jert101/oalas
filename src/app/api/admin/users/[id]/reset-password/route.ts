import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { password, generateRandom } = await request.json().catch(() => ({ })) as { password?: string; generateRandom?: boolean }
    const resolved = await params
    const userId = resolved.id

    const user = await prisma.user.findUnique({ where: { users_id: userId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let newPassword = password || ""
    if (generateRandom || !newPassword) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
      newPassword = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { users_id: userId }, data: { password: hashed } })

    return NextResponse.json({ success: true, newPassword })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}



