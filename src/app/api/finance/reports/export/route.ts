import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import jsPDF from 'jspdf'

// Enhanced validation schema for export parameters
const exportParamsSchema = z.object({
  type: z.enum(['summary', 'detailed', 'approval-trends', 'department-analysis', 'leave-type-analysis']).default('summary'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  department: z.string().optional(),
  leaveType: z.string().optional(),
  status: z.string().optional(),
  calendarPeriod: z.string().optional(),
  exportFormat: z.enum(['csv', 'pdf']).default('csv')
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Enhanced role-based access control
    const allowedRoles = ['Finance Department', 'Finance Officer', 'Finance Office Head', 'Admin']
    if (!session || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const params = exportParamsSchema.parse({
      type: searchParams.get('type') || 'summary',
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      department: searchParams.get('department'),
      leaveType: searchParams.get('leaveType'),
      status: searchParams.get('status'),
      calendarPeriod: searchParams.get('calendarPeriod'),
      exportFormat: searchParams.get('exportFormat') || 'csv'
    })

    // Build comprehensive filter object (same as reports route)
    const filters: any = {}
    
    if (params.startDate && params.endDate) {
      filters.appliedAt = {
        gte: new Date(params.startDate),
        lte: new Date(params.endDate)
      }
    }

    if (params.department && params.department !== 'all') {
      filters.user = {
        ...filters.user,
        department: {
          name: params.department
        }
      }
    }

    if (params.leaveType && params.leaveType !== 'all') {
      filters.leaveType = {
        name: params.leaveType
      }
    }

    if (params.status && params.status !== 'all') {
      filters.status = params.status
    }

    if (params.calendarPeriod && params.calendarPeriod !== 'all') {
      filters.calendar_period_id = parseInt(params.calendarPeriod)
    }

    // Get applications and travel orders with enhanced includes
    const applications = await prisma.leaveApplication.findMany({
      where: filters,
      include: {
        user: {
          select: {
            users_id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            department: {
              select: {
                department_id: true,
                name: true,
                category: true
              }
            },
            status: {
              select: {
                name: true
              }
            }
          }
        },
        leaveType: {
          select: {
            leave_type_id: true,
            name: true,
            description: true
          }
        },
        reviewer: {
          select: {
            name: true,
            email: true
          }
        },
        calendarPeriod: {
          select: {
            calendar_period_id: true,
            academicYear: true,
            startDate: true,
            endDate: true,
            termType: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        appliedAt: 'desc'
      }
    })

    const travelOrders = await prisma.travelOrder.findMany({
      where: filters,
      include: {
        user: {
          select: {
            users_id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            department: {
              select: {
                department_id: true,
                name: true,
                category: true
              }
            },
            status: {
              select: {
                name: true
              }
            }
          }
        },
        reviewer: {
          select: {
            name: true,
            email: true
          }
        },
        calendarPeriod: {
          select: {
            calendar_period_id: true,
            academicYear: true,
            startDate: true,
            endDate: true,
            termType: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        appliedAt: 'desc'
      }
    })

    // Combine data for export
    const allApplications = [
      ...applications.map(app => ({ ...app, type: 'leave' })),
      ...travelOrders.map(order => ({ ...order, type: 'travel' }))
    ]

    if (params.exportFormat === 'csv') {
      return generateCSVExport(allApplications, params)
    } else if (params.exportFormat === 'pdf') {
      return generatePDFExport(allApplications, params)
    }

    return NextResponse.json({ error: "Invalid export format" }, { status: 400 })

  } catch (error) {
    console.error("Error exporting finance report:", error)
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 }
    )
  }
}

function generateCSVExport(applications: any[], params: any) {
  // Create CSV headers with professional formatting
  const headers = [
    'School ID',
    'Name',
    'Department',
    'Type of Leave',
    'Application Type',
    'Status',
    'Start Date',
    'End Date',
    'Number of Days',
    'Applied Date',
    'Reviewed Date',
    'Reviewer',
    'Reason/Purpose',
    'Total Cost',
    'Transportation Fee',
    'Seminar/Conference Fee',
    'Meals & Accommodations'
  ]

  // Convert data to CSV format
  const csvData = applications.map(app => [
    app.user.users_id,
    app.user.name,
    app.user.department?.name || 'Not assigned',
    app.type === 'leave' ? (app.leaveType?.name || 'Unknown') : 'Travel Order',
    app.type === 'leave' ? 'Leave Application' : 'Travel Order',
    app.status,
    app.startDate ? new Date(app.startDate).toLocaleDateString() : (app.dateOfTravel ? new Date(app.dateOfTravel).toLocaleDateString() : ''),
    app.endDate ? new Date(app.endDate).toLocaleDateString() : (app.expectedReturn ? new Date(app.expectedReturn).toLocaleDateString() : ''),
    app.numberOfDays || calculateDaysDifference(app.dateOfTravel, app.expectedReturn),
    new Date(app.appliedAt).toLocaleDateString(),
    app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : '',
    app.reviewer?.name || '',
    app.reason || app.purpose || '',
    app.type === 'travel' ? app.totalCashRequested : '',
    app.type === 'travel' ? app.transportationFee : '',
    app.type === 'travel' ? app.seminarConferenceFee : '',
    app.type === 'travel' ? app.mealsAccommodations : ''
  ])

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.map(field => `"${field}"`).join(','))
  ].join('\n')

  // Add BOM for proper UTF-8 encoding
  const csvWithBOM = '\uFEFF' + csvContent

  return new NextResponse(csvWithBOM, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="finance-report-${params.type}-${new Date().toISOString().split('T')[0]}.csv"`
    }
  })
}

function generatePDFExport(applications: any[], params: any) {
  try {
    // Create new PDF document
    const doc = new jsPDF('landscape', 'mm', 'a4')
    
    // Set up colors
    const primaryColor = [37, 99, 235] // Blue
    const secondaryColor = [107, 114, 128] // Gray
    const successColor = [16, 185, 129] // Green
    const warningColor = [245, 158, 11] // Orange
    const dangerColor = [239, 68, 68] // Red
    
    // Add header
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, 297, 20, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Finance Report', 20, 12)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 200, 12)
    doc.text(`Total Records: ${applications.length}`, 250, 12)
    
    // Add summary statistics
    const totalApplications = applications.length
    const approvedApplications = applications.filter(app => app.status === 'APPROVED').length
    const pendingApplications = applications.filter(app => ['PENDING', 'DEAN_APPROVED'].includes(app.status)).length
    const deniedApplications = applications.filter(app => app.status === 'DENIED').length
    const approvalRate = totalApplications > 0 ? ((approvedApplications / totalApplications) * 100).toFixed(1) : 0
    
    // Summary box
    doc.setFillColor(248, 250, 252)
    doc.rect(20, 30, 257, 25, 'F')
    doc.setDrawColor(229, 231, 235)
    doc.rect(20, 30, 257, 25, 'S')
    
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Summary Statistics', 25, 40)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total: ${totalApplications}`, 25, 48)
    doc.text(`Approved: ${approvedApplications}`, 80, 48)
    doc.text(`Pending: ${pendingApplications}`, 130, 48)
    doc.text(`Denied: ${deniedApplications}`, 180, 48)
    doc.text(`Approval Rate: ${approvalRate}%`, 230, 48)
    
    // Add table headers
    const startY = 65
    const colWidths = [25, 40, 30, 25, 25, 20, 25, 25, 15, 25, 30]
    const headers = ['ID', 'Name', 'Department', 'Leave Type', 'Type', 'Status', 'Start Date', 'End Date', 'Days', 'Applied', 'Reviewer']
    
    doc.setFillColor(...primaryColor)
    doc.rect(20, startY, 257, 8, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    
    let currentX = 22
    headers.forEach((header, index) => {
      doc.text(header, currentX, startY + 6)
      currentX += colWidths[index]
    })
    
    // Add table data
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    
    let currentY = startY + 10
    const maxRowsPerPage = 15
    let rowCount = 0
    
    applications.forEach((app, index) => {
      if (rowCount >= maxRowsPerPage) {
        doc.addPage()
        currentY = 20
        rowCount = 0
        
        // Redraw headers on new page
        doc.setFillColor(...primaryColor)
        doc.rect(20, currentY - 10, 257, 8, 'F')
        
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        
        currentX = 22
        headers.forEach((header, headerIndex) => {
          doc.text(header, currentX, currentY - 4)
          currentX += colWidths[headerIndex]
        })
        
        currentY += 10
      }
      
      // Alternate row colors
      if (rowCount % 2 === 0) {
        doc.setFillColor(249, 250, 251)
        doc.rect(20, currentY - 2, 257, 6, 'F')
      }
      
      const rowData = [
        app.user.users_id || '',
        app.user.name || '',
        app.user.department?.name || 'Not assigned',
        app.type === 'leave' ? (app.leaveType?.name || 'Unknown') : 'Travel Order',
        app.type === 'leave' ? 'Leave' : 'Travel',
        app.status || '',
        app.startDate ? new Date(app.startDate).toLocaleDateString() : (app.dateOfTravel ? new Date(app.dateOfTravel).toLocaleDateString() : ''),
        app.endDate ? new Date(app.endDate).toLocaleDateString() : (app.expectedReturn ? new Date(app.expectedReturn).toLocaleDateString() : ''),
        app.numberOfDays || calculateDaysDifference(app.dateOfTravel, app.expectedReturn),
        new Date(app.appliedAt).toLocaleDateString(),
        app.reviewer?.name || ''
      ]
      
      currentX = 22
      rowData.forEach((data, dataIndex) => {
        const text = String(data).substring(0, colWidths[dataIndex] / 2) // Truncate long text
        doc.text(text, currentX, currentY + 2)
        currentX += colWidths[dataIndex]
      })
      
      currentY += 6
      rowCount++
    })
    
    // Add footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setTextColor(107, 114, 128)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(`Page ${i} of ${pageCount}`, 20, 200)
      doc.text('Generated by OALASS Finance Reporting System', 200, 200)
    }
    
    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer')
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="finance-report-${params.type}-${new Date().toISOString().split('T')[0]}.pdf"`
      }
    })
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    return new NextResponse('Error generating PDF', { status: 500 })
  }
}


function calculateDaysDifference(startDate: Date, endDate: Date) {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
}
