import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    // Simple test query
    const result = await query<RowDataPacket[][]>('SELECT 1 as test');
    return NextResponse.json({ 
      status: 'Connected to InfinityFree MySQL!',
      result 
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect to database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
