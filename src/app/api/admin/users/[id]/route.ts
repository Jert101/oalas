import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateUserSchema = z.object({
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  suffix: z.string().optional(),
  email: z.string().email("Invalid email address"),
  roleCategory: z.string().min(1, "Role category is required"),
  roleId: z.string().min(1, "Role is required"),
  departmentId: z.string().optional(),
  statusId: z.string().min(1, "Status is required"),
  isActive: z.boolean(),
  isDepartmentHead: z.string().optional()
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

    // Get related records for logging purposes (but don't prevent deletion)
    const relatedRecords = await prisma.user.findUnique({
      where: { users_id: userId },
      include: {
        leaveApplications: {
          select: { leave_application_id: true, status: true }
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

    // Get leave balances separately (no relation exists)
    const leaveBalances = await prisma.leaveBalance.findMany({
      where: { users_id: userId },
      select: { leave_balance_id: true }
    })

    // Log what will be deleted (for audit purposes)
    const deletionSummary = {
      leaveApplications: relatedRecords?.leaveApplications?.length || 0,
      leaveBalances: leaveBalances?.length || 0,
      probation: relatedRecords?.probation ? 1 : 0,
      travelOrders: relatedRecords?.travelOrders?.length || 0,
      notifications: relatedRecords?.notifications?.length || 0,
      accounts: relatedRecords?.accounts?.length || 0
    }

    console.log(`Deleting user ${existingUser.name} (${existingUser.email}) with related records:`, deletionSummary)

    // Delete the user and all related records using a transaction
    await prisma.$transaction(async (tx) => {
      // Delete related records first (in case of foreign key constraints)
      
      // Delete leave applications
      if (relatedRecords?.leaveApplications && relatedRecords.leaveApplications.length > 0) {
        await tx.leaveApplication.deleteMany({
          where: { users_id: userId }
        })
      }

      // Delete leave balances
      if (leaveBalances && leaveBalances.length > 0) {
        await tx.leaveBalance.deleteMany({
          where: { users_id: userId }
        })
      }

      // Delete probation records
      if (relatedRecords?.probation) {
        await tx.probation.deleteMany({
          where: { users_id: userId }
        })
      }

      // Delete travel orders
      if (relatedRecords?.travelOrders && relatedRecords.travelOrders.length > 0) {
        await tx.travelOrder.deleteMany({
          where: { users_id: userId }
        })
      }

      // Delete notifications
      if (relatedRecords?.notifications && relatedRecords.notifications.length > 0) {
        await tx.notification.deleteMany({
          where: { users_id: userId }
        })
      }

      // Delete accounts (sessions will be handled by cascade)
      if (relatedRecords?.accounts && relatedRecords.accounts.length > 0) {
        await tx.account.deleteMany({
          where: { users_id: userId }
        })
      }

      // Finally, delete the user
      await tx.user.delete({
        where: { users_id: userId }
      })
    })

    return NextResponse.json({
      success: true,
      message: `User deleted successfully. Also deleted: ${deletionSummary.leaveApplications} leave applications, ${deletionSummary.leaveBalances} leave balances, ${deletionSummary.probation} probation record, ${deletionSummary.travelOrders} travel orders, ${deletionSummary.notifications} notifications, and ${deletionSummary.accounts} accounts.`,
      deletedRecords: deletionSummary
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

    // Verify that role and status exist
    const roleId = parseInt(validatedData.roleId)
    const statusId = parseInt(validatedData.statusId)

    const [role, status] = await Promise.all([
      prisma.role.findUnique({ where: { role_id: roleId } }),
      prisma.status.findUnique({ where: { status_id: statusId } })
    ])

    if (!role || !status) {
      return NextResponse.json({ error: 'Invalid role or status' }, { status: 400 })
    }

    // Verify department if provided
    let department = null
    if (validatedData.departmentId) {
      const departmentId = parseInt(validatedData.departmentId)
      department = await prisma.department.findUnique({ where: { department_id: departmentId } })
      if (!department) {
        return NextResponse.json({ error: 'Invalid department' }, { status: 400 })
      }
    }

    // Handle isDepartmentHead conversion
    const isDepartmentHead = validatedData.isDepartmentHead === "yes"

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { users_id: userId },
      data: {
        firstName: validatedData.firstName || null,
        middleName: validatedData.middleName || null,
        lastName: validatedData.lastName || null,
        suffix: validatedData.suffix || null,
        email: validatedData.email,
        role_id: roleId,
        department_id: validatedData.departmentId ? parseInt(validatedData.departmentId) : null,
        status_id: statusId,
        isActive: validatedData.isActive,
        isDepartmentHead: isDepartmentHead,
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
