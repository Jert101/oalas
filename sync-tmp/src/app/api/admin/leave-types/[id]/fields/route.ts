import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const leaveTypeId = parseInt(params.id)
    if (isNaN(leaveTypeId)) {
      return NextResponse.json({ error: "Invalid leave type ID" }, { status: 400 })
    }

    // Check if leave type exists
    const leaveType = await prisma.leave_types.findUnique({
      where: { leave_type_id: leaveTypeId }
    })

    if (!leaveType) {
      return NextResponse.json({ error: "Leave type not found" }, { status: 404 })
    }

    // Get form fields for this leave type
    const formFields = await prisma.leaveTypeFormField.findMany({
      where: { leave_type_id: leaveTypeId },
      orderBy: { displayOrder: 'asc' }
    })

    console.log(`Found ${formFields.length} fields for leave type ${leaveTypeId}:`, formFields)

    return NextResponse.json({
      leaveType,
      formFields
    })
  } catch (error) {
    console.error("Error fetching leave type form fields:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const leaveTypeId = parseInt(params.id)
    if (isNaN(leaveTypeId)) {
      return NextResponse.json({ error: "Invalid leave type ID" }, { status: 400 })
    }

    const { formFields } = await req.json()
    if (!Array.isArray(formFields)) {
      return NextResponse.json({ error: "Form fields must be an array" }, { status: 400 })
    }

    // Check if leave type exists
    const leaveType = await prisma.leave_types.findUnique({
      where: { leave_type_id: leaveTypeId }
    })

    if (!leaveType) {
      return NextResponse.json({ error: "Leave type not found" }, { status: 404 })
    }

    // Delete existing form fields for this leave type
    await prisma.leaveTypeFormField.deleteMany({
      where: { leave_type_id: leaveTypeId }
    })

    // Create new form fields
    const createdFields = await Promise.all(
      formFields.map((field: any, index: number) => {
        return prisma.leaveTypeFormField.create({
          data: {
            leave_type_id: leaveTypeId,
            fieldName: field.fieldName,
            fieldLabel: field.fieldLabel,
            fieldType: field.fieldType,
            isRequired: field.isRequired || false,
            placeholder: field.placeholder || null,
            helpText: field.helpText || null,
            options: field.options ? JSON.stringify(field.options) : null,
            validation: field.validation ? JSON.stringify(field.validation) : null,
            displayOrder: field.displayOrder || index,
            isActive: field.isActive !== false // default to true
          }
        })
      })
    )

    return NextResponse.json({
      message: "Form fields updated successfully",
      formFields: createdFields
    })
  } catch (error) {
    console.error("Error updating leave type form fields:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
