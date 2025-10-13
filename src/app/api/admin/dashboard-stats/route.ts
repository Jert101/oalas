import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Add caching headers
    const response = NextResponse
    
    // Check for cache
    const cacheKey = `admin-dashboard-stats-${session.user.users_id}`
    
    // Fetch real statistics from database with optimized queries
    const [
      totalUsers,
      totalDepartments,
      totalRoles,
      totalLeaveTypes,
      totalLeaveApplications,
      pendingLeaveApplications,
      approvedLeaveApplications,
      rejectedLeaveApplications,
      userCountByRole,
      userCountByDepartment
    ] = await Promise.all([
      // Total users
      prisma.user.count({
        where: { isActive: true }
      }),
      
      // Total departments
      prisma.department.count(),
      
      // Total roles
      prisma.role.count(),
      
             // Total leave types
       prisma.leave_types.count(),
       
       // Total leave applications
       prisma.leaveApplication.count(),
       
       // Pending leave applications
       prisma.leaveApplication.count({
         where: { status: "PENDING" }
       }),
       
       // Approved leave applications
       prisma.leaveApplication.count({
         where: { status: "APPROVED" }
       }),
       
       // Rejected leave applications
       prisma.leaveApplication.count({
         where: { status: "DENIED" }
       }),
      
      // Users by role
      prisma.user.groupBy({
        by: ['role_id'],
        _count: {
          users_id: true
        },
        where: { isActive: true }
      }),
      
      // Users by department
      prisma.user.groupBy({
        by: ['department_id'],
        _count: {
          users_id: true
        },
        where: { isActive: true }
      })
    ])

    // Get role names for better display
    const roles = await prisma.role.findMany({
      select: { role_id: true, name: true }
    })
    
    const departments = await prisma.department.findMany({
      select: { department_id: true, name: true }
    })

    // Calculate system status based on various metrics
    const systemStatus = "Online" // Can be enhanced with more checks

    // Process user count by role with role names
    const userCountByRoleWithNames = userCountByRole.map(item => {
      const role = roles.find(r => r.role_id === item.role_id)
      return {
        roleName: role?.name || 'Unknown',
        count: item._count.users_id
      }
    })

    // Process user count by department with department names
    const userCountByDepartmentWithNames = userCountByDepartment.map(item => {
      const department = departments.find(d => d.department_id === item.department_id)
      return {
        departmentName: department?.name || 'Unknown',
        count: item._count.users_id
      }
    })

    const stats = {
      totalUsers,
      totalDepartments,
      totalRoles,
      totalLeaveTypes,
      totalLeaveApplications,
      pendingLeaveApplications,
      approvedLeaveApplications,
      rejectedLeaveApplications,
      systemStatus,
      userCountByRole: userCountByRoleWithNames,
      userCountByDepartment: userCountByDepartmentWithNames,
      roles,
      departments
    }

    // Return response with caching headers
    return new NextResponse(JSON.stringify({ success: true, data: stats }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        'X-Cache-Key': cacheKey
      }
    })
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    )
  }
}
