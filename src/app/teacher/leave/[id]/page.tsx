"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  MapPin,
  DollarSign,
  User,
  Building,
  FileImage,
  Download,
  Edit,
  Trash2,
  AlertTriangle,
  Info,
  CalendarDays,
  Clock as ClockIcon,
  FileCheck,
  Receipt
} from "lucide-react"
import EditApplicationModal from "@/components/edit-application-modal"

interface ApplicationDetails {
  leave_application_id?: number
  travel_order_id?: number
  id: string
  type: 'leave' | 'travel'
  leaveType: string
  startDate: string
  endDate: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DEAN_APPROVED' | 'DEAN_REJECTED'
  appliedAt: string
  reason: string
  numberOfDays: number
  hours: number
  comments?: string
  reviewedAt?: string
  reviewedBy?: string
  paymentStatus?: string
  specificPurpose?: string
  descriptionOfSickness?: string
  medicalProof?: string
  academicYear?: string
  termType?: string
  // Travel order specific fields
  destination?: string
  transportationFee?: number
  seminarConferenceFee?: number
  mealsAccommodations?: number
  totalCashRequested?: number
  supportingDocuments?: string
  remarks?: string
  // Dean approval fields
  deanReviewedAt?: string
  deanReviewedBy?: string
  deanComments?: string
  deanRejectionReason?: string
}

export default function ApplicationDetailsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const [application, setApplication] = useState<ApplicationDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<{id: string, type: 'leave' | 'travel'} | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchApplicationDetails(params.id as string)
    }
  }, [params.id])

  const fetchApplicationDetails = async (id: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Extract the type and actual ID from the prefixed ID
      const [type, actualId] = id.split('_')
      
      if (!type || !actualId) {
        setError("Invalid application ID")
        return
      }

      // Fetch from the appropriate API based on type
      const endpoint = type === 'travel' 
        ? `/api/teacher/travel-order/${actualId}`
        : `/api/teacher/leave-applications/${actualId}`
      
      const response = await fetch(endpoint)
      
      if (response.ok) {
        const data = await response.json()
        // Transform the data to match our interface
        const transformedData: ApplicationDetails = {
          ...data,
          id: `${type}_${actualId}`,
          type: type as 'leave' | 'travel',
          leaveType: data.leaveType?.name || 'Leave Application'
        }
        setApplication(transformedData)
      } else {
        setError("Failed to load application details")
      }
    } catch (error) {
      console.error('Error fetching application details:', error)
      setError("An error occurred while loading the application")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditApplication = () => {
    if (!application) return
    
    const actualId = application.leave_application_id?.toString() || application.travel_order_id?.toString()
    if (actualId) {
      setSelectedApplication({ id: actualId, type: application.type })
      setEditModalOpen(true)
    }
  }

  const handleEditSuccess = () => {
    // Refresh the application data
    if (params.id) {
      fetchApplicationDetails(params.id as string)
    }
    setEditModalOpen(false)
    setSelectedApplication(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
      case 'DEAN_APPROVED':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Dean Approved</Badge>
      case 'REJECTED':
      case 'DEAN_REJECTED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'DEAN_APPROVED':
        return <FileCheck className="h-5 w-5 text-blue-600" />
      case 'REJECTED':
      case 'DEAN_REJECTED':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return "Your application has been approved by both the Dean and Finance Department."
      case 'DEAN_APPROVED':
        return "Your application has been approved by the Dean and is pending Finance Department review."
      case 'REJECTED':
      case 'DEAN_REJECTED':
        return "Your application has been rejected. Please check the comments for details."
      case 'PENDING':
        return "Your application is currently under review by the Dean."
      default:
        return "Application status is being processed."
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

  // Helper functions to determine which fields to show based on leave type
  const shouldShowSpecificPurpose = (leaveType: string) => {
    const purposeTypes = ['Vacation Leave', 'Paternity Leave', 'Maternity Leave']
    const result = purposeTypes.includes(leaveType)
    console.log(`shouldShowSpecificPurpose for '${leaveType}': ${result}`)
    return result
  }

  const shouldShowDescriptionOfSickness = (leaveType: string) => {
    const sicknessTypes = ['Emergency Leave', 'Sick Leave']
    const result = sicknessTypes.includes(leaveType)
    console.log(`shouldShowDescriptionOfSickness for '${leaveType}': ${result}`)
    return result
  }

  const shouldShowReason = (leaveType: string) => {
    const result = !shouldShowSpecificPurpose(leaveType) && !shouldShowDescriptionOfSickness(leaveType)
    console.log(`shouldShowReason for '${leaveType}': ${result}`)
    return result
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
            toast.error('Failed to download file')
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
      toast.error('Failed to download file')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500">Loading application details...</p>
        </div>
      </div>
    )
  }

  if (error || !application) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {error || 'Application not found'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                The application you&apos;re looking for could not be loaded.
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {application.leaveType} Details
            </h1>
            <p className="text-muted-foreground">
              Application submitted on {formatDate(application.appliedAt)}
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        {application.status === 'PENDING' && (
          <div className="flex gap-2">
            <Button onClick={handleEditApplication}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Application
            </Button>
          </div>
        )}
      </div>

      {/* Status Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(application.status)}
              <div>
                <CardTitle className="text-lg">Application Status</CardTitle>
                <CardDescription className="text-sm">
                  {getStatusDescription(application.status)}
                </CardDescription>
              </div>
            </div>
            {getStatusBadge(application.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs font-medium text-gray-500">Applied On</p>
                <p className="text-sm font-medium">{formatDateTime(application.appliedAt)}</p>
              </div>
            </div>
            {application.reviewedAt && (
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Reviewed On</p>
                  <p className="text-sm font-medium">{formatDateTime(application.reviewedAt)}</p>
                </div>
              </div>
            )}
            {application.reviewedBy && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Reviewed By</p>
                  <p className="text-sm font-medium">{application.reviewedBy}</p>
                </div>
              </div>
            )}
            {application.paymentStatus && (
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Payment Status</p>
                  <p className="text-sm font-medium">{application.paymentStatus}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Application Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium text-gray-500">Type</p>
                    <p className="text-sm font-medium">{application.leaveType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium text-gray-500">Duration</p>
                    <p className="text-sm font-medium">{application.numberOfDays} day{application.numberOfDays !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium text-gray-500">Start Date</p>
                    <p className="text-sm font-medium">{formatDate(application.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium text-gray-500">End Date</p>
                    <p className="text-sm font-medium">{formatDate(application.endDate)}</p>
                  </div>
                </div>
                {application.hours > 0 && (
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs font-medium text-gray-500">Hours</p>
                      <p className="text-sm font-medium">{application.hours} hour{application.hours !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                )}
                {application.academicYear && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs font-medium text-gray-500">Academic Year</p>
                      <p className="text-sm font-medium">{application.academicYear}</p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Purpose/Reason - Only show for leave types that don't have specific purpose or sickness description */}
              {console.log('Current leave type:', application.leaveType)}
              {shouldShowReason(application.leaveType) && (
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-3">Purpose/Reason</p>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-sm text-gray-700 leading-relaxed">{application.reason}</p>
                  </div>
                </div>
              )}

              {/* Specific Purpose for Leave Applications */}
              {shouldShowSpecificPurpose(application.leaveType) && application.specificPurpose && (
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-3">Specific Purpose</p>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-sm text-gray-700 leading-relaxed">{application.specificPurpose}</p>
                  </div>
                </div>
              )}

              {/* Description of Sickness for Sick/Emergency Leave */}
              {shouldShowDescriptionOfSickness(application.leaveType) && application.descriptionOfSickness && (
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-3">Description of Sickness</p>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-sm text-gray-700 leading-relaxed">{application.descriptionOfSickness}</p>
                  </div>
                </div>
              )}

              {/* Medical Proof */}
              {application.medicalProof && (
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-3">Medical Proof</p>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
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
                            console.error('Image failed to load:', application.medicalProof)
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            // Show error message
                            const errorDiv = document.createElement('div')
                            errorDiv.className = 'text-red-500 text-sm mt-2'
                            errorDiv.textContent = 'Image failed to load. Please try downloading the file instead.'
                            target.parentNode?.appendChild(errorDiv)
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully:', application.medicalProof)
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Travel Order Specific Fields */}
              {application.type === 'travel' && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Travel Information</h3>
                    
                    {application.destination && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          Destination
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <p className="text-sm text-gray-700">{application.destination}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Financial Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {application.transportationFee !== undefined && (
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <p className="text-xs font-medium text-gray-500">Transportation Fee</p>
                          <p className="text-sm font-semibold">₱{application.transportationFee.toLocaleString()}</p>
                        </div>
                      )}
                      {application.seminarConferenceFee !== undefined && (
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <p className="text-xs font-medium text-gray-500">Seminar/Conference Fee</p>
                          <p className="text-sm font-semibold">₱{application.seminarConferenceFee.toLocaleString()}</p>
                        </div>
                      )}
                      {application.mealsAccommodations !== undefined && (
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <p className="text-xs font-medium text-gray-500">Meals & Accommodations</p>
                          <p className="text-sm font-semibold">₱{application.mealsAccommodations.toLocaleString()}</p>
                        </div>
                      )}
                      {application.totalCashRequested !== undefined && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            Total Cash Requested
                          </p>
                          <p className="text-lg font-bold text-blue-900">₱{application.totalCashRequested.toLocaleString()}</p>
                        </div>
                      )}
                    </div>

                    {application.remarks && (
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-3">Remarks</p>
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <p className="text-sm text-gray-700 leading-relaxed">{application.remarks}</p>
                        </div>
                      </div>
                    )}

                    {/* Supporting Documents */}
                    {application.supportingDocuments && (
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-3">Supporting Documents</p>
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileImage className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">
                                {application.supportingDocuments.endsWith('.pdf') ? 'PDF Document' : 'Supporting Document'}
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadFile(application.supportingDocuments!, 'supporting-document')}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                          {!application.supportingDocuments.endsWith('.pdf') && (
                            <div className="mt-3">
                              <img 
                                src={application.supportingDocuments} 
                                alt="Supporting Documents" 
                                className="max-w-full max-h-48 object-contain rounded border"
                                onError={(e) => {
                                  console.error('Supporting documents image failed to load:', application.supportingDocuments)
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  // Show error message
                                  const errorDiv = document.createElement('div')
                                  errorDiv.className = 'text-red-500 text-sm mt-2'
                                  errorDiv.textContent = 'Image failed to load. Please try downloading the file instead.'
                                  target.parentNode?.appendChild(errorDiv)
                                }}
                                onLoad={() => {
                                  console.log('Supporting documents image loaded successfully:', application.supportingDocuments)
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Comments */}
              {application.comments && (
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-3">Comments</p>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-sm text-gray-700 leading-relaxed italic">{application.comments}</p>
                  </div>
                </div>
              )}

              {/* Dean Comments */}
              {application.deanComments && (
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-3">Dean Comments</p>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-700 leading-relaxed">{application.deanComments}</p>
                  </div>
                </div>
              )}

              {/* Dean Rejection Reason */}
              {application.deanRejectionReason && (
                <div>
                  <p className="text-sm font-medium text-red-900 mb-3">Rejection Reason</p>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-sm text-red-700 leading-relaxed">{application.deanRejectionReason}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          {application.status === 'PENDING' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleEditApplication}
                  className="w-full"
                  variant="outline"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Application
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Application Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Application Submitted</p>
                    <p className="text-xs text-gray-500">{formatDateTime(application.appliedAt)}</p>
                  </div>
                </div>
                
                {application.deanReviewedAt && (
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      application.status.includes('REJECTED') ? 'bg-red-500' : 'bg-green-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium">Dean Review</p>
                      <p className="text-xs text-gray-500">{formatDateTime(application.deanReviewedAt)}</p>
                    </div>
                  </div>
                )}
                
                {application.reviewedAt && (
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      application.status === 'REJECTED' ? 'bg-red-500' : 'bg-green-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium">Final Review</p>
                      <p className="text-xs text-gray-500">{formatDateTime(application.reviewedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
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

