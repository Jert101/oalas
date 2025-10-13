import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('Dean Leave limits API: Session check');
    console.log('Session exists:', !!session);
    console.log('Session user email:', session?.user?.email);
    
    if (!session?.user?.email) {
      console.log('Dean Leave limits API: No session found - user not authenticated')
      return NextResponse.json({ error: "Not authenticated - please log in" }, { status: 401 })
    }

    // Get URL parameters
    const { searchParams } = new URL(request.url)
    const leaveTypeId = searchParams.get('leaveTypeId')

    console.log(`Dean Leave limits API: Request for leaveTypeId: ${leaveTypeId}`)

    if (!leaveTypeId) {
      console.log('Dean Leave limits API: Missing leaveTypeId parameter')
      return NextResponse.json({ error: "Leave type ID is required" }, { status: 400 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true }
    })

    console.log('Dean Leave limits API: User lookup result:', !!user);
    if (user) {
      console.log('Dean Leave limits API: User details:', {
        name: user.name,
        users_id: user.users_id,
        email: user.email,
        role: user.role?.name,
        status_id: user.status_id
      });
    }

    if (!user) {
      console.log(`Dean Leave limits API: User not found for email: ${session.user.email}`)
      return NextResponse.json({ 
        error: "User not found", 
        details: `No user found with email: ${session.user.email}` 
      }, { status: 404 })
    }

    // Verify user is a Dean/Program Head
    if (user.role?.name !== "Dean/Program Head") {
      console.log(`Dean Leave limits API: User ${user.name} is not a Dean/Program Head`)
      return NextResponse.json({ error: "Access denied. Dean/Program Head role required." }, { status: 403 })
    }

    console.log(`Dean Leave limits API: Found dean: ${user.name} (${user.users_id})`)

    // Get current calendar period
    const currentPeriod = await prisma.calendarPeriod.findFirst({
      where: { isCurrent: true }
    })

    if (!currentPeriod) {
      console.log('Dean Leave limits API: No current calendar period found')
      return NextResponse.json({ error: "No current calendar period found" }, { status: 404 })
    }

    console.log(`Dean Leave limits API: Current period: ${currentPeriod.academicYear} (ID: ${currentPeriod.calendar_period_id})`)

    // Get leave limit for the dean's status, current term, and leave type
    const leaveLimit = await prisma.leaveLimit.findFirst({
      where: {
        status_id: user.status_id,
        term_type_id: currentPeriod.term_type_id,
        leave_type_id: parseInt(leaveTypeId)
      },
      include: {
        leaveType: {
          select: {
            name: true
          }
        }
      }
    })

    console.log('Dean Leave limits API: Limit lookup result:', !!leaveLimit);
    if (leaveLimit) {
      console.log('Dean Leave limits API: Limit details:', {
        daysAllowed: leaveLimit.daysAllowed,
        leaveType: leaveLimit.leaveType?.name,
        status_id: leaveLimit.status_id,
        term_type_id: leaveLimit.term_type_id
      });
    }

    if (!leaveLimit) {
      console.log(`Dean Leave limits API: No leave limit found for dean ${user.name} (status: ${user.status_id}, term: ${currentPeriod.term_type_id}, leave type: ${leaveTypeId})`)
      
      return NextResponse.json({ 
        error: "Leave limit not found",
        details: {
          user_id: user.users_id,
          status_id: user.status_id,
          term_type_id: currentPeriod.term_type_id,
          leave_type_id: leaveTypeId
        }
      }, { status: 404 })
    }

    console.log(`Dean Leave limits API: Found limit - ${leaveLimit.leaveType?.name}: ${leaveLimit.daysAllowed} days allowed`)

    const response = {
      leaveLimit: {
        leave_limit_id: leaveLimit.leave_limit_id,
        daysAllowed: leaveLimit.daysAllowed,
        leaveType: {
          name: leaveLimit.leaveType?.name || 'Unknown'
        }
      }
    }

    console.log('Dean Leave limits API: Returning response:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Dean Leave limits API: Error fetching leave limits:', error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

