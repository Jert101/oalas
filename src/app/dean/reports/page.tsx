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
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Filter,
  ChevronLeft,
  ChevronRight,
  XCircle
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
  // Calendar period information
  calendarPeriod?: {
    calendar_period_id: number
    academicYear: string
    startDate: string
    endDate: string
    termType?: {
      name: string
    }
  }
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

export default function DeanReportsPage() {
  console.log('🚀 DEAN REPORTS PAGE LOADED')
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
      console.log('🔍 Loading reference data...')
      const response = await fetch('/api/dean/reports/reference-data')
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 Reference data loaded:', data)
        setReferenceData(data)
      } else {
        console.error('🔍 Failed to load reference data:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error loading reference data:', error)
    }
  }

  const loadApplications = useCallback(async () => {
    console.log('🔍 loadApplications called with filters:', filters)
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

      const response = await fetch(`/api/dean/reports?${queryParams}`)
      
      if (response.status === 401) {
        setErrorMessage('Authentication required. Please login with a dean account.')
        setApplications([])
        setTotalCount(0)
        setTotalPages(1)
        return
      }
      
      if (response.status === 403) {
        setErrorMessage('Access denied. You do not have permission to view reports.')
        setApplications([])
        setTotalCount(0)
        setTotalPages(1)
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 Applications loaded:', data)
        console.log('🔍 First application calendar period:', data.applications?.[0]?.calendarPeriod)
        setApplications(data.applications || [])
        setTotalCount(data.totalCount || 0)
        setTotalPages(Math.ceil((data.totalCount || 0) / itemsPerPage))
        setErrorMessage(null)
      } else {
        setErrorMessage(`Error loading applications: ${response.statusText}`)
        setApplications([])
        setTotalCount(0)
        setTotalPages(1)
      }
    } catch (error: any) {
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
    console.log('🔍 useEffect called - loading reference data')
    loadReferenceData()
  }, [])

  // Load applications when filters change
  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  // Apply client-side filters
  useEffect(() => {
    let filtered = [...applications]

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(app => app.status === filters.status)
    }

    // Type filter
    if (filters.applicationType !== 'all') {
      filtered = filtered.filter(app => app.type === filters.applicationType)
    }

    setFilteredApplications(filtered)
  }, [applications, filters.status, filters.applicationType])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'APPROVED': { color: 'bg-green-100 text-green-800', label: 'Approved', icon: '✓' },
      'DENIED': { color: 'bg-red-100 text-red-800', label: 'Denied', icon: '✗' },
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: '⏳' },
      'DEAN_APPROVED': { color: 'bg-blue-100 text-blue-800', label: 'Dean Approved', icon: '✓' },
      'DEAN_REJECTED': { color: 'bg-orange-100 text-orange-800', label: 'Dean Rejected', icon: '✗' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    
    return (
      <Badge className={config.color}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const getAcademicYearFromApplication = (app: ApplicationData) => {
    // Use the calendar period's academic year if available, otherwise fall back to date calculation
    if (app.calendarPeriod?.academicYear) {
      return app.calendarPeriod.academicYear
    }
    
    // Fallback to date calculation if calendar period is not available
    const date = new Date(app.appliedAt)
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // 0-based month
    
    if (month >= 6) {
      return `${year}-${year + 1}`
    } else {
      return `${year - 1}-${year}`
    }
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

  const generateCSVExport = (applications: ApplicationData[]) => {
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
      'Academic Year',
      'Reviewed Date',
      'Reviewer',
      'Reason/Purpose',
      'Total Cost',
      'Transportation Fee',
      'Seminar/Conference Fee',
      'Meals & Accommodations'
    ]

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
        app.calendarPeriod?.academicYear || 'N/A',
        app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : '',
        app.reviewedBy || '',
        app.reason || app.purpose || '',
        app.type === 'travel' ? app.totalCashRequested : '',
        app.type === 'travel' ? app.transportationFee : '',
        app.type === 'travel' ? app.seminarConferenceFee : '',
        app.type === 'travel' ? app.mealsAccommodations : ''
      ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n')

    const csvWithBOM = '\uFEFF' + csvContent
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dean-department-report-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const generatePDFExport = (applications: ApplicationData[]) => {
    const htmlContent = generatePDFHTML(applications)
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  const generatePDFHTML = (applications: ApplicationData[]) => {
    const currentDate = new Date().toLocaleDateString()
    const totalApplications = applications.length
    const approvedApplications = applications.filter(app => app.status === 'APPROVED').length
    const deniedApplications = applications.filter(app => app.status === 'DENIED').length
    const pendingApplications = applications.filter(app => app.status === 'PENDING').length

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Dean Department Report</title>
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
    </style>
</head>
<body>
    <div class="header">
        <h1>Dean Department Report</h1>
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
            <div class="number" style="color: #ef4444;">${deniedApplications}</div>
            <div class="label">Denied</div>
        </div>
        <div class="summary-item">
            <div class="number" style="color: #f59e0b;">${pendingApplications}</div>
            <div class="label">Pending</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>School ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Type</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Applied Date</th>
                <th>Academic Year</th>
            </tr>
        </thead>
        <tbody>
            ${applications.map(app => `
                <tr>
                    <td>${app.user.users_id}</td>
                    <td>${app.user.name}</td>
                    <td>${app.user.department}</td>
                    <td>${app.type === 'leave' ? 'Leave' : 'Travel'}</td>
                    <td>${app.status}</td>
                    <td>${app.startDate ? new Date(app.startDate).toLocaleDateString() : ''}</td>
                    <td>${app.endDate ? new Date(app.endDate).toLocaleDateString() : ''}</td>
                    <td>${app.days}</td>
                    <td>${new Date(app.appliedAt).toLocaleDateString()}</td>
                    <td>${app.calendarPeriod?.academicYear || 'N/A'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>
    `
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Department Analytics</h1>
          <p className="text-muted-foreground">
            Track and analyze leave applications and travel orders from your department
          </p>
        </div>
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
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-red-700 mt-1">{errorMessage}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              Department applications
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {filteredApplications.filter(app => app.status === 'PENDING').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting your review
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dean Approved</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filteredApplications.filter(app => app.status === 'DEAN_APPROVED').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Approved by you
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dean Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filteredApplications.filter(app => app.status === 'DEAN_REJECTED').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Rejected by you
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Department Filters
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="start-date">Application Date From</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end-date">Application Date To</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="leave-type">Leave Type</Label>
                <Select
                  value={filters.leaveType}
                  onValueChange={(value) => {
                    console.log('🔍 Leave type filter changed to:', value)
                    setFilters(prev => ({ ...prev, leaveType: value }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leave Types</SelectItem>
                    {(() => {
                      console.log('🔍 Rendering leave types dropdown, referenceData:', referenceData)
                      console.log('🔍 leaveTypes:', referenceData?.leaveTypes)
                      return referenceData?.leaveTypes ? (
                        referenceData.leaveTypes.map((type) => (
                          <SelectItem key={type.leave_type_id} value={type.leave_type_id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="loading" disabled>Loading leave types...</SelectItem>
                      )
                    })()}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Application Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending Review</SelectItem>
                    <SelectItem value="DEAN_APPROVED">Dean Approved</SelectItem>
                    <SelectItem value="DEAN_REJECTED">Dean Rejected</SelectItem>
                    <SelectItem value="APPROVED">Finance Approved</SelectItem>
                    <SelectItem value="DENIED">Finance Denied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="calendar-period">Academic Period</Label>
                <Select
                  value={filters.calendarPeriod}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, calendarPeriod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Periods</SelectItem>
                    {referenceData?.calendarPeriods ? (
                      referenceData.calendarPeriods.map((period) => (
                        <SelectItem key={period.calendar_period_id} value={period.calendar_period_id.toString()}>
                          {period.academicYear}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>Loading periods...</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="application-type">Application Type</Label>
                <Select
                  value={filters.applicationType}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, applicationType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="leave">Leave Applications</SelectItem>
                    <SelectItem value="travel">Travel Orders</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> These filters show applications from your department only. 
                Use the status filter to see applications at different stages of the approval process.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Department Applications ({filteredApplications.length} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Loading applications...</span>
              </div>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-500">
                {errorMessage ? "Please check your authentication or try refreshing." : "No applications have been submitted in your department yet."}
              </p>
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
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Reviewed Date</TableHead>
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
                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                        <TableCell>{formatDate(app.startDate)}</TableCell>
                        <TableCell>{formatDate(app.endDate)}</TableCell>
                        <TableCell>{app.days}</TableCell>
                        <TableCell>{formatDate(app.appliedAt)}</TableCell>
                        <TableCell>{app.reviewedAt ? formatDate(app.reviewedAt) : '-'}</TableCell>
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
                          setCurrentPage(1)
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