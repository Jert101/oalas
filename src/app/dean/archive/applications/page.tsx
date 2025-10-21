"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  FileText, 
  Download,
  Archive,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  XCircle as XIcon
} from "lucide-react"

interface ArchivedApplication {
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
  status: 'APPROVED' | 'DENIED'
  appliedAt: string
  reviewedAt: string
  reviewedBy: string
  days: number
  reason: string
  calendarPeriod: {
    calendar_period_id: number
    academicYear: string
    startDate: string
    endDate: string
    termType: {
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

interface CalendarPeriod {
  calendar_period_id: number
  academicYear: string
  startDate: string
  endDate: string
  termType: {
    name: string
  }
  applicationCount: number
  approvedCount: number
  deniedCount: number
}

export default function DeanApplicationsArchivePage() {
  const [applications, setApplications] = useState<ArchivedApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<ArchivedApplication[]>([])
  const [calendarPeriods, setCalendarPeriods] = useState<CalendarPeriod[]>([])
  const [selectedCalendar, setSelectedCalendar] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadCalendarPeriods = async () => {
    try {
      const response = await fetch('/api/dean/archive/calendar-periods')
      if (response.ok) {
        const data = await response.json()
        setCalendarPeriods(data.calendarPeriods || [])
      }
    } catch (error) {
      console.error('Error loading calendar periods:', error)
    }
  }

  const loadArchivedApplications = useCallback(async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(selectedCalendar !== 'all' && { calendarPeriod: selectedCalendar }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter })
      })

      const response = await fetch(`/api/dean/archive/applications?${queryParams}`)
      
      if (response.status === 401) {
        setErrorMessage('Authentication required. Please login with a dean account.')
        setApplications([])
        setTotalCount(0)
        setTotalPages(1)
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
        setTotalCount(data.totalCount || 0)
        setTotalPages(Math.ceil((data.totalCount || 0) / itemsPerPage))
        setErrorMessage(null)
      } else {
        setErrorMessage(`Error loading archived applications: ${response.statusText}`)
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
  }, [currentPage, itemsPerPage, selectedCalendar, statusFilter, typeFilter])

  // Load calendar periods on component mount
  useEffect(() => {
    loadCalendarPeriods()
  }, [])

  // Load applications when filters change
  useEffect(() => {
    loadArchivedApplications()
  }, [loadArchivedApplications])

  // Apply client-side filters
  useEffect(() => {
    let filtered = [...applications]

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(app => app.type === typeFilter)
    }

    setFilteredApplications(filtered)
  }, [applications, statusFilter, typeFilter])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'APPROVED': { color: 'bg-green-100 text-green-800', label: 'Approved', icon: CheckCircle },
      'DENIED': { color: 'bg-red-100 text-red-800', label: 'Denied', icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    
    const Icon = config.icon
		return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
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

  const exportArchivedApplications = async (format: 'csv' | 'pdf') => {
    try {
      if (format === 'csv') {
        generateCSVExport(filteredApplications)
      } else if (format === 'pdf') {
        generatePDFExport(filteredApplications)
      }
    } catch (error) {
      console.error('Error exporting archived applications:', error)
    }
  }

  const generateCSVExport = (applications: ArchivedApplication[]) => {
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
      'Academic Year',
      'Term Type',
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
      new Date(app.reviewedAt).toLocaleDateString(),
      app.reviewedBy,
      app.reason || app.purpose || '',
      app.calendarPeriod.academicYear,
      app.calendarPeriod.termType.name,
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
    a.download = `dean-archived-applications-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const generatePDFExport = (applications: ArchivedApplication[]) => {
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

  const generatePDFHTML = (applications: ArchivedApplication[]) => {
    const currentDate = new Date().toLocaleDateString()
    const totalApplications = applications.length
    const approvedApplications = applications.filter(app => app.status === 'APPROVED').length
    const deniedApplications = applications.filter(app => app.status === 'DENIED').length

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Dean Archived Applications Report</title>
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
        <h1>Dean Archived Applications Report</h1>
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
                <th>Reviewed Date</th>
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
                    <td>${new Date(app.reviewedAt).toLocaleDateString()}</td>
                    <td>${app.calendarPeriod.academicYear}</td>
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
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Department Archive</h1>
          <p className="text-muted-foreground">
            Historical view of approved and denied applications from your department organized by academic calendar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportArchivedApplications('csv')}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => exportArchivedApplications('pdf')}
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
            <XIcon className="h-5 w-5" />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-red-700 mt-1">{errorMessage}</p>
        </div>
      )}

      {/* Calendar Periods Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {calendarPeriods.map((period) => (
          <Card key={period.calendar_period_id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {period.academicYear}
							</CardTitle>
              <p className="text-sm text-muted-foreground">
                {period.termType.name} • {formatDate(period.startDate)} - {formatDate(period.endDate)}
              </p>
						</CardHeader>
						<CardContent>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{period.applicationCount}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
										</div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">{period.approvedCount}</div>
                  <div className="text-xs text-muted-foreground">Approved</div>
									</div>
                <div className="text-center">
                  <div className="text-xl font-bold text-red-600">{period.deniedCount}</div>
                  <div className="text-xs text-muted-foreground">Denied</div>
										</div>
									</div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={() => setSelectedCalendar(period.calendar_period_id.toString())}
              >
                View Applications
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Academic Calendar</label>
              <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
                <SelectTrigger>
                  <SelectValue placeholder="Select calendar period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Calendar Periods</SelectItem>
                  {calendarPeriods.map((period) => (
                    <SelectItem key={period.calendar_period_id} value={period.calendar_period_id.toString()}>
                      {period.academicYear} - {period.termType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="DENIED">Denied</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Application Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
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
						</CardContent>
					</Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archived Applications ({filteredApplications.length} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 animate-spin" />
                <span>Loading archived applications...</span>
              </div>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No archived applications found</h3>
              <p className="text-gray-500">
                {errorMessage ? "Please check your authentication or try refreshing." : "No applications have been archived yet."}
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
                      <TableHead>Academic Year</TableHead>
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
                        <TableCell>{formatDate(app.reviewedAt)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{app.calendarPeriod.academicYear}</div>
                            <div className="text-sm text-muted-foreground">{app.calendarPeriod.termType.name}</div>
                          </div>
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
                      <label className="text-sm">Show:</label>
                      <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => {
                          setItemsPerPage(parseInt(value))
                          setCurrentPage(1)
                        }}
                      >
                        <SelectTrigger className="w-20">
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


