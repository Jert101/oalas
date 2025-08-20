import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("avatar") as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, message: "File must be an image" },
        { status: 400 }
      )
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "File size must be less than 50MB" },
        { status: 400 }
      )
    }

    // Get file extension
    const fileExtension = file.name.split(".").pop() || "jpg"
    const fileName = `${randomUUID()}.${fileExtension}`
    const filePath = join(process.cwd(), "public", "uploads", "avatars", fileName)

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public", "uploads", "avatars")
    
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch {
      // Directory might already exist, ignore error
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    await writeFile(filePath, buffer)

    // Update user's profile picture in database
    const profilePicturePath = `/uploads/avatars/${fileName}`
    
    const updatedUser = await prisma.user.update({
      where: { users_id: session.user.id },
      data: { profilePicture: profilePicturePath },
      select: {
        users_id: true,
        profilePicture: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Avatar uploaded successfully",
      profilePicture: updatedUser.profilePicture,
    })
  } catch (error) {
    console.error("Error uploading avatar:", error)
    return NextResponse.json(
      { success: false, message: "Failed to upload avatar" },
      { status: 500 }
    )
  }
}
