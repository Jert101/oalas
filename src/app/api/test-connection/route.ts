import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    const result = await query<RowDataPacket[][]>('SELECT 1 as test');
    return NextResponse.json({ status: 'Connected', result });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to database' },
      { status: 500 }
    );
  }
}
