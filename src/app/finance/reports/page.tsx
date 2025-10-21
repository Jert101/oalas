"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  FileText, 
  Download,
  Filter,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

interface ApplicationData {
  id: string
  type: 'leave' | 'travel'
  user: {
    users_id: string
    name: string
    email: string
    department: string
    profilePicture?: string
  }
  leaveType?: string
  startDate: string
  endDate: string
  status: string
  appliedAt: string
  reviewedAt?: string
  reviewedBy?: string
  reviewer?: string
  days: number
  reason: string
  // Travel order specific fields
  destination?: string
  purpose?: string
  dateOfTravel?: string
  expectedReturn?: string
  transportationFee?: number
  seminarConferenceFee?: number
  mealsAccommodations?: number
  totalCashRequested?: number
}

interface FilterState {
  startDate: string
  endDate: string
  department: string
  leaveType: string
  status: string
  calendarPeriod: string
  applicationType: string
}

interface ReferenceData {
  departments: Array<{ department_id: number; name: string }>
  leaveTypes: Array<{ leave_type_id: number; name: string }>
  statuses: Array<{ status_id: number; name: string }>
  calendarPeriods: Array<{ calendar_period_id: number; academicYear: string; startDate: string }>
}

export default function FinanceReportsPage() {
  const [applications, setApplications] = useState<ApplicationData[]>([])
  const [filteredApplications, setFilteredApplications] = useState<ApplicationData[]>([])
  const [referenceData, setReferenceData] = useState<ReferenceData | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    department: 'all',
    leaveType: 'all',
    status: 'all',
    calendarPeriod: 'all',
    applicationType: 'all'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadReferenceData = async () => {
    try {
      const response = await fetch('/api/finance/reports/reference-data')
      if (response.ok) {
        const data = await response.json()
        setReferenceData(data)
      }
    } catch (error) {
      console.error('Error loading reference data:', error)
    }
  }

  const loadApplications = useCallback(async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        type: 'detailed',
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.department !== 'all' && { department: filters.department }),
        ...(filters.leaveType !== 'all' && { leaveType: filters.leaveType }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.calendarPeriod !== 'all' && { calendarPeriod: filters.calendarPeriod }),
        ...(filters.applicationType !== 'all' && { applicationType: filters.applicationType })
      })

      const response = await fetch(`/api/finance/reports?${queryParams}`)
      
      console.log('API Response Status:', response.status)
      console.log('API Response OK:', response.ok)
      
      if (response.status === 401) {
        console.error('Authentication required. Please login with a finance account.')
        setErrorMessage('Authentication required. Please login with a finance account.')
        setApplications([])
        setTotalCount(0)
        setTotalPages(1)
        return
      }
      
      if (response.status === 403) {
        console.error('Insufficient permissions. Finance role required.')
        setErrorMessage('Insufficient permissions. Finance role required.')
        setApplications([])
        setTotalCount(0)
        setTotalPages(1)
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        console.log('API Response Data:', data)
        setApplications(data.applications || [])
        setTotalCount(data.totalCount || 0)
        setTotalPages(Math.ceil((data.totalCount || 0) / itemsPerPage))
        setErrorMessage(null) // Clear any previous errors
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error loading applications:', response.statusText, errorData)
        setErrorMessage(`Error loading applications: ${response.statusText}`)
        setApplications([])
        setTotalCount(0)
        setTotalPages(1)
      }
    } catch (error: any) {
      console.error('Error loading applications:', error)
      setErrorMessage(`Network error: ${error?.message || 'Unknown error'}`)
      setApplications([])
      setTotalCount(0)
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, itemsPerPage, filters.startDate, filters.endDate, filters.department, filters.leaveType, filters.status, filters.calendarPeriod, filters.applicationType])

  // Load reference data on component mount
  useEffect(() => {
    loadReferenceData()
    loadApplications()
  }, [])

  // Load applications when page, itemsPerPage, or filters change
  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  // Apply filters when they change (for immediate UI feedback)
  useEffect(() => {
    applyFilters()
  }, [applications, filters])

  const applyFilters = () => {
    let filtered = [...applications]

    // Date range filter
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate)
      const endDate = new Date(filters.endDate)
      filtered = filtered.filter(app => {
        const appDate = new Date(app.appliedAt)
        return appDate >= startDate && appDate <= endDate
      })
    }

    // Department filter
    if (filters.department !== 'all') {
      filtered = filtered.filter(app => app.user.department === filters.department)
    }

    // Leave type filter - this is handled server-side, so we don't need client-side filtering
    // The server already filters by leave_type_id, so we just pass through the results

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(app => app.status === filters.status)
    }

    // Application type filter
    if (filters.applicationType !== 'all') {
      filtered = filtered.filter(app => app.type === filters.applicationType)
    }

    setFilteredApplications(filtered)
  }

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      department: 'all',
      leaveType: 'all',
      status: 'all',
      calendarPeriod: 'all',
      applicationType: 'all'
    })
  }

  const generateCSVExport = (applications: ApplicationData[]) => {
    // Create CSV headers
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
      app.user.department,
      app.type === 'leave' ? (app.leaveType || 'Unknown') : 'Travel Order',
      app.type === 'leave' ? 'Leave Application' : 'Travel Order',
      app.status,
      app.startDate ? new Date(app.startDate).toLocaleDateString() : (app.dateOfTravel ? new Date(app.dateOfTravel).toLocaleDateString() : ''),
      app.endDate ? new Date(app.endDate).toLocaleDateString() : (app.expectedReturn ? new Date(app.expectedReturn).toLocaleDateString() : ''),
      app.days,
      new Date(app.appliedAt).toLocaleDateString(),
      app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : '',
      app.reviewer || '',
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

    // Create and download file
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finance-report-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const generatePDFExport = (applications: ApplicationData[]) => {
    // For PDF generation, we'll create a simple HTML table and use browser print
    const htmlContent = generatePDFHTML(applications)
    
    // Create a new window with the HTML content
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      
      // Wait for content to load, then trigger print
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  const generatePDFHTML = (applications: ApplicationData[]) => {
    const currentDate = new Date().toLocaleDateString()
    const totalApplications = applications.length
    const approvedApplications = applications.filter(app => app.status === 'APPROVED').length
    const pendingApplications = applications.filter(app => ['PENDING', 'DEAN_APPROVED'].includes(app.status)).length
    const deniedApplications = applications.filter(app => app.status === 'DENIED').length
    const approvalRate = totalApplications > 0 ? ((approvedApplications / totalApplications) * 100).toFixed(1) : 0

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Finance Report</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0 0 0;
            color: #666;
        }
        .summary {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
        }
        .summary-item {
            text-align: center;
        }
        .summary-item .number {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
        }
        .summary-item .label {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th {
            background-color: #2563eb;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
        }
        td {
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
        }
        tr:nth-child(even) {
            background-color: #f9fafb;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Finance Report - Filtered Results</h1>
        <p>Generated on ${currentDate}</p>
        <p>Total Records: ${totalApplications}</p>
    </div>

    <div class="summary">
        <div class="summary-item">
            <div class="number">${totalApplications}</div>
            <div class="label">Total Applications</div>
        </div>
        <div class="summary-item">
            <div class="number" style="color: #10b981;">${approvedApplications}</div>
            <div class="label">Approved</div>
        </div>
        <div class="summary-item">
            <div class="number" style="color: #f59e0b;">${pendingApplications}</div>
            <div class="label">Pending</div>
        </div>
        <div class="summary-item">
            <div class="number" style="color: #ef4444;">${deniedApplications}</div>
            <div class="label">Denied</div>
        </div>
        <div class="summary-item">
            <div class="number" style="color: #8b5cf6;">${approvalRate}%</div>
            <div class="label">Approval Rate</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>School ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Type of Leave</th>
                <th>Application Type</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Applied Date</th>
                <th>Reviewer</th>
            </tr>
        </thead>
        <tbody>
            ${applications.map(app => `
                <tr>
                    <td>${app.user.users_id}</td>
                    <td>${app.user.name}</td>
                    <td>${app.user.department}</td>
                    <td>${app.type === 'leave' ? (app.leaveType || 'Unknown') : 'Travel Order'}</td>
                    <td>${app.type === 'leave' ? 'Leave Application' : 'Travel Order'}</td>
                    <td>${app.status}</td>
                    <td>${app.startDate ? new Date(app.startDate).toLocaleDateString() : (app.dateOfTravel ? new Date(app.dateOfTravel).toLocaleDateString() : '')}</td>
                    <td>${app.endDate ? new Date(app.endDate).toLocaleDateString() : (app.expectedReturn ? new Date(app.expectedReturn).toLocaleDateString() : '')}</td>
                    <td>${app.days}</td>
                    <td>${new Date(app.appliedAt).toLocaleDateString()}</td>
                    <td>${app.reviewer || ''}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="footer">
        <p>This report was generated by OALASS Finance Reporting System</p>
        <p>For questions or support, contact the system administrator</p>
    </div>
</body>
</html>
    `
  }

  const exportReport = async (format: 'csv' | 'pdf') => {
    try {
      if (format === 'csv') {
        generateCSVExport(filteredApplications)
      } else if (format === 'pdf') {
        generatePDFExport(filteredApplications)
      }
    } catch (error) {
      console.error('Error exporting report:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      'DEAN_APPROVED': { color: 'bg-blue-100 text-blue-800', label: 'Dean Approved' },
      'APPROVED': { color: 'bg-green-100 text-green-800', label: 'Approved' },
      'DENIED': { color: 'bg-red-100 text-red-800', label: 'Denied' },
      'CANCELLED': { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-100 text-gray-800', label: status }
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Financial Reports</h1>
        <p className="text-muted-foreground">
            View and manage leave applications and travel orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          {filteredApplications.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => exportReport('csv')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => exportReport('pdf')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>

              {/* Department Filter */}
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={filters.department} onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {referenceData?.departments.map(dept => (
                      <SelectItem key={dept.department_id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Leave Type Filter */}
              <div className="space-y-2">
                <Label>Leave Type</Label>
                <Select value={filters.leaveType} onValueChange={(value) => setFilters(prev => ({ ...prev, leaveType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Leave Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leave Types</SelectItem>
                    {referenceData?.leaveTypes.map(type => (
                      <SelectItem key={type.leave_type_id} value={type.leave_type_id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="Travel Order">Travel Orders</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="DEAN_APPROVED">Dean Approved</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="DENIED">Denied</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Application Type Filter */}
              <div className="space-y-2">
                <Label>Application Type</Label>
                <Select value={filters.applicationType} onValueChange={(value) => setFilters(prev => ({ ...prev, applicationType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="leave">Leave Applications</SelectItem>
                    <SelectItem value="travel">Travel Orders</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Clear All Filters
            </Button>
              <div className="text-sm text-muted-foreground">
                Showing {filteredApplications.length} of {applications.length} applications
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications Table */}
        <Card>
          <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Applications ({totalCount} total)
            </CardTitle>
            <Button 
              variant="outline"
              onClick={loadApplications}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Download className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Refresh
            </Button>
      </div>
          </CardHeader>
          <CardContent>
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Error</span>
                </div>
              <p className="text-red-700 mt-1">{errorMessage}</p>
              {errorMessage.includes('Authentication') && (
                <div className="mt-2">
                  <p className="text-sm text-red-600">
                    Please login with a finance account:
                  </p>
                  <ul className="text-sm text-red-600 ml-4 mt-1">
                    <li>• Email: finance.officer@ckcm.edu</li>
                    <li>• Password: password123</li>
                  </ul>
                </div>
              )}
                </div>
          )}
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Download className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading applications...</span>
                </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-500 mb-6">
                {applications.length === 0 
                  ? "No applications in the system yet. Try refreshing or check your database."
                  : "No applications match your current filters. Try adjusting your filter criteria."
                }
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={loadApplications} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Refresh Data
                </Button>
                {applications.length > 0 && (
                  <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <Badge variant={app.type === 'leave' ? 'default' : 'secondary'}>
                            {app.type === 'leave' ? 'Leave' : 'Travel'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={app.user.profilePicture} alt={app.user.name} />
                              <AvatarFallback className="text-xs">
                                {app.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{app.user.name}</div>
                              <div className="text-sm text-muted-foreground">{app.user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{app.user.department}</TableCell>
                        <TableCell>
                          {app.type === 'travel' ? (
                <div>
                              <div className="font-medium">{app.destination}</div>
                              <div className="text-sm text-muted-foreground">{app.purpose}</div>
                            </div>
                          ) : (
                            app.leaveType || 'N/A'
                          )}
                        </TableCell>
                        <TableCell>{formatDate(app.startDate)}</TableCell>
                        <TableCell>{formatDate(app.endDate)}</TableCell>
                        <TableCell>{app.days}</TableCell>
                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                        <TableCell>{formatDate(app.appliedAt)}</TableCell>
                        <TableCell>
                          {app.type === 'travel' && app.totalCashRequested ? (
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(app.totalCashRequested)}</div>
                              {app.transportationFee && (
                                <div className="text-xs text-muted-foreground">
                                  Trans: {formatCurrency(app.transportationFee)}
                        </div>
                              )}
                      </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} applications
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="items-per-page" className="text-sm">Show:</Label>
                      <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => {
                          setItemsPerPage(parseInt(value))
                          setCurrentPage(1) // Reset to first page when changing items per page
                        }}
                      >
                        <SelectTrigger id="items-per-page" className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                          <SelectItem value="40">40</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            disabled={isLoading}
                          >
                            {page}
                          </Button>
                        )
                      })}
                </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || isLoading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          </CardContent>
        </Card>
    </div>
  )
}