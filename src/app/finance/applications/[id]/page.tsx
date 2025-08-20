"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Calendar,
  User,
  Mail,
  Building,
  Clock,
  FileImage,
  ArrowLeft,
  Download,
  Check,
  X
} from "lucide-react"

interface LeaveApplication {
  leave_application_id: number
  startDate: string
  endDate: string
  status: 'PENDING' | 'DEAN_APPROVED' | 'DEAN_REJECTED' | 'APPROVED' | 'DENIED'
  appliedAt: string
  reviewedAt?: string
  reason?: string
  numberOfDays: number
  hours: number
  specificPurpose?: string
  descriptionOfSickness?: string
  medicalProof?: string
  comments?: string
  deanReviewedAt?: string
  deanReviewedBy?: string
  deanComments?: string
  deanRejectionReason?: string
  paymentStatus: 'PAID' | 'UNPAID'
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
  reviewer?: {
    name: string
    email: string
  }
  calendarPeriod: {
    academicYear: string
    startDate: string
    endDate: string
  }
}

export default function FinanceApplicationDetailPage() {
  const [application, setApplication] = useState<LeaveApplication | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    const loadApplication = async () => {
      try {
        const applicationId = params.id
        if (!applicationId) {
          setError("Application ID not found")
          return
        }

        const res = await fetch(`/api/finance/applications/${applicationId}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError("Application not found")
          } else if (res.status === 403) {
            setError("Access denied")
          } else {
            setError("Failed to load application")
          }
          return
        }

        const data = await res.json()
        if (data.success) {
          setApplication(data.data.application)
        } else {
          setError("Failed to load application")
        }
      } catch (error) {
        console.error('Error loading application:', error)
        setError("Failed to load application")
      } finally {
        setIsLoading(false)
      }
    }
    loadApplication()
  }, [params.id])

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
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleApprove = async () => {
    if (!application) return
    
    setIsApproving(true)
    try {
      const res = await fetch(`/api/finance/applications/${application.leave_application_id}/approve`, {
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
        // Update the application state
        setApplication(data.data.application)
        alert('Application approved successfully!')
      }
    } catch (error) {
      console.error('Error approving application:', error)
      alert(error instanceof Error ? error.message : 'Failed to approve application')
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!application || !rejectionReason.trim()) return
    
    setIsRejecting(true)
    try {
      const res = await fetch(`/api/finance/applications/${application.leave_application_id}/reject`, {
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
        // Update the application state
        setApplication(data.data.application)
        setShowRejectDialog(false)
        setRejectionReason('')
        alert('Application rejected successfully!')
      }
    } catch (error) {
      console.error('Error rejecting application:', error)
      alert(error instanceof Error ? error.message : 'Failed to reject application')
    } finally {
      setIsRejecting(false)
    }
  }

  const canApproveOrReject = application?.status === 'DEAN_APPROVED'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!application || !application.user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Application not found</h3>
              <p className="mt-1 text-sm text-gray-500">
                The application you're looking for could not be found or is missing user data.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Applications
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {getStatusBadge(application.status)}
          {canApproveOrReject && (
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleApprove}
                disabled={isApproving}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              >
                {isApproving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Approve
              </Button>
              <Button 
                onClick={() => setShowRejectDialog(true)}
                disabled={isRejecting}
                variant="destructive"
                className="w-full sm:w-auto"
              >
                {isRejecting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>

      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Leave Application Details</h1>
        <p className="text-muted-foreground">
          Application ID: {application.leave_application_id}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Applicant Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Applicant Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Avatar className="h-16 w-16 flex-shrink-0">
                <AvatarImage src={application.user.profilePicture || '/ckcm.png'} alt={application.user.name || 'User'} />
                <AvatarFallback>{(application.user.name || 'User').split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold truncate">{application.user.name || 'Unknown User'}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{application.user.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{application.user.department?.name || 'No department'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leave Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Leave Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Start Date</p>
                <p className="text-sm">{formatDate(application.startDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">End Date</p>
                <p className="text-sm">{formatDate(application.endDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Number of Days</p>
                <p className="text-sm">{application.numberOfDays} days</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Hours</p>
                <p className="text-sm">{application.hours} hours</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Leave Type</p>
                <p className="text-sm font-medium">{application.leaveType?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Payment Status</p>
                <Badge className={application.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {application.paymentStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Applied On</p>
              <p className="text-sm">{formatDateTime(application.appliedAt)}</p>
            </div>
            {application.reviewedAt && (
              <div>
                <p className="text-sm font-medium text-gray-500">Reviewed On</p>
                <p className="text-sm">{formatDateTime(application.reviewedAt)}</p>
              </div>
            )}
            {application.reviewer && (
              <div>
                <p className="text-sm font-medium text-gray-500">Reviewed By</p>
                <p className="text-sm">{application.reviewer.name || 'Unknown'}</p>
                <p className="text-xs text-gray-500">{application.reviewer.email || 'No email'}</p>
              </div>
            )}
            {application.deanReviewedAt && (
              <div>
                <p className="text-sm font-medium text-gray-500">Dean Reviewed On</p>
                <p className="text-sm">{formatDateTime(application.deanReviewedAt)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Application Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Application Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {application.reason && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Reason for Leave</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                {application.reason}
              </p>
            </div>
          )}

          {application.specificPurpose && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Specific Purpose</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                {application.specificPurpose}
              </p>
            </div>
          )}

          {application.descriptionOfSickness && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Description of Sickness</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                {application.descriptionOfSickness}
              </p>
            </div>
          )}

          {application.medicalProof && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Medical Proof</h4>
              <div className="flex items-center gap-2">
                <FileImage className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{application.medicalProof}</span>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}

          {application.deanComments && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Dean Comments</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                {application.deanComments}
              </p>
            </div>
          )}

          {application.deanRejectionReason && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Dean Rejection Reason</h4>
              <p className="text-sm text-gray-700 bg-red-50 p-3 rounded-md border border-red-200">
                {application.deanRejectionReason}
              </p>
            </div>
          )}

          {application.comments && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Reviewer Comments</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                {application.comments}
              </p>
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
              disabled={isRejecting}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false)
                  setRejectionReason('')
                }}
                disabled={isRejecting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isRejecting || !rejectionReason.trim()}
              >
                {isRejecting ? (
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

      {/* Academic Period Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Academic Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Academic Year</p>
              <p className="text-sm">{application.calendarPeriod?.academicYear || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Period Start</p>
              <p className="text-sm">{application.calendarPeriod?.startDate ? formatDate(application.calendarPeriod.startDate) : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Period End</p>
              <p className="text-sm">{application.calendarPeriod?.endDate ? formatDate(application.calendarPeriod.endDate) : 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
