import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
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

    // Allow both Dean/Program Head and Department Head to access application details
    const allowedRoles = ["Dean/Program Head", "Department Head"]
    const isAllowed = user.role?.name && allowedRoles.includes(user.role.name)
    const isDepartmentHead = user.isDepartmentHead === true
    
    console.log('🔍 Dean Application Detail API - User verification:', {
      userId: user.users_id,
      userEmail: user.email,
      userName: user.name,
      roleName: user.role?.name,
      isDepartmentHead: isDepartmentHead,
      isAllowed: isAllowed
    })
    
    if (!isAllowed && !isDepartmentHead) {
      console.log('❌ Access denied - User role:', user.role?.name, 'Expected: Dean/Program Head or Department Head')
      return NextResponse.json({ error: "Access denied. Dean/Program Head or Department Head role required." }, { status: 403 })
    }

    const resolvedParams = await params
    const originalId = resolvedParams.id
    
    // Handle different ID formats: "leave_24", "travel_5", or just "24"
    let applicationId: number
    if (originalId.startsWith('leave_')) {
      applicationId = parseInt(originalId.replace('leave_', ''))
    } else if (originalId.startsWith('travel_')) {
      // For travel orders, we need to handle differently
      console.log('❌ Travel order ID detected, redirecting to travel order API:', originalId)
      return NextResponse.json({ error: "Travel orders are not handled by this endpoint" }, { status: 400 })
    } else {
      applicationId = parseInt(originalId)
    }

    console.log('🔍 Dean Application Detail API - Request details:', {
      applicationId: applicationId,
      originalId: originalId,
      isNaN: isNaN(applicationId)
    })

    if (isNaN(applicationId)) {
      console.log('❌ Invalid application ID:', originalId)
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 })
    }

    // Get the specific application
    console.log('🔍 Dean Application Detail API - Looking up application:', applicationId)
    const application = await prisma.leaveApplication.findUnique({
      where: {
        leave_application_id: applicationId
      },
      include: {
        user: {
          select: {
            users_id: true,
            name: true,
            email: true,
            profilePicture: true,
            department_id: true,
            department: {
              select: {
                department_id: true,
                name: true
              }
            }
          }
        },
        calendarPeriod: {
          select: {
            academicYear: true,
            startDate: true,
            endDate: true
          }
        },
        reviewer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    console.log('🔍 Dean Application Detail API - Application found:', !!application)
    if (application) {
      console.log('🔍 Dean Application Detail API - Application details:', {
        id: application.leave_application_id,
        applicantName: application.user.name,
        applicantEmail: application.user.email,
        applicantDeptId: application.user.department_id,
        applicantDeptName: application.user.department?.name
      })
    }

    // Get leave type information
    const leaveType = application ? await prisma.leave_types.findUnique({
      where: {
        leave_type_id: application.leave_type_id
      },
      select: {
        leave_type_id: true,
        name: true,
        description: true
      }
    }) : null

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Verify the application belongs to a faculty member in the dean's department
    const deanDeptId = user.department_id
    const applicantDeptId = (application.user as any)?.department_id ?? application.user.department?.department_id

    console.log('🔎 Dean Application Detail API - Department verification:', { 
      deanDeptId, 
      applicantDeptId, 
      deanEmail: user.email, 
      applicantEmail: application.user.email,
      deanDeptName: user.department?.name,
      applicantDeptName: application.user.department?.name,
      departmentsMatch: deanDeptId === applicantDeptId
    })

    if (!deanDeptId || !applicantDeptId || deanDeptId !== applicantDeptId) {
      console.log('❌ Dean Application Detail API - Department mismatch, access denied')
      return NextResponse.json({ error: "Access denied - Application not in your department" }, { status: 403 })
    }

    console.log('✅ Dean Application Detail API - Department verification passed')

    return NextResponse.json({
      success: true,
      data: {
        application: {
          ...application,
          leaveType: leaveType
        }
      }
    })

  } catch (error) {
    console.error('Error fetching application details:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
