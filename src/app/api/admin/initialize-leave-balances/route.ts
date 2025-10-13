import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { initializeLeaveBalancesForAllUsers } from "@/lib/leave-balance-initializer"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true }
    })

    if (!user || user.role?.name !== 'Admin') {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 })
    }

    console.log('🚀 Admin initializing leave balances for all users...')

    // Use the centralized leave balance initializer
    const result = await initializeLeaveBalancesForAllUsers()
    
    if (!result.success) {
      return NextResponse.json({ 
        error: "Failed to initialize leave balances",
        details: result.userResults
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: "Leave balances initialized successfully",
      summary: {
        totalCreated: result.totalCreated,
        totalSkipped: result.totalSkipped,
        usersProcessed: result.userResults.length
      },
      userResults: result.userResults
    })

  } catch (error) {
    console.error('Error initializing leave balances:', error)
    return NextResponse.json(
      { error: "Failed to initialize leave balances" },
      { status: 500 }
    )
  }
}
