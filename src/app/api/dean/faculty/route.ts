import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('🔍 Dean Faculty API - Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userRole: (session?.user as any)?.role,
      userId: session?.user?.id
    })
    
    if (!session?.user?.email) {
      console.log('❌ No session or user email found')
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

    // Verify user is a Dean/Program Head
    console.log('🔍 Dean Faculty API - User verification:', {
      userId: user.users_id,
      userEmail: user.email,
      userName: user.name,
      roleName: user.role?.name,
      roleId: user.role?.role_id,
      departmentId: user.department_id,
      departmentName: user.department?.name
    })
    
    // Allow both Dean/Program Head and Department Head to access faculty
    const allowedRoles = ["Dean/Program Head", "Department Head"]
    if (!allowedRoles.includes(user.role?.name || "")) {
      console.log('❌ Access denied - User role:', user.role?.name, 'Expected: Dean/Program Head or Department Head')
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    
    console.log('✅ User verified as:', user.role?.name)

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














