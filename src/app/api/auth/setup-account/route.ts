import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const bodySchema = z.object({
  email: z.string().email(),
  schoolId: z.string().min(3),
  department: z.string().regex(/^\d+$/, "Invalid department"),
  role: z.string().regex(/^\d+$/, "Invalid role"),
  displayName: z.string().optional(),
  picture: z.string().optional(),
  gender: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid data" }, { status: 400 })
    }
    const { email, schoolId, department, role, displayName, picture, gender } = parsed.data

    // Check if school ID or email already in use by an existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { users_id: schoolId },
          { email: email }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "School ID or email already exists" },
        { status: 400 }
      )
    }

    // If there is already a request for this email, update it. Otherwise create a new one.
    const existingRequest = await prisma.accountSetupRequest.findFirst({
      where: { email }
    })

    let setupRequest
    if (existingRequest) {
      setupRequest = await prisma.accountSetupRequest.update({
        where: { id: existingRequest.id },
        data: {
          school_id: schoolId,
          department: { connect: { department_id: parseInt(department) } },
          role: { connect: { role_id: parseInt(role) } },
          display_name: displayName,
          picture: picture || null,
          gender: gender || null,
          status: "pending",
          updated_at: new Date()
        }
      })
    } else {
      setupRequest = await prisma.accountSetupRequest.create({
        data: {
          email,
          school_id: schoolId,
          department: { connect: { department_id: parseInt(department) } },
          role: { connect: { role_id: parseInt(role) } },
          display_name: displayName,
          picture: picture || null,
          gender: gender || null,
          status: "pending",
          created_at: new Date(),
          updated_at: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: "Account setup request submitted successfully",
      requestId: setupRequest.id
    })

  } catch (error) {
    console.error("Error setting up account:", error)
    const message = error instanceof Error ? error.message : "Failed to submit account setup request"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
