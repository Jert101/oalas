import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user with role details
    const user = await prisma.user.findUnique({
      where: { email: session.user.email || '' },
      include: {
        role: true,
        department: true
      }
    })

    return NextResponse.json({
      session,
      databaseUser: {
        name: user?.name,
        email: user?.email,
        role: user?.role?.name,
        department: user?.department?.name
      }
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
