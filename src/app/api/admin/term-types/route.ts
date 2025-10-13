import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for term type
const termTypeSchema = z.object({
  name: z.string().min(1, "Term type name is required").max(100, "Name too long"),
  description: z.string().optional(),
  isActive: z.boolean().default(true)
})

// GET /api/admin/term-types - Get all term types
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user and verify admin role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true }
    })

    if (!user || user.role?.name !== 'Admin') {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 })
    }

    // Get all term types with usage statistics
    const termTypes = await prisma.termType.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            calendarPeriods: true,
            leaveLimits: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: termTypes
    })

  } catch (error) {
    console.error('Error fetching term types:', error)
    return NextResponse.json(
      { error: "Failed to fetch term types" },
      { status: 500 }
    )
  }
}

// POST /api/admin/term-types - Create new term type
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user and verify admin role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true }
    })

    if (!user || user.role?.name !== 'Admin') {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate input
    const validatedData = termTypeSchema.parse(body)

    // Check if term type with same name already exists
    const existingTermType = await prisma.termType.findFirst({
      where: { name: validatedData.name }
    })

    if (existingTermType) {
      return NextResponse.json({ 
        error: "Term type with this name already exists" 
      }, { status: 400 })
    }

    // Create new term type
    const termType = await prisma.termType.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        isActive: validatedData.isActive
      }
    })

    console.log(`✅ Term type created: ${termType.name} (ID: ${termType.term_type_id})`)

    return NextResponse.json({
      success: true,
      message: "Term type created successfully",
      data: termType
    })

  } catch (error) {
    console.error('Error creating term type:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation failed",
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json(
      { error: "Failed to create term type" },
      { status: 500 }
    )
  }
}