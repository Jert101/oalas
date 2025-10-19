import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Dean Leave Apply API - Starting request processing')
    const session = await getServerSession(authOptions)
    
    console.log('🔍 Dean Leave Apply API - Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userRole: (session?.user as any)?.role
    })
    
    if (!session?.user?.email) {
      console.log('❌ Dean Leave Apply API - No session or user email found')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        department: true,
        role: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify user is a Dean/Program Head or has department head privileges
    const allowedRoles = ["Dean/Program Head", "Department Head"]
    const isAllowed = user.role?.name && allowedRoles.includes(user.role.name)
    const isDepartmentHead = user.isDepartmentHead === true
    
    console.log('User role:', user.role?.name)
    console.log('Is department head:', isDepartmentHead)
    console.log('Role allowed:', isAllowed)
    
    if (!isAllowed && !isDepartmentHead) {
      console.log('❌ Access denied - User role:', user.role?.name, 'Expected: Dean/Program Head or Department Head')
      return NextResponse.json({ error: "Access denied. Dean/Program Head or Department Head role required." }, { status: 403 })
    }

    const body = await request.json()
    console.log('🔍 Dean Leave Apply API - Request body:', body)
    
    const {
      leaveTypeId,
      startDate,
      endDate,
      numberOfDays,
      hours,
      reason,
      specificPurpose,
      descriptionOfSickness,
      paymentStatus,
      medicalProof,
      status,
      deanReviewedAt,
      deanReviewedBy,
      deanComments
    } = body

    console.log('🔍 Dean Leave Apply API - Extracted fields:', {
      leaveTypeId,
      startDate,
      endDate,
      numberOfDays,
      hours,
      reason,
      specificPurpose,
      descriptionOfSickness,
      paymentStatus,
      medicalProof
    })

    // Validate required fields
    if (!leaveTypeId || !startDate || !endDate || !numberOfDays) {
      console.log('❌ Dean Leave Apply API - Missing required fields:', {
        leaveTypeId: !!leaveTypeId,
        startDate: !!startDate,
        endDate: !!endDate,
        numberOfDays: !!numberOfDays
      })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get current calendar period
    console.log('🔍 Dean Leave Apply API - Looking up current calendar period')
    const currentPeriod = await prisma.calendarPeriod.findFirst({
      where: { isCurrent: true }
    })

    console.log('🔍 Dean Leave Apply API - Current period:', {
      found: !!currentPeriod,
      periodId: currentPeriod?.calendar_period_id,
      periodName: currentPeriod?.academicYear
    })

    if (!currentPeriod) {
      console.log('❌ Dean Leave Apply API - No current calendar period found')
      return NextResponse.json({ error: "No current calendar period found" }, { status: 404 })
    }

    // Create the leave application with automatic dean approval
    // Handle medicalProof - convert File object to null or string
    let medicalProofValue = null
    if (medicalProof && typeof medicalProof === 'object' && medicalProof.name) {
      // If it's a File object, we'll handle it later or set to null for now
      medicalProofValue = null
      console.log('🔍 Dean Leave Apply API - File object detected for medicalProof, setting to null')
    } else if (typeof medicalProof === 'string') {
      medicalProofValue = medicalProof
    }

    console.log('🔍 Dean Leave Apply API - Creating leave application with data:', {
      users_id: user.users_id,
      leave_type_id: leaveTypeId,
      calendar_period_id: currentPeriod.calendar_period_id,
      startDate: startDate,
      endDate: endDate,
      numberOfDays: numberOfDays,
      hours: hours || 0,
      reason: reason || null,
      specificPurpose: specificPurpose || null,
      descriptionOfSickness: descriptionOfSickness || null,
      paymentStatus: paymentStatus || 'UNPAID',
      medicalProof: medicalProofValue
    })
    
    const leaveApplication = await prisma.leaveApplication.create({
      data: {
        users_id: user.users_id,
        leave_type_id: leaveTypeId,
        calendar_period_id: currentPeriod.calendar_period_id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        numberOfDays: numberOfDays,
        hours: hours || 0,
        reason: reason || null,
        specificPurpose: specificPurpose || null,
        descriptionOfSickness: descriptionOfSickness || null,
        paymentStatus: paymentStatus || 'UNPAID',
        medicalProof: medicalProofValue,
        status: 'DEAN_APPROVED', // Automatically approved by dean
        appliedAt: new Date(),
        deanReviewedAt: new Date(),
        deanReviewedBy: user.users_id,
        deanComments: 'Automatically approved by Dean'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            users_id: true,
            department: {
              select: {
                name: true
              }
            }
          }
        },
        leaveType: {
          select: {
            name: true
          }
        }
      }
    })

    console.log('✅ Dean Leave Apply API - Leave application created successfully:', {
      applicationId: leaveApplication.leave_application_id,
      status: leaveApplication.status,
      applicantName: leaveApplication.user.name
    })

    return NextResponse.json({
      success: true,
      message: "Leave application submitted and automatically approved",
      data: {
        application: leaveApplication
      }
    })

  } catch (error) {
    console.error('❌ Dean Leave Apply API - Error creating leave application:', error)
    console.error('❌ Dean Leave Apply API - Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    return NextResponse.json(
      { error: "Failed to create leave application" },
      { status: 500 }
    )
  }
}


















