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

export default function DeanApplicationDetailPage() {
  const [application, setApplication] = useState<LeaveApplication | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isNotifying, setIsNotifying] = useState(false)
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

        const res = await fetch(`/api/dean/applications/${applicationId}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError("Application not found")
          } else if (res.status === 403) {
            setError("Access denied - Application not in your department")
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
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
      case 'DEAN_APPROVED':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Dean Approved</Badge>
      case 'DEAN_REJECTED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Dean Rejected</Badge>
      case 'DENIED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Denied</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
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
      const res = await fetch(`/api/dean/applications/${application.leave_application_id}/approve`, {
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
        // You could also show a success toast here
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
      const res = await fetch(`/api/dean/applications/${application.leave_application_id}/reject`, {
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
        // Show success message
        alert('Application rejected successfully!')
        // Refresh the page to show updated status
        window.location.reload()
      } else {
        throw new Error(data.error || 'Failed to reject application')
      }
    } catch (error) {
      console.error('Error rejecting application:', error)
      alert(error instanceof Error ? error.message : 'Failed to reject application')
      // Ensure dialog is closed on error
      setShowRejectDialog(false)
      setRejectionReason('')
    } finally {
      setIsRejecting(false)
    }
  }

  const handleNotifyRejection = async () => {
    if (!application) return
    
    setIsNotifying(true)
    try {
      const res = await fetch(`/api/dean/applications/${application.leave_application_id}/notify-rejection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to notify applicant')
      }

      const data = await res.json()
      if (data.success) {
        alert('Applicant has been notified about the rejection!')
      }
    } catch (error) {
      console.error('Error notifying applicant:', error)
      alert(error instanceof Error ? error.message : 'Failed to notify applicant')
    } finally {
      setIsNotifying(false)
    }
  }

  const canApproveOrReject = application?.status === 'PENDING'
  const canNotifyRejection = application?.status === 'DENIED' && application?.comments?.includes('Rejected by Finance Officer')

  // Helper functions to determine which fields to show based on leave type
  const shouldShowSpecificPurpose = (leaveType: string) => {
    const purposeTypes = ['Vacation Leave', 'Paternity Leave', 'Maternity Leave']
    return purposeTypes.includes(leaveType)
  }

  const shouldShowDescriptionOfSickness = (leaveType: string) => {
    const sicknessTypes = ['Emergency Leave', 'Sick Leave']
    return sicknessTypes.includes(leaveType)
  }

  const shouldShowReason = (leaveType: string) => {
    return !shouldShowSpecificPurpose(leaveType) && !shouldShowDescriptionOfSickness(leaveType)
  }

  const handleDownloadFile = (filePath: string, fileName: string) => {
    try {
      // Check if it's a base64 data URL
      if (filePath.startsWith('data:')) {
        // Convert base64 to blob
        const response = fetch(filePath)
        response.then(res => res.blob())
          .then(blob => {
            // Create blob URL
            const blobUrl = URL.createObjectURL(blob)
            
            // Create download link
            const link = document.createElement('a')
            link.href = blobUrl
            link.download = fileName
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            
            // Clean up blob URL
            setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
          })
          .catch(error => {
            console.error('Error downloading file:', error)
            alert('Failed to download file')
          })
      } else {
        // Handle regular file paths (if any)
        const link = document.createElement('a')
        link.href = filePath
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Error in handleDownloadFile:', error)
      alert('Failed to download file')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading application details...</p>
        </div>
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
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
           {getStatusBadge(application.status)}
           {canApproveOrReject && (
             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
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
           {canNotifyRejection && (
             <div className="flex items-center gap-2">
               <Button 
                 onClick={handleNotifyRejection}
                 disabled={isNotifying}
                 className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
               >
                 {isNotifying ? (
                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                 ) : (
                   <Mail className="h-4 w-4 mr-2" />
                 )}
                 Notify Applicant
               </Button>
             </div>
           )}
         </div>
       </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Leave Application Details</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={application.user.profilePicture || '/ckcm.png'} alt={application.user.name || 'User'} />
                <AvatarFallback>{(application.user.name || 'User').split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{application.user.name || 'Unknown User'}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  {application.user.email || 'No email'}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building className="h-4 w-4" />
                  {application.user.department?.name || 'No department'}
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
          {shouldShowReason(application.leaveType?.name || '') && application.reason && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Reason for Leave</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                {application.reason}
              </p>
            </div>
          )}

          {shouldShowSpecificPurpose(application.leaveType?.name || '') && application.specificPurpose && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Specific Purpose</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                {application.specificPurpose}
              </p>
            </div>
          )}

          {shouldShowDescriptionOfSickness(application.leaveType?.name || '') && application.descriptionOfSickness && (
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
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileImage className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">
                      {application.medicalProof.endsWith('.pdf') ? 'PDF Document' : 'Medical Certificate'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadFile(application.medicalProof!, 'medical-proof')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                {!application.medicalProof.endsWith('.pdf') && (
                  <div className="mt-3">
                    <img 
                      src={application.medicalProof} 
                      alt="Medical Proof" 
                      className="max-w-full max-h-48 object-contain rounded border"
                      onError={(e) => {
                        console.error('Medical proof image failed to load:', application.medicalProof)
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        // Show error message
                        const errorDiv = document.createElement('div')
                        errorDiv.className = 'text-red-500 text-sm mt-2'
                        errorDiv.textContent = 'Image failed to load. Please try downloading the file instead.'
                        target.parentNode?.appendChild(errorDiv)
                      }}
                      onLoad={() => {
                        console.log('Medical proof image loaded successfully:', application.medicalProof)
                      }}
                    />
                  </div>
                )}
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
               <h4 className="text-sm font-medium text-gray-900 mb-2">Rejection Reason</h4>
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
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRejectDialog(false)
              setRejectionReason('')
            }
          }}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Reject Application</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this application. This will be sent to the applicant.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-300 rounded-md resize-none h-32 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
