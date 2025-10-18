"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Calendar, 
  Plus,
  Search,
  Filter,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Archive,
  Edit,
  Trash2
} from "lucide-react"
import { useRouter } from "next/navigation"
import ValidationStatus from "@/components/validation-status"
import EditApplicationModal from "@/components/edit-application-modal"

interface LeaveApplication {
  id: string
  leaveType: string
  startDate: string
  endDate: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DEAN_APPROVED' | 'DEAN_REJECTED'
  appliedAt: string
  reason: string
  numberOfDays: number
  comments?: string
  specificPurpose?: string
  descriptionOfSickness?: string
}

export default function DeanLeavePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [applications, setApplications] = useState<LeaveApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<LeaveApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [canApply, setCanApply] = useState(true)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<{id: string, type: 'leave' | 'travel'} | null>(null)

  useEffect(() => {
    fetchApplications()
  }, [])

  useEffect(() => {
    filterApplications()
  }, [applications, searchTerm, statusFilter])

  const fetchApplications = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/dean/leave-applications')
      
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
      } else {
        console.error('Error fetching applications:', response.status)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterApplications = () => {
    let filtered = applications

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.leaveType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.specificPurpose && app.specificPurpose.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (app.descriptionOfSickness && app.descriptionOfSickness.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    setFilteredApplications(filtered)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case 'DEAN_APPROVED':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Dean Approved</Badge>
      case 'DEAN_REJECTED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Dean Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'DEAN_APPROVED':
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      case 'DEAN_REJECTED':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Helper functions to determine which field to show based on leave type
  const shouldShowSpecificPurpose = (leaveType: string) => {
    const purposeTypes = ['Vacation Leave', 'Paternity Leave', 'Maternity Leave']
    return purposeTypes.includes(leaveType)
  }

  const shouldShowDescriptionOfSickness = (leaveType: string) => {
    const sicknessTypes = ['Emergency Leave', 'Sick Leave']
    return sicknessTypes.includes(leaveType)
  }

  const getDisplayText = (application: LeaveApplication) => {
    if (shouldShowDescriptionOfSickness(application.leaveType) && application.descriptionOfSickness) {
      return application.descriptionOfSickness
    }
    if (shouldShowSpecificPurpose(application.leaveType) && application.specificPurpose) {
      return application.specificPurpose
    }
    return application.reason
  }

  const handleEditApplication = (applicationId: string, type: 'leave' | 'travel') => {
    // Extract the numeric ID from the formatted ID (e.g., "leave_123" -> "123")
    const numericId = applicationId.split('_')[1]
    setSelectedApplication({ id: numericId, type })
    setEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    fetchApplications()
    setEditModalOpen(false)
    setSelectedApplication(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground">
            View and manage your leave applications
          </p>
        </div>
        <div className="flex flex-col items-start lg:items-end gap-2">
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dean/leave/archived')}
              className="w-full sm:w-auto"
            >
              <Archive className="mr-2 h-4 w-4" />
              View Archive
            </Button>
            <Button 
              onClick={() => router.push('/dean/leave/apply')}
              disabled={!canApply}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Apply for Leave
            </Button>
          </div>
          {!canApply && (
            <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200 text-center lg:text-left">
              ⚠️ You have pending applications that need to be reviewed first
            </p>
          )}
        </div>
      </div>

      {/* Validation Status */}
      <ValidationStatus 
        onValidationChange={setCanApply} 
        validationApi="/api/dean/validation"
        applyPath="/dean/leave/apply"
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by leave type or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={statusFilter === "PENDING" ? "default" : "outline"}
                onClick={() => setStatusFilter("PENDING")}
                size="sm"
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === "DEAN_APPROVED" ? "default" : "outline"}
                onClick={() => setStatusFilter("DEAN_APPROVED")}
                size="sm"
              >
                Dean Approved
              </Button>
              <Button
                variant={statusFilter === "APPROVED" ? "default" : "outline"}
                onClick={() => setStatusFilter("APPROVED")}
                size="sm"
              >
                Approved
              </Button>
              <Button
                variant={statusFilter === "DEAN_REJECTED" ? "default" : "outline"}
                onClick={() => setStatusFilter("DEAN_REJECTED")}
                size="sm"
              >
                Dean Rejected
              </Button>
              <Button
                variant={statusFilter === "REJECTED" ? "default" : "outline"}
                onClick={() => setStatusFilter("REJECTED")}
                size="sm"
              >
                Rejected
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Applications</CardTitle>
          <CardDescription>
            {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {applications.length === 0 ? 'No applications yet' : 'No applications match your filters'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {applications.length === 0 
                  ? 'Get started by applying for your first leave.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {applications.length === 0 && (
                <div className="mt-6 flex flex-col items-center gap-2">
                  <Button 
                    onClick={() => router.push('/dean/leave/apply')}
                    disabled={!canApply}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Apply for Leave
                  </Button>
                  {!canApply && (
                    <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200 text-center max-w-sm">
                      ⚠️ You have pending applications that need to be reviewed first
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <div
                  key={application.id}
                  className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 lg:p-6 border rounded-lg hover:bg-gray-50 transition-colors gap-4"
                >
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(application.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {application.leaveType}
                        </h3>
                        {getStatusBadge(application.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2 break-words">
                        {getDisplayText(application)}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{formatDate(application.startDate)} - {formatDate(application.endDate)}</span>
                        </span>
                        <span className="flex-shrink-0">{application.numberOfDays} day{application.numberOfDays !== 1 ? 's' : ''}</span>
                        <span className="flex-shrink-0">Applied on {formatDate(application.appliedAt)}</span>
                      </div>
                      {application.comments && (
                        <p className="text-sm text-gray-600 mt-2 italic break-words">
                          Comments: {application.comments}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dean/leave/${application.id}`)}
                      className="w-full sm:w-auto"
                    >
                      View Details
                    </Button>
                    {application.status === 'PENDING' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditApplication(application.id, application.type)}
                        title="Edit application"
                        className="w-full sm:w-auto"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Application Modal */}
      {selectedApplication && (
        <EditApplicationModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setSelectedApplication(null)
          }}
          applicationId={selectedApplication.id}
          applicationType={selectedApplication.type}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}
