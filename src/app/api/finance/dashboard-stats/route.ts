import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'Finance Department' && session.user.role !== 'Finance Officer' && session.user.role !== 'Finance Office Head')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch finance-specific statistics
    const [
      totalApplications,
      pendingApplications,
      deanApprovedApplications,
      approvedApplications,
      deniedApplications,
      totalDepartments,
      totalFaculty,
      recentApplications,
      applicationsByStatus,
      applicationsByDepartment
    ] = await Promise.all([
      // Total applications
      prisma.leaveApplication.count(),
      
      // Pending applications (waiting for dean approval)
      prisma.leaveApplication.count({
        where: { status: "PENDING" }
      }),
      
      // Dean approved applications (waiting for finance approval)
      prisma.leaveApplication.count({
        where: { status: "DEAN_APPROVED" }
      }),
      
      // Approved applications (approved by both dean and finance)
      prisma.leaveApplication.count({
        where: { status: "APPROVED" }
      }),
      
      // Denied applications
      prisma.leaveApplication.count({
        where: { status: "DENIED" }
      }),
      
      // Total departments
      prisma.department.count(),
      
      // Total faculty members
      prisma.user.count({
        where: {
          role: {
            name: { in: ['Teacher/Instructor', 'Non Teaching Personnel'] }
          }
        }
      }),
      
      // Recent applications (last 5)
      prisma.leaveApplication.findMany({
        take: 5,
        orderBy: {
          appliedAt: 'desc'
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              department: {
                select: {
                  name: true
                }
              }
            }
          },
          leave_types: {
            select: {
              name: true
            }
          }
        }
      }),
      
      // Applications by status
      prisma.leaveApplication.groupBy({
        by: ['status'],
        _count: {
          leave_application_id: true
        }
      }),
      
      // Applications by department
      prisma.leaveApplication.groupBy({
        by: ['user_id'],
        _count: {
          leave_application_id: true
        }
      })
    ])

    // Get department names for applications by department
    const departmentStats = await prisma.user.groupBy({
      by: ['department_id'],
      _count: {
        users_id: true
      },
      where: {
        leaveApplications: {
          some: {}
        }
      }
    })

    // Get department names
    const departmentIds = departmentStats.map(d => d.department_id).filter(Boolean)
    const departments = await prisma.department.findMany({
      where: {
        department_id: {
          in: departmentIds
        }
      },
      select: {
        department_id: true,
        name: true
      }
    })

    const departmentMap = new Map(departments.map(d => [d.department_id, d.name]))
    const applicationsByDepartmentWithNames = departmentStats.map(stat => ({
      departmentName: departmentMap.get(stat.department_id) || 'Unknown',
      count: stat._count.users_id
    }))

    const stats = {
      totalApplications,
      pendingApplications,
      deanApprovedApplications,
      approvedApplications,
      deniedApplications,
      totalDepartments,
      totalFaculty,
      recentApplications: recentApplications.map(app => ({
        id: app.leave_application_id,
        userName: app.user.name,
        userEmail: app.user.email,
        departmentName: app.user.department?.name || 'Unknown',
        leaveType: app.leave_types?.name || 'Unknown',
        status: app.status,
        startDate: app.startDate,
        endDate: app.endDate,
        appliedAt: app.appliedAt
      })),
      applicationsByStatus: applicationsByStatus.map(stat => ({
        status: stat.status,
        count: stat._count.leave_application_id
      })),
      applicationsByDepartment: applicationsByDepartmentWithNames
    }

    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error("Error fetching finance dashboard stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    )
  }
}
