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

    // Get all departments with their statistics
    const departments = await prisma.department.findMany({
      include: {
        users: {
          where: {
            isActive: true
          },
          include: {
            leaveApplications: {
              include: {
                leaveType: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Calculate statistics for each department
    const departmentStats = departments.map(dept => {
      const totalFaculty = dept.users.length
      const totalApplications = dept.users.reduce((sum, user) => sum + user.leaveApplications.length, 0)
      const approvedApplications = dept.users.reduce((sum, user) => 
        sum + user.leaveApplications.filter(app => app.status === 'APPROVED').length, 0
      )
      const pendingApplications = dept.users.reduce((sum, user) => 
        sum + user.leaveApplications.filter(app => app.status === 'PENDING' || app.status === 'DEAN_APPROVED').length, 0
      )
      const deniedApplications = dept.users.reduce((sum, user) => 
        sum + user.leaveApplications.filter(app => app.status === 'DENIED').length, 0
      )

      return {
        department_id: dept.department_id,
        name: dept.name,
        description: dept.description,
        totalFaculty,
        totalApplications,
        approvedApplications,
        pendingApplications,
        deniedApplications,
        faculty: dept.users.map(user => ({
          users_id: user.users_id,
          name: user.name,
          email: user.email,
          role: user.role?.name || 'Unknown',
          isActive: user.isActive
        }))
      }
    })

    // Calculate overall summary
    const summary = {
      totalDepartments: departments.length,
      totalFaculty: departmentStats.reduce((sum, dept) => sum + dept.totalFaculty, 0),
      totalApplications: departmentStats.reduce((sum, dept) => sum + dept.totalApplications, 0),
      approvedApplications: departmentStats.reduce((sum, dept) => sum + dept.approvedApplications, 0),
      pendingApplications: departmentStats.reduce((sum, dept) => sum + dept.pendingApplications, 0),
      deniedApplications: departmentStats.reduce((sum, dept) => sum + dept.deniedApplications, 0)
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        departments: departmentStats,
        summary
      }
    })
  } catch (error) {
    console.error("Error fetching finance departments:", error)
    return NextResponse.json(
      { error: "Failed to fetch department data" },
      { status: 500 }
    )
  }
}
