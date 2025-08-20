import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const termTypes = await prisma.termType.findMany({
      select: {
        term_type_id: true,
        name: true
      },
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(termTypes)

  } catch (error) {
    console.error('Error fetching term types:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
