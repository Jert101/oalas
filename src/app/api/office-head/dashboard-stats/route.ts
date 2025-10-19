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
      console.log("[DeanStats] Access denied for role:", userRole, "isDepartmentHead:", isDepartmentHead)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.log("[DeanStats] Access granted for role:", userRole, "isDepartmentHead:", isDepartmentHead)

    // Get the user's data (dean, department head, or office head)
    const currentUser = await prisma.user.findFirst({
      where: { 
        users_id: session.user.id
      },
      include: {
        department: true,
        role: true
      }
    })

    // For office heads without departments, return basic stats for all departments
    // For deans/department heads, filter by their department
    const userDepartmentId = currentUser?.department?.department_id
    
    console.log("[DeanStats] User department:", {
      userId: currentUser?.users_id,
      role: currentUser?.role?.name,
      departmentId: userDepartmentId,
      departmentName: currentUser?.department?.name
    })

    // Fetch dean-specific statistics
    const [
      pendingApplications,
      approvedApplications,
      deniedApplications,
      totalApplications,
      facultyMembers,
      recentApplications
    ] = await Promise.all([
      // Pending applications (filtered by department if user has one)
      prisma.leaveApplication.count({
        where: {
          status: "PENDING",
          ...(userDepartmentId && {
            user: {
              department_id: userDepartmentId
            }
          })
        }
      }),

      // Approved applications (filtered by department if user has one)
      prisma.leaveApplication.count({
        where: {
          status: "APPROVED",
          ...(userDepartmentId && {
            user: {
              department_id: userDepartmentId
            }
          })
        }
      }),

      // Denied applications (filtered by department if user has one)
      prisma.leaveApplication.count({
        where: {
          status: "DENIED",
          ...(userDepartmentId && {
            user: {
              department_id: userDepartmentId
            }
          })
        }
      }),

      // Total applications (filtered by department if user has one)
      prisma.leaveApplication.count({
        where: {
          ...(userDepartmentId && {
            user: {
              department_id: userDepartmentId
            }
          })
        }
      }),

      // Faculty members (filtered by department if user has one)
      prisma.user.count({
        where: {
          ...(userDepartmentId && { department_id: userDepartmentId }),
          isActive: true,
          role: {
            name: "Teacher/Instructor"
          }
        }
      }),

      // Recent applications (last 5, filtered by department if user has one)
      prisma.leaveApplication.findMany({
        take: 5,
        where: {
          ...(userDepartmentId && {
            user: {
              department_id: userDepartmentId
            }
          })
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
    console.error("Error fetching dean dashboard stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    )
  }
}






