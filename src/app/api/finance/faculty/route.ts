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

    // Get all faculty members with their statistics
    const faculty = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          name: {
            in: ['Teacher/Instructor', 'Non Teaching Personnel', 'Department Head', 'Dean/Program Head']
          }
        }
      },
      include: {
        department: {
          select: {
            name: true
          }
        },
        role: {
          select: {
            name: true
          }
        },
        leaveApplications: {
          include: {
            leave_types: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            appliedAt: 'desc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Calculate statistics for each faculty member
    const facultyStats = faculty.map(member => {
      const totalApplications = member.leaveApplications.length
      const approvedApplications = member.leaveApplications.filter(app => app.status === 'APPROVED').length
      const pendingApplications = member.leaveApplications.filter(app => app.status === 'PENDING' || app.status === 'DEAN_APPROVED').length
      const deniedApplications = member.leaveApplications.filter(app => app.status === 'DENIED').length

      return {
        users_id: member.users_id,
        name: member.name,
        email: member.email,
        profilePicture: member.profilePicture,
        department: member.department?.name || 'Not assigned',
        role: member.role?.name || 'Unknown',
        isActive: member.isActive,
        isDepartmentHead: member.isDepartmentHead,
        totalApplications,
        approvedApplications,
        pendingApplications,
        deniedApplications,
        recentApplications: member.leaveApplications.slice(0, 3).map(app => ({
          leave_application_id: app.leave_application_id,
          leaveType: app.leave_types?.name || 'Unknown',
          status: app.status,
          startDate: app.startDate,
          endDate: app.endDate,
          appliedAt: app.appliedAt
        }))
      }
    })

    // Calculate overall summary
    const summary = {
      totalFaculty: faculty.length,
      totalApplications: facultyStats.reduce((sum, member) => sum + member.totalApplications, 0),
      approvedApplications: facultyStats.reduce((sum, member) => sum + member.approvedApplications, 0),
      pendingApplications: facultyStats.reduce((sum, member) => sum + member.pendingApplications, 0),
      deniedApplications: facultyStats.reduce((sum, member) => sum + member.deniedApplications, 0),
      byRole: facultyStats.reduce((acc, member) => {
        const role = member.role
        if (!acc[role]) {
          acc[role] = { count: 0, applications: 0 }
        }
        acc[role].count++
        acc[role].applications += member.totalApplications
        return acc
      }, {} as Record<string, { count: number; applications: number }>),
      byDepartment: facultyStats.reduce((acc, member) => {
        const dept = member.department
        if (!acc[dept]) {
          acc[dept] = { count: 0, applications: 0 }
        }
        acc[dept].count++
        acc[dept].applications += member.totalApplications
        return acc
      }, {} as Record<string, { count: number; applications: number }>)
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        faculty: facultyStats,
        summary
      }
    })
  } catch (error) {
    console.error("Error fetching finance faculty:", error)
    return NextResponse.json(
      { error: "Failed to fetch faculty data" },
      { status: 500 }
    )
  }
}
