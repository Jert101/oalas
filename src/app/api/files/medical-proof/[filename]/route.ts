import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { readFile, stat } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const filename = params.filename
    const filePath = join(process.cwd(), 'public', 'uploads', 'medical-proof', filename)

    console.log('🔍 File access request:', {
      filename,
      filePath,
      user: session.user.email,
      role: session.user.role
    })

    // Check if file exists
    if (!existsSync(filePath)) {
      console.log('❌ File not found:', filePath)
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Get file stats
    const fileStats = await stat(filePath)
    console.log('📁 File stats:', {
      size: fileStats.size,
      mtime: fileStats.mtime
    })

    // Read file as buffer
    const fileBuffer = await readFile(filePath)
    console.log('📄 File buffer length:', fileBuffer.length)

    // Determine MIME type based on file extension
    const getMimeType = (filename: string): string => {
      const ext = filename.toLowerCase().split('.').pop()
      switch (ext) {
        case 'pdf':
          return 'application/pdf'
        case 'jpg':
        case 'jpeg':
          return 'image/jpeg'
        case 'png':
          return 'image/png'
        case 'gif':
          return 'image/gif'
        case 'webp':
          return 'image/webp'
        default:
          return 'application/octet-stream'
      }
    }

    const mimeType = getMimeType(filename)
    console.log('📋 MIME type:', mimeType)

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Content-Disposition': `inline; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('❌ Error serving file:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
