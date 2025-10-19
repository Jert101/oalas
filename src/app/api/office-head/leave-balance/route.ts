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
      
      // Provide more detailed error information
      const userBalances = await prisma.leaveBalance.findMany({
        where: { users_id: user.users_id }
      });
      
      console.log(`Office Head has ${userBalances.length} total leave balances`);
      
      return NextResponse.json({ 
        error: "Leave balance not found",
        details: {
          user_id: user.users_id,
          calendar_period_id: currentPeriod.calendar_period_id,
          leave_type_id: leaveTypeId,
          total_user_balances: userBalances.length
        }
      }, { status: 404 })
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

