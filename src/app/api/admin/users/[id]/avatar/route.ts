import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile } from "fs/promises"
import path from "path"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolved = await params
    const userId = resolved.id
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles")
    const filename = `${Date.now()}_${userId}.${(file.type.split("/")[1] || "jpg").replace("jpeg","jpg")}`
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    const relativePath = `/uploads/profiles/${filename}`
    await prisma.user.update({ where: { users_id: userId }, data: { profilePicture: relativePath } })

    return NextResponse.json({ success: true, url: relativePath })
  } catch (error) {
    console.error("Avatar upload error:", error)
    return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 })
  }
}



