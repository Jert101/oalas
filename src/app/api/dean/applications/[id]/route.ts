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
    if (!allowedRoles.includes(user.role?.name || "")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const resolvedParams = await params
    const applicationId = parseInt(resolvedParams.id)

    if (isNaN(applicationId)) {
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 })
    }

    // Get the specific application
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

    console.log('🔎 Department check', { deanDeptId, applicantDeptId, deanEmail: user.email, applicantEmail: application.user.email })

    if (!deanDeptId || !applicantDeptId || deanDeptId !== applicantDeptId) {
      return NextResponse.json({ error: "Access denied - Application not in your department" }, { status: 403 })
    }

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
