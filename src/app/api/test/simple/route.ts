import { NextResponse } from "next/server"

// Simple test API route
export async function POST() {
  return NextResponse.json({ message: "Test POST works" }, { status: 200 })
}

export async function GET() {
  return NextResponse.json({ message: "Test GET works" }, { status: 200 })
}
