import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const userId = resolvedParams.id

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { users_id: userId },
      include: {
        role: true
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Prevent deleting the last admin
    if (existingUser.role?.name === "Admin") {
      const adminCount = await prisma.user.count({
        where: {
          role: {
            name: "Admin"
          }
        }
      })

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last administrator account" },
          { status: 400 }
        )
      }
    }

    // Prevent self-deletion
    if (existingUser.users_id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    // Check for related records that would prevent deletion
    const relatedRecords = await prisma.user.findUnique({
      where: { users_id: userId },
      include: {
        leaveApplications: {
          select: { leave_application_id: true, status: true }
        },
        leaveBalances: {
          select: { leave_balance_id: true }
        },
        probation: {
          select: { probation_id: true, status: true }
        },
        travelOrders: {
          select: { travel_order_id: true, status: true }
        },
        notifications: {
          select: { notification_id: true }
        },
        accounts: {
          select: { accounts_id: true }
        }
      }
    })

    // Check for leave applications
    if (relatedRecords?.leaveApplications && relatedRecords.leaveApplications.length > 0) {
      const pendingApps = relatedRecords.leaveApplications.filter(app => 
        app.status === 'PENDING' || app.status === 'DEAN_APPROVED'
      )
      if (pendingApps.length > 0) {
        return NextResponse.json(
          { 
            error: `Cannot delete user. They have ${pendingApps.length} pending leave application(s). Please approve, reject, or cancel them first.`,
            details: {
              totalApplications: relatedRecords.leaveApplications.length,
              pendingApplications: pendingApps.length,
              applications: relatedRecords.leaveApplications.map(app => ({
                id: app.leave_application_id,
                status: app.status
              }))
            }
          },
          { status: 400 }
        )
      }
    }

    // Check for leave balances
    if (relatedRecords?.leaveBalances && relatedRecords.leaveBalances.length > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete user. They have ${relatedRecords.leaveBalances.length} leave balance record(s). Please contact system administrator.`,
          details: {
            leaveBalances: relatedRecords.leaveBalances.length
          }
        },
        { status: 400 }
      )
    }

    // Check for active probation
    if (relatedRecords?.probation && relatedRecords.probation.status === 'ACTIVE') {
      return NextResponse.json(
        { 
          error: "Cannot delete user. They have an active probation record.",
          details: {
            probationId: relatedRecords.probation.probation_id,
            status: relatedRecords.probation.status
          }
        },
        { status: 400 }
      )
    }

    // Check for pending travel orders
    if (relatedRecords?.travelOrders && relatedRecords.travelOrders.length > 0) {
      const pendingTravel = relatedRecords.travelOrders.filter(order => 
        order.status === 'PENDING' || order.status === 'DEAN_APPROVED'
      )
      if (pendingTravel.length > 0) {
        return NextResponse.json(
          { 
            error: `Cannot delete user. They have ${pendingTravel.length} pending travel order(s). Please approve, reject, or cancel them first.`,
            details: {
              totalTravelOrders: relatedRecords.travelOrders.length,
              pendingTravelOrders: pendingTravel.length,
              travelOrders: relatedRecords.travelOrders.map(order => ({
                id: order.travel_order_id,
                status: order.status
              }))
            }
          },
          { status: 400 }
        )
      }
    }

    // Delete the user (cascade will handle accounts, sessions, and notifications)
    await prisma.user.delete({
      where: { users_id: userId }
    })

    return NextResponse.json({
      success: true,
      message: "User deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const userId = resolvedParams.id

    // Fetch user data
    const user = await prisma.user.findUnique({
      where: { users_id: userId },
      select: {
        users_id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        middleName: true,
        suffix: true,
        profilePicture: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
        role: {
          select: {
            name: true
          }
        },
        department: {
          select: {
            name: true
          }
        },
        status: {
          select: {
            name: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: user
    })

  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    )
  }
}

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
    const roleId = parseInt(validatedData.roleId)
    const departmentId = parseInt(validatedData.departmentId)
    const statusId = parseInt(validatedData.statusId)

    const [role, department, status] = await Promise.all([
      prisma.role.findUnique({ where: { role_id: roleId } }),
      prisma.department.findUnique({ where: { department_id: departmentId } }),
      prisma.status.findUnique({ where: { status_id: statusId } })
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
        role_id: roleId,
        department_id: departmentId,
        status_id: statusId,
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
