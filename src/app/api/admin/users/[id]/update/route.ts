import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateUserSchema = z.object({
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  suffix: z.string().optional(),
  email: z.string().email("Invalid email address"),
  roleCategory: z.string().optional(),
  roleId: z.string().min(1, "Role is required"),
  departmentId: z.string().optional(),
  statusId: z.string().min(1, "Status is required"),
  isActive: z.boolean(),
  isDepartmentHead: z.string().optional()
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

    // Verify that role and status exist
    const [role, status] = await Promise.all([
      prisma.role.findUnique({ where: { role_id: parseInt(validatedData.roleId) } }),
      prisma.status.findUnique({ where: { status_id: parseInt(validatedData.statusId) } })
    ])

    if (!role || !status) {
      return NextResponse.json({ error: 'Invalid role or status' }, { status: 400 })
    }

    // Verify department exists if provided
    let department = null
    if (validatedData.departmentId) {
      department = await prisma.department.findUnique({ 
        where: { department_id: parseInt(validatedData.departmentId) } 
      })
      if (!department) {
        return NextResponse.json({ error: 'Invalid department' }, { status: 400 })
      }
    }

    // Construct full name from parts
    const nameParts = [
      validatedData.firstName,
      validatedData.middleName,
      validatedData.lastName,
      validatedData.suffix
    ].filter(Boolean)
    const fullName = nameParts.length > 0 ? nameParts.join(' ') : existingUser.name

    // Prepare update data
    const updateData: any = {
      name: fullName,
      firstName: validatedData.firstName || null,
      middleName: validatedData.middleName || null,
      lastName: validatedData.lastName || null,
      suffix: validatedData.suffix || null,
      email: validatedData.email,
      role_id: parseInt(validatedData.roleId),
      status_id: parseInt(validatedData.statusId),
      isActive: validatedData.isActive,
      updatedAt: new Date()
    }

    // Add department if provided
    if (validatedData.departmentId) {
      updateData.department_id = parseInt(validatedData.departmentId)
    }

    // Add isDepartmentHead if provided
    if (validatedData.isDepartmentHead) {
      updateData.isDepartmentHead = validatedData.isDepartmentHead === 'yes'
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { users_id: userId },
      data: updateData,
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
