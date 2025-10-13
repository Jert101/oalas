import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for term type updates
const termTypeUpdateSchema = z.object({
  name: z.string().min(1, "Term type name is required").max(100, "Name too long").optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional()
})

// GET /api/admin/term-types/[id] - Get specific term type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const termTypeId = parseInt(id)
    if (isNaN(termTypeId)) {
      return NextResponse.json({ error: "Invalid term type ID" }, { status: 400 })
    }

    // Get term type with usage statistics
    const termType = await prisma.termType.findUnique({
      where: { term_type_id: termTypeId },
      include: {
        _count: {
          select: {
            calendarPeriods: true,
            leaveLimits: true
          }
        },
        calendarPeriods: {
          select: {
            calendar_period_id: true,
            academicYear: true,
            isCurrent: true
          },
          orderBy: { academicYear: 'desc' }
        }
      }
    })

    if (!termType) {
      return NextResponse.json({ error: "Term type not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: termType
    })

  } catch (error) {
    console.error('Error fetching term type:', error)
    return NextResponse.json(
      { error: "Failed to fetch term type" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/term-types/[id] - Update term type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const termTypeId = parseInt(id)
    if (isNaN(termTypeId)) {
      return NextResponse.json({ error: "Invalid term type ID" }, { status: 400 })
    }

    const body = await request.json()
    
    // Validate input
    const validatedData = termTypeUpdateSchema.parse(body)

    // Check if term type exists
    const existingTermType = await prisma.termType.findUnique({
      where: { term_type_id: termTypeId }
    })

    if (!existingTermType) {
      return NextResponse.json({ error: "Term type not found" }, { status: 404 })
    }

    // If name is being updated, check for duplicates
    if (validatedData.name && validatedData.name !== existingTermType.name) {
      const duplicateTermType = await prisma.termType.findFirst({
        where: { 
          name: validatedData.name,
          term_type_id: { not: termTypeId }
        }
      })

      if (duplicateTermType) {
        return NextResponse.json({ 
          error: "Term type with this name already exists" 
        }, { status: 400 })
      }
    }

    // Update term type
    const updatedTermType = await prisma.termType.update({
      where: { term_type_id: termTypeId },
      data: {
        ...validatedData,
        updatedAt: new Date()
      }
    })

    console.log(`✅ Term type updated: ${updatedTermType.name} (ID: ${updatedTermType.term_type_id})`)

    return NextResponse.json({
      success: true,
      message: "Term type updated successfully",
      data: updatedTermType
    })

  } catch (error) {
    console.error('Error updating term type:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation failed",
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json(
      { error: "Failed to update term type" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/term-types/[id] - Delete term type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const termTypeId = parseInt(id)
    if (isNaN(termTypeId)) {
      return NextResponse.json({ error: "Invalid term type ID" }, { status: 400 })
    }

    // Check if term type exists
    const termType = await prisma.termType.findUnique({
      where: { term_type_id: termTypeId },
      include: {
        _count: {
          select: {
            calendarPeriods: true,
            leaveLimits: true
          }
        }
      }
    })

    if (!termType) {
      return NextResponse.json({ error: "Term type not found" }, { status: 404 })
    }

    // Check if term type is being used
    const isInUse = termType._count.calendarPeriods > 0 || termType._count.leaveLimits > 0

    if (isInUse) {
      return NextResponse.json({ 
        error: "Cannot delete term type. It is currently being used by calendar periods or leave limits.",
        details: {
          calendarPeriods: termType._count.calendarPeriods,
          leaveLimits: termType._count.leaveLimits
        }
      }, { status: 400 })
    }

    // Delete term type
    await prisma.termType.delete({
      where: { term_type_id: termTypeId }
    })

    console.log(`✅ Term type deleted: ${termType.name} (ID: ${termType.term_type_id})`)

    return NextResponse.json({
      success: true,
      message: "Term type deleted successfully"
    })

  } catch (error) {
    console.error('Error deleting term type:', error)
    return NextResponse.json(
      { error: "Failed to delete term type" },
      { status: 500 }
    )
  }
}

