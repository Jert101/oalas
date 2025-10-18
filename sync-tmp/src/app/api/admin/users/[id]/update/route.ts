import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  suffix: z.string().optional(),
  email: z.string().email("Invalid email address"),
  roleId: z.string().min(1, "Role is required"),
  departmentId: z.string().min(1, "Department is required"),
  statusId: z.string().min(1, "Status is required"),
  isActive: z.boolean()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const userId = resolvedParams.id
    const body = await request.json()
    
    // Validate the request body
    const validatedData = updateUserSchema.parse(body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { users_id: userId }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if email is already taken by another user
    if (validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { 
          email: validatedData.email,
          NOT: { users_id: userId }
        }
      })

      if (emailExists) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }
    }

    // Verify that role, department, and status exist
    const [role, department, status] = await Promise.all([
      prisma.role.findUnique({ where: { id: validatedData.roleId } }),
      prisma.department.findUnique({ where: { id: validatedData.departmentId } }),
      prisma.status.findUnique({ where: { id: validatedData.statusId } })
    ])

    if (!role || !department || !status) {
      return NextResponse.json({ error: 'Invalid role, department, or status' }, { status: 400 })
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { users_id: userId },
      data: {
        name: validatedData.name,
        firstName: validatedData.firstName || null,
        middleName: validatedData.middleName || null,
        lastName: validatedData.lastName || null,
        suffix: validatedData.suffix || null,
        email: validatedData.email,
        roleId: validatedData.roleId,
        departmentId: validatedData.departmentId,
        statusId: validatedData.statusId,
        isActive: validatedData.isActive,
        updatedAt: new Date()
      },
      include: {
        role: true,
        department: true,
        status: true
      }
    })

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Update user error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.issues
      }, { status: 400 })
    }
    
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
