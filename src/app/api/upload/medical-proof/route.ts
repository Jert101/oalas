import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Only images and PDF files are allowed." 
      }, { status: 400 })
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "File size must be less than 50MB" 
      }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'medical-proof')
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `medical-proof-${timestamp}-${randomString}.${fileExtension}`
    const filePath = join(uploadsDir, fileName)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Verify file was written correctly
    const { stat } = await import('fs/promises')
    const fileStats = await stat(filePath)
    
    // Return the relative path for database storage
    const relativePath = `/uploads/medical-proof/${fileName}`

    console.log('✅ Medical proof file uploaded:', {
      originalName: file.name,
      fileName: fileName,
      filePath: relativePath,
      originalSize: file.size,
      writtenSize: fileStats.size,
      type: file.type,
      bufferLength: buffer.length,
      integrityCheck: file.size === fileStats.size ? '✅ PASS' : '❌ FAIL'
    })

    return NextResponse.json({
      success: true,
      filePath: relativePath,
      fileName: fileName
    })

  } catch (error) {
    console.error('Error uploading medical proof:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
