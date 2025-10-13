import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const bodySchema = z.object({
  email: z.string().email(),
  schoolId: z.string().min(3),
  department: z.string().transform(val => val === "" ? undefined : val).optional(), // Convert empty string to undefined
  role: z.string().regex(/^\d+$/, "Invalid role"),
  probationStatus: z.string().regex(/^\d+$/, "Invalid status"), // Changed to accept status ID
  isOfficeHead: z.boolean().optional(),
  displayName: z.string().optional(),
  picture: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  birthday: z.string().optional(),
  address: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const session = await getServerSession(authOptions)
    const sessionUser: any = (session as any)?.user || {}
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid data" }, { status: 400 })
    }
    const { email, schoolId, department, role, probationStatus, isOfficeHead, displayName, picture, gender, phone, birthday, address } = parsed.data
    // Enhanced profile picture resolution
    let resolvedPicture = null
    
    // Priority 1: Picture from form submission
    if (typeof picture !== "undefined" && picture !== "") {
      resolvedPicture = picture
      console.log("[setup-request] Using picture from form:", resolvedPicture)
    }
    // Priority 2: Picture from session
    else if (sessionUser.profilePicture || sessionUser.image) {
      resolvedPicture = sessionUser.profilePicture || sessionUser.image
      console.log("[setup-request] Using picture from session:", resolvedPicture)
    }
    // Priority 3: Try to fetch from Google People API if we have access token
    else {
      const accessToken = (session as any)?.accessToken as string | undefined
      console.log("[setup-request] Attempting to fetch picture from Google People API, access token:", !!accessToken)
      
      if (accessToken) {
        try {
          const resp = await fetch("https://people.googleapis.com/v1/people/me?personFields=photos", {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: "no-store",
          })
          if (resp.ok) {
            const p = await resp.json()
            resolvedPicture = p?.photos?.[0]?.url || null
            console.log("[setup-request] Fetched picture from Google People API:", resolvedPicture)
          } else {
            console.warn("[setup-request] Google People API failed:", resp.status, resp.statusText)
          }
        } catch (e) {
          console.warn("[setup-request] Google People API fetch failed:", e)
        }
      }
    }
    
    // If still no picture, leave as null; do not force a default image
    
    const resolvedDisplayName = (typeof displayName !== "undefined" && displayName !== "") ? displayName : (sessionUser.name || null)
    console.log("[setup-request] Profile picture resolution:", {
      email,
      displayName: resolvedDisplayName,
      hasPicture: !!resolvedPicture,
      picture: resolvedPicture,
      formPicture: picture,
      sessionPicture: sessionUser.profilePicture || sessionUser.image,
      gender,
      phone,
      birthday,
      address
    })

    const existingUser = await prisma.user.findFirst({
      where: { OR: [ { users_id: schoolId }, { email } ] }
    })
    if (existingUser) {
      return NextResponse.json({ error: "School ID or email already exists" }, { status: 400 })
    }

    // Create user directly instead of setup request
    console.log("[setup-request] Creating user with profile picture:", resolvedPicture)
    
    const user = await prisma.user.create({
      data: {
        users_id: schoolId,
        email,
        name: resolvedDisplayName || email.split('@')[0],
        firstName: resolvedDisplayName ? resolvedDisplayName.split(' ')[0] : null,
        lastName: resolvedDisplayName ? resolvedDisplayName.split(' ').slice(-1)[0] : null,
        middleName: resolvedDisplayName && resolvedDisplayName.split(' ').length > 2 ? resolvedDisplayName.split(' ').slice(1, -1).join(' ') : null,
        profilePicture: resolvedPicture || null,
        isEmailVerified: true,
        isActive: true,
        department_id: department ? parseInt(department) : null,
        role_id: parseInt(role),
        status_id: parseInt(probationStatus),
        isDepartmentHead: isOfficeHead || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    
    console.log("[setup-request] User created successfully:", {
      users_id: user.users_id,
      email: user.email,
      name: user.name,
      profilePicture: user.profilePicture,
      hasProfilePicture: !!user.profilePicture
    })

    // Create probation record if status is probation-related
    // Check if the status is "Under Probation" (need to query the status)
    const statusRecord = await prisma.status.findUnique({
      where: { status_id: parseInt(probationStatus) }
    })
    
    if (statusRecord && (statusRecord.name === "Probation" || statusRecord.name === "Under Probation")) {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 180) // 6 months probation

      await prisma.probation.create({
        data: {
          users_id: schoolId,
          startDate,
          endDate,
          probationDays: 180,
          status: "ACTIVE",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
      
      console.log("[setup-request] Probation record created for user:", user.users_id)
    }

    // Return success with user data
    const responseData = {
      success: true, 
      userId: user.users_id,
      user: {
        users_id: user.users_id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
        role_id: user.role_id,
        department_id: user.department_id
      }
    }
    
    console.log("[setup-request] Returning response:", responseData)
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error setting up account:", error)
    const message = error instanceof Error ? error.message : "Failed to submit account setup request"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


