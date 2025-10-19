import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Allow Dean/Program Head, Department Head, Admin, and office heads
    const userRole = session.user.role
    const isDepartmentHead = (session.user as any)?.isDepartmentHead
    
    const allowedRoles = ["Dean/Program Head", "Department Head", "Admin"]
    const isAllowedRole = allowedRoles.includes(userRole || "")
    const isOfficeHead = isDepartmentHead === true
    
    if (!isAllowedRole && !isOfficeHead) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user's data (dean, department head, or office head)
    const currentUser = await prisma.user.findUnique({
      where: { 
        email: session.user.email
      },
      include: {
        department: true,
        role: true
      }
    })

    // For office heads, filter by their department only
    // For deans/department heads, filter by their department
    const userDepartmentId = currentUser?.department?.department_id
    
    // If user has no department, they shouldn't see any data
    if (!userDepartmentId) {
      return NextResponse.json({ 
        success: true, 
        data: {
          pendingApplications: 0,
          approvedApplications: 0,
          deniedApplications: 0,
          totalApplications: 0,
          facultyMembers: 0,
          recentApplications: [],
          departmentName: "No Department Assigned"
        }
      })
    }
    

    // Fetch office head-specific statistics (department-filtered)
    const [
      pendingApplications,
      approvedApplications,
      deniedApplications,
      totalApplications,
      facultyMembers,
      recentApplications
    ] = await Promise.all([
      // Pending applications (filtered by department)
      prisma.leaveApplication.count({
        where: {
          status: "PENDING",
          user: {
            department_id: userDepartmentId
          }
        }
      }),

      // Approved applications (filtered by department)
      prisma.leaveApplication.count({
        where: {
          status: "APPROVED",
          user: {
            department_id: userDepartmentId
          }
        }
      }),

      // Denied applications (filtered by department)
      prisma.leaveApplication.count({
        where: {
          status: "DENIED",
          user: {
            department_id: userDepartmentId
          }
        }
      }),

      // Total applications (filtered by department)
      prisma.leaveApplication.count({
        where: {
          user: {
            department_id: userDepartmentId
          }
        }
      }),

      // Faculty members (filtered by department) - all active users in department
      prisma.user.count({
        where: {
          department_id: userDepartmentId,
          isActive: true
        }
      }),

      // Recent applications (last 5, filtered by department)
      prisma.leaveApplication.findMany({
        take: 5,
        where: {
          user: {
            department_id: userDepartmentId
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          leaveType: {
            select: {
              name: true
            }
          }
        }
      })
    ])

    const stats = {
      pendingApplications,
      approvedApplications,
      deniedApplications,
      totalApplications,
      facultyMembers,
      recentApplications: recentApplications.map(app => ({
        id: app.leave_application_id,
        userName: app.user.name,
        userEmail: app.user.email,
        leaveType: app.leaveType.name,
        status: app.status,
        startDate: app.startDate,
        endDate: app.endDate,
        createdAt: app.createdAt
      })),
      departmentName: currentUser?.department?.name || "All Departments"
    }

    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error("Error fetching office head dashboard stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    )
  }
}






