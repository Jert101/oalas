import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('Office Head Leave balance API: Session check');
    console.log('Session exists:', !!session);
    console.log('Session user:', session?.user);
    console.log('Session user email:', session?.user?.email);
    
    if (!session) {
      console.log('Office Head Leave balance API: No session found - user not authenticated')
      return NextResponse.json({ error: "Not authenticated - please log in" }, { status: 401 })
    }
    
    if (!session.user) {
      console.log('Office Head Leave balance API: Session exists but no user data')
      return NextResponse.json({ error: "Invalid session - please log in again" }, { status: 401 })
    }
    
    if (!session.user.email) {
      console.log('Office Head Leave balance API: Session user exists but no email')
      return NextResponse.json({ error: "Invalid user data - please log in again" }, { status: 401 })
    }

    // Get URL parameters
    const { searchParams } = new URL(request.url)
    const leaveTypeId = searchParams.get('leaveTypeId')

    console.log(`Office Head Leave balance API: Request for leaveTypeId: ${leaveTypeId}`)

    if (!leaveTypeId) {
      console.log('Office Head Leave balance API: Missing leaveTypeId parameter')
      return NextResponse.json({ error: "Leave type ID is required" }, { status: 400 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true }
    })

    console.log('Office Head Leave balance API: User lookup result:', !!user);
    if (user) {
      console.log('Office Head Leave balance API: User details:', {
        name: user.name,
        users_id: user.users_id,
        email: user.email,
        role: user.role?.name,
        status_id: user.status_id,
        department_id: user.department_id
      });
    }

    if (!user) {
      console.log(`Office Head Leave balance API: User not found for email: ${session.user.email}`)
      return NextResponse.json({ 
        error: "User not found", 
        details: `No user found with email: ${session.user.email}` 
      }, { status: 404 })
    }

    // Verify user is an Office Head (Department Head or has isDepartmentHead flag)
    const allowedRoles = ["Department Head", "Admin"]
    const isOfficeHead = user.role && allowedRoles.includes(user.role.name)
    const hasDepartmentHeadFlag = (user as any).isDepartmentHead === true
    
    if (!isOfficeHead && !hasDepartmentHeadFlag) {
      console.log(`Office Head Leave balance API: User ${user.name} is not authorized. Role: ${user.role?.name}, isDepartmentHead: ${hasDepartmentHeadFlag}`)
      return NextResponse.json({ error: "Access denied. Office Head role required." }, { status: 403 })
    }

    // Ensure user has a department
    if (!user.department_id) {
      console.log(`Office Head Leave balance API: User ${user.name} has no department assigned`)
      return NextResponse.json({ error: "No department assigned. Please contact administrator." }, { status: 400 })
    }

    console.log(`Office Head Leave balance API: Found office head: ${user.name} (${user.users_id}) in department: ${user.department_id}`)

    // Get current calendar period
    const currentPeriod = await prisma.calendarPeriod.findFirst({
      where: { isCurrent: true }
    })

    if (!currentPeriod) {
      console.log('Office Head Leave balance API: No current calendar period found')
      return NextResponse.json({ error: "No current calendar period found" }, { status: 404 })
    }

    console.log(`Office Head Leave balance API: Current period: ${currentPeriod.academicYear} (ID: ${currentPeriod.calendar_period_id})`)

    // Get leave balance for the current period and leave type
    const leaveBalance = await prisma.leaveBalance.findFirst({
      where: {
        users_id: user.users_id,
        calendar_period_id: currentPeriod.calendar_period_id,
        leave_type_id: parseInt(leaveTypeId)
      }
    })

    console.log('Office Head Leave balance API: Balance lookup result:', !!leaveBalance);
    if (leaveBalance) {
      console.log('Office Head Leave balance API: Balance details:', {
        allowedDays: leaveBalance.allowedDays,
        usedDays: leaveBalance.usedDays,
        remainingDays: leaveBalance.remainingDays,
        status_id: leaveBalance.status_id
      });
    }

    if (!leaveBalance) {
      console.log(`Office Head Leave balance API: No leave balance found for office head ${user.users_id}, period ${currentPeriod.calendar_period_id}, leave type ${leaveTypeId}`)
      
      // Try to get leave limits to create a virtual balance
      const leaveLimit = await prisma.leaveLimit.findFirst({
        where: {
          status_id: user.status_id || 1,
          leave_type_id: parseInt(leaveTypeId),
          termType: {
            term_type_id: currentPeriod.termType?.term_type_id
          },
          isActive: true
        },
        include: {
          leaveType: true
        }
      })

      if (!leaveLimit) {
        console.log(`Office Head Leave balance API: No leave limit found for status ${user.status_id}, leave type ${leaveTypeId}`)
        return NextResponse.json({ 
          error: "Leave limit not found for this leave type and status",
          details: {
            user_id: user.users_id,
            status_id: user.status_id,
            leave_type_id: leaveTypeId
          }
        }, { status: 404 })
      }

      // Create a virtual balance based on leave limits
      console.log(`Office Head Leave balance API: Creating virtual balance from limit: ${leaveLimit.daysAllowed} days`)
      
      // Calculate used days from approved applications
      const usedApplications = await prisma.leaveApplication.findMany({
        where: {
          users_id: user.users_id,
          calendar_period_id: currentPeriod.calendar_period_id,
          leave_type_id: parseInt(leaveTypeId),
          status: 'APPROVED'
        }
      })

      const usedDays = usedApplications.reduce((total, app) => {
        const startDate = new Date(app.startDate)
        const endDate = new Date(app.endDate)
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        return total + days
      }, 0)

      const remainingDays = Math.max(0, leaveLimit.daysAllowed - usedDays)

      const virtualBalance = {
        allowedDays: leaveLimit.daysAllowed,
        usedDays: usedDays,
        remainingDays: remainingDays,
        leaveType: {
          name: leaveLimit.leaveType?.name || 'Unknown'
        }
      }

      console.log('Office Head Leave balance API: Returning virtual balance:', virtualBalance)
      
      return NextResponse.json({
        leaveBalance: virtualBalance,
        isVirtual: true // Indicate this is a virtual balance, not from database
      })
    }

    console.log(`Office Head Leave balance API: Found balance - allowed: ${leaveBalance.allowedDays}, used: ${leaveBalance.usedDays}, remaining: ${leaveBalance.remainingDays}`)

    // Get the leave type name separately
    const leaveType = await prisma.leave_types.findUnique({
      where: { leave_type_id: parseInt(leaveTypeId) }
    })

    const response = {
      leaveBalance: {
        allowedDays: leaveBalance.allowedDays,
        usedDays: leaveBalance.usedDays,
        remainingDays: leaveBalance.remainingDays,
        leaveType: {
          name: leaveType?.name || 'Unknown'
        }
      }
    }

    console.log('Office Head Leave balance API: Returning response:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Office Head Leave balance API: Error fetching leave balance:', error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

