"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Calendar,
  Users,
  Building,
  Clock,
  Check,
  X
} from "lucide-react"

interface LeaveApplication {
  leave_application_id: number
  startDate: string
  endDate: string
  status: 'PENDING' | 'DEAN_APPROVED' | 'DEAN_REJECTED' | 'APPROVED' | 'DENIED'
  appliedAt: string
  reason: string
  numberOfDays: number
  hours: number
  specificPurpose?: string
  descriptionOfSickness?: string
  medicalProof?: string
  paymentStatus: 'PAID' | 'UNPAID'
  deanReviewedAt?: string
  deanReviewedBy?: string
  deanComments?: string
  deanRejectionReason?: string
  leaveType?: {
    leave_type_id: number
    name: string
    description?: string
  }
  user: {
    name: string
    email: string
    profilePicture: string
    department: {
      name: string
    }
  }
  calendarPeriod: {
    academicYear: string
    startDate: string
    endDate: string
  }
}

interface FinanceApplicationsData {
  applications: LeaveApplication[]
  currentPeriod: {
    academicYear: string
    startDate: string
    endDate: string
  }
}

export default function FinanceApplicationsPage() {
  const [applicationsData, setApplicationsData] = useState<FinanceApplicationsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isApproving, setIsApproving] = useState<number | null>(null)
  const [isRejecting, setIsRejecting] = useState<number | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState<number | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const router = useRouter()

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const res = await fetch('/api/finance/applications')
        if (!res.ok) throw new Error('Failed to load applications')
        const data = await res.json()
        if (data.success) {
          setApplicationsData(data.data)
        }
      } catch (error) {
        console.error('Error loading applications:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadApplications()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Finance Approved</Badge>
      case 'DEAN_APPROVED':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Dean Approved</Badge>
      case 'DEAN_REJECTED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Dean Rejected</Badge>
      case 'DENIED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Finance Denied</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending Dean</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleViewApplication = (applicationId: number) => {
    router.push(`/finance/applications/${applicationId}`)
  }

  const handleApprove = async (applicationId: number) => {
    setIsApproving(applicationId)
    try {
      const res = await fetch(`/api/finance/applications/${applicationId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to approve application')
      }

      const data = await res.json()
      if (data.success) {
        // Refresh the applications list
        const refreshRes = await fetch('/api/finance/applications')
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json()
          if (refreshData.success) {
            setApplicationsData(refreshData.data)
          }
        }
        alert('Application approved successfully!')
      }
    } catch (error) {
      console.error('Error approving application:', error)
      alert(error instanceof Error ? error.message : 'Failed to approve application')
    } finally {
      setIsApproving(null)
    }
  }

  const handleReject = async (applicationId: number) => {
    if (!rejectionReason.trim()) return
    
    setIsRejecting(applicationId)
    try {
      const res = await fetch(`/api/finance/applications/${applicationId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to reject application')
      }

      const data = await res.json()
      if (data.success) {
        // Refresh the applications list
        const refreshRes = await fetch('/api/finance/applications')
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json()
          if (refreshData.success) {
            setApplicationsData(refreshData.data)
          }
        }
        setShowRejectDialog(null)
        setRejectionReason('')
        alert('Application rejected successfully!')
      }
    } catch (error) {
      console.error('Error rejecting application:', error)
      alert(error instanceof Error ? error.message : 'Failed to reject application')
    } finally {
      setIsRejecting(null)
    }
  }

  const canApproveOrReject = (status: string) => {
    return status === 'DEAN_APPROVED'
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
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">All Leave Applications</h1>
        <p className="text-muted-foreground">
          Review and manage leave applications from all departments
        </p>
      </div>

      {/* System Info */}
      {applicationsData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Academic Year:</span>
                <span className="text-sm text-gray-600">{applicationsData.currentPeriod.academicYear}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Total Applications:</span>
                <span className="text-sm text-gray-600">{applicationsData.applications.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Ready for Finance:</span>
                <span className="text-sm text-gray-600">
                  {applicationsData.applications.filter(app => app.status === 'DEAN_APPROVED').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Leave Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!applicationsData || applicationsData.applications.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No leave applications have been submitted yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {applicationsData.applications.map((application) => (
                <div
                  key={application.leave_application_id}
                  className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors gap-4"
                >
                  <div className="flex items-start space-x-4 flex-1">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={application.user.profilePicture || '/ckcm.png'} alt={application.user.name} />
                      <AvatarFallback>{application.user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {application.user.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(application.startDate)} - {formatDate(application.endDate)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Applied on {formatDate(application.appliedAt)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {application.numberOfDays} days • {application.hours} hours
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {application.leaveType?.name || 'N/A'}
                        </span>
                        <Badge className={application.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800 text-xs' : 'bg-red-100 text-red-800 text-xs'}>
                          {application.paymentStatus}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {application.user.department?.name || 'No department'}
                        </span>
                      </div>
                      {application.reason && (
                        <p className="text-xs text-gray-600 mt-1 break-words">
                          Reason: {application.reason.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusBadge(application.status)}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewApplication(application.leave_application_id)}
                      className="w-full sm:w-auto"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canApproveOrReject(application.status) && (
                      <div className="flex items-center gap-2 ml-2">
                        <Button 
                          onClick={() => handleApprove(application.leave_application_id)}
                          disabled={isApproving === application.leave_application_id}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                        >
                          {isApproving === application.leave_application_id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </Button>
                        <Button 
                          onClick={() => setShowRejectDialog(application.leave_application_id)}
                          disabled={isRejecting === application.leave_application_id}
                          size="sm"
                          variant="destructive"
                          className="w-full sm:w-auto"
                        >
                          {isRejecting === application.leave_application_id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject Application</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this application. This will be sent to the applicant.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-300 rounded-md resize-none h-32 mb-4"
              disabled={isRejecting === showRejectDialog}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(null)
                  setRejectionReason('')
                }}
                disabled={isRejecting === showRejectDialog}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleReject(showRejectDialog)}
                disabled={isRejecting === showRejectDialog || !rejectionReason.trim()}
              >
                {isRejecting === showRejectDialog ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Reject Application
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
