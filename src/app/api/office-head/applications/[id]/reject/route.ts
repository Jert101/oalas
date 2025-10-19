import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notifyLeaveApplicationRejected } from "@/lib/notification-service"
import { realEmailService } from "@/lib/real-email-service"

// Function to send real-time application updates
async function sendRealtimeApplicationUpdate(userId: string, application: any, updateType: 'update') {
  try {
    const message = {
      type: 'application_update',
      userId: userId,
      data: {
        type: updateType,
        application: {
          id: application.leave_application_id,
          leaveType: application.leaveType?.name || 'Unknown',
          startDate: application.startDate,
          endDate: application.endDate,
          status: application.status,
          appliedAt: application.appliedAt,
          reason: application.reason,
          numberOfDays: application.numberOfDays,
          comments: application.deanComments,
          deanRejectionReason: application.deanRejectionReason,
          type: 'leave'
        }
      }
    }
    
    // Send via HTTP to WebSocket server API
    const response = await fetch(`http://localhost:3001/api/realtime/application`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        type: updateType,
        application: message.data.application
      })
    })
    
    if (response.ok) {
      console.log('✅ Real-time application update sent successfully')
    } else {
      console.warn('⚠️ Failed to send real-time application update:', response.status)
    }
  } catch (error) {
    console.warn('Failed to send real-time application update:', error)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
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

    // Verify user is a Dean/Program Head or Department Head
    const allowedRoles = ["Dean/Program Head", "Department Head"]
    if (!allowedRoles.includes(user.role?.name || "")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const resolvedParams = await params
    const applicationId = parseInt(resolvedParams.id)

    if (isNaN(applicationId)) {
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 })
    }

    // Get request body for rejection reason
    const body = await request.json()
    const { rejectionReason } = body

    if (!rejectionReason || rejectionReason.trim() === '') {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 })
    }

    // Get the application
    const application = await prisma.leaveApplication.findUnique({
      where: {
        leave_application_id: applicationId
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            users_id: true,
            department_id: true,
            department: {
              select: {
                name: true,
                department_id: true
              }
            }
          }
        }
      }
    })

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Verify the application belongs to a faculty member in the dean's department
    console.log('🔍 Department comparison (reject):', {
      currentUserDepartment: user.department?.name,
      currentUserDepartmentId: user.department_id,
      currentUserDepartmentObject: user.department,
      applicantDepartment: application.user.department?.name,
      applicantDepartmentId: application.user.department_id,
      applicantDepartmentObject: application.user.department,
      departmentsMatch: application.user.department?.name === user.department?.name,
      departmentIdsMatch: application.user.department_id === user.department_id,
      currentUserRole: user.role?.name,
      currentUserEmail: user.email
    })
    
    // Check if any department data is null/undefined
    if (!user.department || !application.user.department) {
      console.log('❌ Missing department data (reject):', {
        currentUserHasDepartment: !!user.department,
        applicantHasDepartment: !!application.user.department,
        currentUserDepartmentId: user.department_id,
        applicantDepartmentId: application.user.department_id
      })
      
      // Fallback to department_id comparison only
      if (user.department_id && application.user.department_id && 
          user.department_id === application.user.department_id) {
        console.log('✅ Department ID match - Access granted (fallback)')
      } else {
        console.log('❌ Department ID mismatch - Access denied')
        return NextResponse.json({ error: "Access denied - Application not in your department" }, { status: 403 })
      }
    } else {
      // Check both department name and department_id for comparison
      const departmentNamesMatch = application.user.department?.name === user.department?.name
      const departmentIdsMatch = application.user.department_id === user.department_id
      
      console.log('🔍 Detailed comparison (reject):', {
        departmentNamesMatch,
        departmentIdsMatch,
        fallbackCheck: application.user.department_id === user.department_id
      })
      
      if (!departmentNamesMatch && !departmentIdsMatch) {
        console.log('❌ Department mismatch - Access denied')
        return NextResponse.json({ error: "Access denied - Application not in your department" }, { status: 403 })
      }
      
      console.log('✅ Department match - Access granted')
    }

    // Check if application is in PENDING status
    if (application.status !== 'PENDING') {
      return NextResponse.json({ error: "Application is not in pending status" }, { status: 400 })
    }

    // Update application status to DEAN_REJECTED
    const updatedApplication = await prisma.leaveApplication.update({
      where: {
        leave_application_id: applicationId
      },
      data: {
        status: 'DEAN_REJECTED',
        deanReviewedAt: new Date(),
        deanReviewedBy: user.users_id,
        deanRejectionReason: rejectionReason.trim(),
        deanComments: `Rejected by Dean: ${rejectionReason.trim()}`
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Send notification to applicant (includes email)
    await notifyLeaveApplicationRejected(
      application.user.users_id, 
      applicationId, 
      rejectionReason,
      user.name,
      application.leaveType?.name || 'Leave'
    )

    // Send real-time application update
    await sendRealtimeApplicationUpdate(application.user.users_id, updatedApplication, 'update')

    return NextResponse.json({
      success: true,
      message: "Application rejected successfully",
      data: {
        application: updatedApplication
      }
    })

  } catch (error) {
    console.error('Error rejecting application:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
