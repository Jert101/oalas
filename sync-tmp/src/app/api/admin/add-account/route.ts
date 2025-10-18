import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Function to generate custom user ID in format YYMM001
async function generateCustomUserId(): Promise<string> {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2) // Last 2 digits of year
  const month = (now.getMonth() + 1).toString().padStart(2, '0') // Month with leading zero
  
  const prefix = `${year}${month}`
  
  // Find the highest number for this year-month combination
  const existingUsers = await prisma.user.findMany({
    where: {
      users_id: {
        startsWith: prefix
      }
    },
    select: {
      users_id: true
    },
    orderBy: {
      users_id: 'desc'
    }
  })
  
  let nextNumber = 1
  if (existingUsers.length > 0 && existingUsers[0].users_id) {
    const lastCustomId = existingUsers[0].users_id
    const lastNumber = parseInt(lastCustomId.slice(-3)) // Get last 3 digits
    nextNumber = lastNumber + 1
  }
  
  const numberSuffix = nextNumber.toString().padStart(3, '0') // 3 digits with leading zeros
  return `${prefix}${numberSuffix}`
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const data = await request.json()
    
    // Extract form data
    const {
      firstName,
      lastName,
      middleName,
      suffix,
      email,
      role_id,
      department_id,
      isDepartmentHead,
      status_id,
      password,
      profilePicture
    } = data

    // Validate required fields
    if (!firstName || !lastName || !email || !role_id || !status_id || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate role_id and status_id are numbers
    const roleId = parseInt(role_id)
    const statusId = parseInt(status_id)
    
    if (isNaN(roleId) || isNaN(statusId)) {
      return NextResponse.json(
        { error: "Invalid role or status ID" },
        { status: 400 }
      )
    }

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Verify role and status exist
    const [role, status] = await Promise.all([
      prisma.role.findUnique({ where: { role_id: roleId } }),
      prisma.status.findUnique({ where: { status_id: statusId } })
    ])

    if (!role) {
      return NextResponse.json(
        { error: "Invalid role selected" },
        { status: 400 }
      )
    }

    if (!status) {
      return NextResponse.json(
        { error: "Invalid status selected" },
        { status: 400 }
      )
    }

    // Verify department if provided
    let departmentId = null
    if (department_id && department_id !== "") {
      const deptId = parseInt(department_id)
      if (!isNaN(deptId)) {
        const department = await prisma.department.findUnique({
          where: { department_id: deptId }
        })
        if (department) {
          departmentId = deptId
        } else {
          return NextResponse.json(
            { error: "Invalid department selected" },
            { status: 400 }
          )
        }
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate custom user ID
    const customUserId = await generateCustomUserId()

    // Create full name
    const nameParts = [firstName, middleName, lastName, suffix].filter(Boolean)
    const fullName = nameParts.join(" ")

    // Prepare user data
    const userData = {
      users_id: customUserId,
      email,
      password: hashedPassword,
      name: fullName,
      firstName,
      lastName,
      middleName: middleName || null,
      suffix: suffix || null,
      profilePicture: profilePicture || "/ckcm.png",
      role_id: roleId,
      department_id: departmentId,
      isDepartmentHead: Boolean(isDepartmentHead), // Ensure it's a boolean
      status_id: statusId,
      isEmailVerified: true, // Admin created accounts are pre-verified
      isActive: true,
    }

    // Create user
    const newUser = await prisma.user.create({
      data: userData,
      include: {
        role: true,
        department: true,
        status: true
      }
    })

    // Return success response (without password)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: userPassword, ...userResponse } = newUser
    
    return NextResponse.json({
      message: "Account created successfully",
      user: userResponse
    })

  } catch (error) {
    console.error("Error creating account:", error)
    
    // More specific error handling
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
