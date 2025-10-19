import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Dean Leave Types API called')
    
    const session = await getServerSession(authOptions)
    console.log('Session found:', !!session)
    console.log('Session user email:', session?.user?.email)
    
    if (!session?.user?.email) {
      console.log('❌ No session or user email found')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user to verify they have access
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true }
    })

    console.log('User found:', !!user)
    if (user) {
      console.log('User details:', {
        name: user.name,
        users_id: user.users_id,
        email: user.email,
        role: user.role?.name
      })
    }

    if (!user) {
      console.log('❌ User not found in database')
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify user is an Office Head (Department Head or has isDepartmentHead flag)
    const allowedRoles = ["Department Head", "Admin"]
    const isOfficeHead = user.role && allowedRoles.includes(user.role.name)
    const hasDepartmentHeadFlag = (user as any).isDepartmentHead === true
    
    if (!isOfficeHead && !hasDepartmentHeadFlag) {
      console.log('❌ Access denied for role:', user.role?.name, 'isDepartmentHead:', hasDepartmentHeadFlag)
      return NextResponse.json({ error: "Access denied. Office Head role required." }, { status: 403 })
    }

    // Get leave types (excluding Travel Order)
    const leaveTypes = await prisma.leave_types.findMany({
      where: {
        name: {
          not: 'Travel Order'
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log('Leave types found:', leaveTypes.length)
    console.log('Leave types:', leaveTypes.map(lt => ({ id: lt.leave_type_id, name: lt.name })))

    // Return data directly as array for compatibility with dean components
    return NextResponse.json(leaveTypes)

  } catch (error) {
    console.error('Error fetching dean leave types:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
