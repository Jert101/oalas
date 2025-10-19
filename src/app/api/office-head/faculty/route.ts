import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user (dean)
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

    // Allow Dean/Program Head, Department Head, and office heads
    const userRole = session.user.role
    const isDepartmentHead = (session.user as any)?.isDepartmentHead
    
    const allowedRoles = ["Dean/Program Head", "Department Head", "Admin"]
    const isAllowedRole = allowedRoles.includes(userRole || "")
    const isOfficeHead = isDepartmentHead === true
    
    if (!isAllowedRole && !isOfficeHead) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    

    if (!user.department_id) {
      return NextResponse.json({ error: "User is not assigned to a department" }, { status: 400 })
    }

    // Get faculty members in the user's department
    // Include both teachers and non-teaching personnel
    const facultyMembers = await prisma.user.findMany({
      where: {
        department_id: user.department_id,
        role: {
          name: {
            in: ["Teacher/Instructor", "Non Teaching Personnel"]
          }
        },
        isActive: true,
        // Exclude the dean themselves
        users_id: {
          not: user.users_id
        }
      },
      include: {
        department: true,
        status: true,
        role: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Transform data for frontend consumption
    const transformedFaculty = facultyMembers.map(member => ({
      users_id: member.users_id,
      name: member.name,
      email: member.email,
      profilePicture: member.profilePicture || '/ckcm.png',
      status: {
        name: member.status?.name || 'Unknown'
      },
      department: {
        name: member.department?.name || 'Unknown'
      },
      role: {
        name: member.role?.name || 'Unknown'
      },
      createdAt: member.createdAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: {
        faculty: transformedFaculty,
        totalCount: transformedFaculty.length,
        department: user.department?.name,
        userRole: user.role?.name
      }
    })

  } catch (error) {
    console.error('Error fetching faculty members:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}














