import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const statuses = await prisma.status.findMany()
    const leaveLimits = await prisma.leaveLimit.findMany({
      include: {
        status: true
      }
    })
    
    return NextResponse.json({
      statuses,
      leaveLimits,
      statusCount: statuses.length,
      leaveLimitCount: leaveLimits.length
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Debug failed', details: error }, { status: 500 })
  }
}
