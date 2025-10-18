"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Save, X, FileText, AlertTriangle } from "lucide-react"

interface EditApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  applicationId: string
  applicationType: 'leave' | 'travel'
  onSuccess: () => void
}

interface LeaveApplication {
  leave_application_id: number
  startDate: string
  endDate: string
  reason: string
  leave_type_id: number
  numberOfDays: number
  hours: number
  status: string
  specificPurpose?: string
  descriptionOfSickness?: string
  medicalProof?: string
  paymentStatus: string
}

interface TravelOrder {
  travel_order_id: number
  destination: string
  purpose: string
  dateOfTravel: string
  expectedReturn: string
  status: string
  transportationFee: number
  seminarConferenceFee: number
  mealsAccommodations: number
  totalCashRequested: number
  supportingDocuments?: string
  remarks?: string
}

interface LeaveType {
  leave_type_id: number
  name: string
}

interface LeaveLimit {
  leave_limit_id: number
  daysAllowed: number
  leave_type_id: number
}

export default function EditApplicationModal({
  isOpen,
  onClose,
  applicationId,
  applicationType,
  onSuccess
}: EditApplicationModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [leaveLimits, setLeaveLimits] = useState<LeaveLimit[]>([])
  const [application, setApplication] = useState<LeaveApplication | TravelOrder | null>(null)
  const [currentLeaveLimit, setCurrentLeaveLimit] = useState<number>(0)
  const [validationError, setValidationError] = useState<string>("")
  const [currentLeaveTypeName, setCurrentLeaveTypeName] = useState<string>("")

  // Form states for leave application
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")
  const [leaveTypeId, setLeaveTypeId] = useState("")
  const [numberOfDays, setNumberOfDays] = useState("")
  const [hours, setHours] = useState("")
  const [specificPurpose, setSpecificPurpose] = useState("")
  const [descriptionOfSickness, setDescriptionOfSickness] = useState("")
  const [medicalProof, setMedicalProof] = useState<File | null>(null)
  const [paymentStatus, setPaymentStatus] = useState("PAID")

  // Form states for travel order
  const [destination, setDestination] = useState("")
  const [purpose, setPurpose] = useState("")
  const [transportationFee, setTransportationFee] = useState("")
  const [seminarConferenceFee, setSeminarConferenceFee] = useState("")
  const [mealsAccommodations, setMealsAccommodations] = useState("")
  const [totalCashRequested, setTotalCashRequested] = useState("")
  const [supportingDocuments, setSupportingDocuments] = useState<File | null>(null)
  const [remarks, setRemarks] = useState("")

  // File size validation helper
  const validateFileSize = (file: File, maxSizeMB: number = 50) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      toast.error(`File size must be less than ${maxSizeMB}MB`)
      return false
    }
    return true
  }

  useEffect(() => {
    if (isOpen && applicationId) {
      loadApplication()
      if (applicationType === 'leave') {
        loadLeaveTypes()
        loadLeaveLimits()
      }
    }
  }, [isOpen, applicationId, applicationType])

  const loadApplication = async () => {
    try {
      setIsLoading(true)
      const endpoint = applicationType === 'leave' 
        ? `/api/teacher/leave-applications/${applicationId}`
        : `/api/teacher/travel-order/${applicationId}`
      
      console.log('Loading application from:', endpoint)
      const response = await fetch(endpoint)
      console.log('Response status:', response.status)
      
             if (response.ok) {
         const data = await response.json()
         console.log('Application data:', data)
         setApplication(data)
         
        if (applicationType === 'leave') {
          const leaveApp = data as LeaveApplication
          setStartDate(leaveApp.startDate.split('T')[0])
          setEndDate(leaveApp.endDate.split('T')[0])
          setReason(leaveApp.reason || "")
          setLeaveTypeId(leaveApp.leave_type_id.toString())
          setNumberOfDays(leaveApp.numberOfDays.toString())
          setHours(leaveApp.hours.toString())
          setSpecificPurpose(leaveApp.specificPurpose || "")
          setDescriptionOfSickness(leaveApp.descriptionOfSickness || "")
          setPaymentStatus(leaveApp.paymentStatus || "PAID")
          
          // Set leave type name immediately if we have it
          if (leaveTypes.length > 0) {
            const leaveType = leaveTypes.find((lt: LeaveType) => lt.leave_type_id.toString() === leaveApp.leave_type_id.toString())
            console.log('🔍 Setting leave type name immediately:', leaveType?.name)
            setCurrentLeaveTypeName(leaveType?.name || "")
          }
        } else {
          const travelOrder = data as TravelOrder
          setStartDate(travelOrder.dateOfTravel.split('T')[0])
          setEndDate(travelOrder.expectedReturn.split('T')[0])
          setDestination(travelOrder.destination)
          setPurpose(travelOrder.purpose)
          setTransportationFee(travelOrder.transportationFee.toString())
          setSeminarConferenceFee(travelOrder.seminarConferenceFee.toString())
          setMealsAccommodations(travelOrder.mealsAccommodations.toString())
          setTotalCashRequested(travelOrder.totalCashRequested.toString())
          setRemarks(travelOrder.remarks || "")
        }
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        toast.error(errorData.error || 'Failed to load application')
      }
    } catch (error) {
      console.error('Error loading application:', error)
      toast.error('Failed to load application')
    } finally {
      setIsLoading(false)
    }
  }

  const loadLeaveTypes = async () => {
    try {
      const response = await fetch('/api/teacher/leave-types')
      if (response.ok) {
        const data = await response.json()
        setLeaveTypes(data.leave_types || [])
        
        // If we already have a leave type ID, set the name immediately
        if (leaveTypeId && data.leave_types) {
          const leaveType = data.leave_types.find((lt: LeaveType) => lt.leave_type_id.toString() === leaveTypeId)
          console.log('🔍 Setting leave type name from loadLeaveTypes:', leaveType?.name)
          setCurrentLeaveTypeName(leaveType?.name || "")
        }
      }
    } catch (error) {
      console.error('Error loading leave types:', error)
    }
  }

  const loadLeaveLimits = async () => {
    try {
      const response = await fetch('/api/teacher/leave-limits')
      if (response.ok) {
        const data = await response.json()
        setLeaveLimits(data.leaveLimits || [])
      }
    } catch (error) {
      console.error('Error loading leave limits:', error)
    }
  }

  // Calculate leave limit for current leave type
  useEffect(() => {
    if (leaveTypeId && leaveLimits.length > 0) {
      const limit = leaveLimits.find(l => l.leave_type_id.toString() === leaveTypeId)
      setCurrentLeaveLimit(limit?.daysAllowed || 0)
      
      // Get leave type name
      const leaveType = leaveTypes.find(lt => lt.leave_type_id.toString() === leaveTypeId)
      console.log('🔍 Debug leave type loading:')
      console.log('  - leaveTypeId:', leaveTypeId)
      console.log('  - leaveTypes:', leaveTypes)
      console.log('  - found leaveType:', leaveType)
      console.log('  - leaveType name:', leaveType?.name)
      setCurrentLeaveTypeName(leaveType?.name || "")
    }
  }, [leaveTypeId, leaveLimits, leaveTypes])

  // Auto-calculate number of days based on start and end dates
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      if (start <= end) {
        // Calculate business days (excluding weekends)
        let days = 0
        const current = new Date(start)
        
        while (current <= end) {
          const dayOfWeek = current.getDay()
          if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
            days++
          }
          current.setDate(current.getDate() + 1)
        }
        
        setNumberOfDays(days.toString())
      }
    }
  }, [startDate, endDate])

  // Helper functions to determine which fields to show
  const shouldShowSpecificPurpose = () => {
    // Use leave type ID directly instead of relying on name
    const purposeTypeIds = [2, 3, 4] // Maternity Leave, Vacation Leave, Paternity Leave
    console.log('🔍 shouldShowSpecificPurpose:')
    console.log('  - leaveTypeId:', leaveTypeId)
    console.log('  - purposeTypeIds:', purposeTypeIds)
    console.log('  - result:', purposeTypeIds.includes(parseInt(leaveTypeId)))
    return purposeTypeIds.includes(parseInt(leaveTypeId))
  }

  const shouldShowDescriptionOfSickness = () => {
    // Use leave type ID directly instead of relying on name
    const sicknessTypeIds = [1, 6] // Emergency Leave, Sick Leave
    console.log('🔍 shouldShowDescriptionOfSickness:')
    console.log('  - leaveTypeId:', leaveTypeId)
    console.log('  - sicknessTypeIds:', sicknessTypeIds)
    console.log('  - result:', sicknessTypeIds.includes(parseInt(leaveTypeId)))
    return sicknessTypeIds.includes(parseInt(leaveTypeId))
  }

  // Validate leave application
  const validateLeaveApplication = () => {
    setValidationError("")
    
    // Check if we have the appropriate field based on leave type
    let hasRequiredField = false
    if (shouldShowSpecificPurpose()) {
      hasRequiredField = !!specificPurpose
    } else if (shouldShowDescriptionOfSickness()) {
      hasRequiredField = !!descriptionOfSickness
    } else {
      hasRequiredField = !!reason
    }
    
    if (!startDate || !endDate || !hasRequiredField || !numberOfDays || !hours) {
      setValidationError("All required fields must be filled")
      return false
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start >= end) {
      setValidationError("End date must be after start date")
      return false
    }

    const days = parseInt(numberOfDays)
    const hoursValue = parseInt(hours)
    
    if (days <= 0 || hoursValue <= 0) {
      setValidationError("Number of days and hours must be greater than 0")
      return false
    }

    if (hoursValue > 24) {
      setValidationError("Hours cannot exceed 24")
      return false
    }

    // Check if days exceed leave limit
    if (days > currentLeaveLimit) {
      setValidationError(`Cannot exceed ${currentLeaveLimit} days for this leave type`)
      return false
    }

    return true
  }

  // Validate travel order
  const validateTravelOrder = () => {
    setValidationError("")
    
    if (!destination || !purpose || !startDate || !endDate) {
      setValidationError("All required fields must be filled")
      return false
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start >= end) {
      setValidationError("Expected return date must be after travel date")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (applicationType === 'leave') {
      if (!validateLeaveApplication()) {
        return
      }
      await handleUpdateLeave()
    } else {
      if (!validateTravelOrder()) {
        return
      }
      await handleUpdateTravel()
    }
  }

  const handleUpdateLeave = async () => {
    try {
      setIsLoading(true)
      
      // Get the medical proof - either the new uploaded file or the existing one
      let medicalProofToSend = (application as LeaveApplication)?.medicalProof
      
                    // If a new file was uploaded, use that instead
       if (medicalProof && medicalProof instanceof File) {
         // Convert the new file to base64
         const reader = new FileReader()
         const base64Promise = new Promise<string>((resolve, reject) => {
           reader.onload = () => {
             resolve(reader.result as string)
           }
           reader.onerror = () => {
             reject(reader.error)
           }
         })
         reader.readAsDataURL(medicalProof)
         medicalProofToSend = await base64Promise
       }
      
             // Determine which field to send based on leave type
             let reasonToSend = reason
             let specificPurposeToSend = undefined
             let descriptionOfSicknessToSend = undefined
             
             if (shouldShowSpecificPurpose()) {
               specificPurposeToSend = specificPurpose
             } else if (shouldShowDescriptionOfSickness()) {
               descriptionOfSicknessToSend = descriptionOfSickness
             } else {
               reasonToSend = reason
             }
             
             const requestBody = {
         startDate,
         endDate,
         reason: reasonToSend,
         numberOfDays: parseInt(numberOfDays),
         hours: parseInt(hours),
         specificPurpose: specificPurposeToSend,
         descriptionOfSickness: descriptionOfSicknessToSend,
         paymentStatus,
         medicalProof: medicalProofToSend
       }
       
       const response = await fetch(`/api/teacher/leave-applications/${applicationId}`, {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify(requestBody)
       })

      if (response.ok) {
        toast.success('Leave application updated successfully')
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update application')
      }
    } catch (error) {
      console.error('Error updating leave application:', error)
      toast.error('Failed to update application')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateTravel = async () => {
    try {
      setIsLoading(true)
      
      // Get the supporting documents - either the new uploaded file or the existing one
      let supportingDocumentsToSend = (application as TravelOrder)?.supportingDocuments
      
             // If a new file was uploaded, use that instead
       if (supportingDocuments && supportingDocuments instanceof File) {
         // Convert the new file to base64
         const reader = new FileReader()
         const base64Promise = new Promise<string>((resolve, reject) => {
           reader.onload = () => {
             resolve(reader.result as string)
           }
           reader.onerror = () => {
             reject(reader.error)
           }
         })
         reader.readAsDataURL(supportingDocuments)
         supportingDocumentsToSend = await base64Promise
       }
      
      const response = await fetch(`/api/teacher/travel-order/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination,
          purpose,
          dateOfTravel: startDate,
          expectedReturn: endDate,
          transportationFee: parseFloat(transportationFee),
          seminarConferenceFee: parseFloat(seminarConferenceFee),
          mealsAccommodations: parseFloat(mealsAccommodations),
          totalCashRequested: parseFloat(totalCashRequested),
          remarks,
          supportingDocuments: supportingDocumentsToSend
        })
      })

      if (response.ok) {
        toast.success('Travel order updated successfully')
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update travel order')
      }
    } catch (error) {
      console.error('Error updating travel order:', error)
      toast.error('Failed to update travel order')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return
    }

    try {
      setIsLoading(true)
      
      const endpoint = applicationType === 'leave' 
        ? `/api/teacher/leave-applications/${applicationId}`
        : `/api/teacher/travel-order/${applicationId}`
      
      const response = await fetch(endpoint, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success(`${applicationType === 'leave' ? 'Leave application' : 'Travel order'} deleted successfully`)
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete application')
      }
    } catch (error) {
      console.error('Error deleting application:', error)
      toast.error('Failed to delete application')
    } finally {
      setIsLoading(false)
    }
  }

  if (!application) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit {applicationType === 'leave' ? 'Leave Application' : 'Travel Order'}
          </DialogTitle>
          <DialogDescription>
            Update your {applicationType === 'leave' ? 'leave application' : 'travel order'} details.
            {application.status !== 'PENDING' && (
              <span className="text-red-600 block mt-2">
                ⚠️ This application cannot be edited as it's no longer pending.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {validationError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
              <span className="text-red-800 text-sm">{validationError}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {applicationType === 'leave' ? (
            // Leave Application Form
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        disabled={application.status !== 'PENDING'}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                        disabled={application.status !== 'PENDING'}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="leaveType">Leave Type</Label>
                    <Input
                      id="leaveType"
                      value={leaveTypes.find(lt => lt.leave_type_id.toString() === leaveTypeId)?.name || ''}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave type cannot be changed. Delete and create new application to change leave type.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                       <Label htmlFor="numberOfDays">Number of Days *</Label>
                       <Input
                         id="numberOfDays"
                         type="number"
                         value={numberOfDays}
                         disabled
                         className="bg-gray-50"
                       />
                       <p className="text-xs text-gray-500 mt-1">
                         Automatically calculated from start and end dates (business days only)
                       </p>
                     </div>
                    <div>
                      <Label htmlFor="hours">Hours *</Label>
                      <Input
                        id="hours"
                        type="number"
                        min="1"
                        max="24"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        required
                        disabled={application.status !== 'PENDING'}
                      />
                    </div>
                  </div>

                  {!shouldShowSpecificPurpose() && !shouldShowDescriptionOfSickness() && (
                    <div>
                      <Label htmlFor="reason">Reason *</Label>
                      <Textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Please provide a detailed reason for your leave request"
                        required
                        disabled={application.status !== 'PENDING'}
                        rows={3}
                      />
                    </div>
                  )}
                  
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {shouldShowSpecificPurpose() && (
                    <div>
                      <Label htmlFor="specificPurpose">Specific Purpose *</Label>
                      <Textarea
                        id="specificPurpose"
                        value={specificPurpose}
                        onChange={(e) => setSpecificPurpose(e.target.value)}
                        placeholder="Provide specific details about the purpose of your leave"
                        required
                        disabled={application.status !== 'PENDING'}
                        rows={3}
                      />
                    </div>
                  )}

                  {shouldShowDescriptionOfSickness() && (
                    <div>
                      <Label htmlFor="descriptionOfSickness">Description of Sickness *</Label>
                      <Textarea
                        id="descriptionOfSickness"
                        value={descriptionOfSickness}
                        onChange={(e) => setDescriptionOfSickness(e.target.value)}
                        placeholder="Describe your sickness in detail"
                        required
                        disabled={application.status !== 'PENDING'}
                        rows={3}
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="paymentStatus">Payment Status</Label>
                    <Input
                      id="paymentStatus"
                      value={paymentStatus}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Payment status is automatically determined based on leave balance
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="medicalProof">Medical Proof (if applicable)</Label>
                    <div className="space-y-2">
                      {(() => {
                        // Show new file if selected, otherwise show existing file
                        const displayMedicalProof = medicalProof && medicalProof instanceof File 
                          ? URL.createObjectURL(medicalProof)
                          : (application as LeaveApplication).medicalProof;
                        return displayMedicalProof && typeof displayMedicalProof === 'string' && displayMedicalProof.trim() !== '';
                      })() && (
                       <div className="border rounded-lg p-3 bg-gray-50">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-2">
                             <FileText className="h-4 w-4 text-blue-600" />
                             <span className="text-sm font-medium">Current Medical Proof</span>
                           </div>
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => {
                               // Clear the medical proof from the application state
                               setApplication(prev => {
                                 if (prev && applicationType === 'leave') {
                                   return { ...(prev as LeaveApplication), medicalProof: undefined }
                                 }
                                 return prev
                               })
                             }}
                             disabled={application.status !== 'PENDING'}
                             className="text-red-600 hover:text-red-700"
                           >
                             <X className="h-4 w-4" />
                           </Button>
                         </div>
                         <div className="mt-2">
                            {(() => {
                              const displayMedicalProof = medicalProof && medicalProof instanceof File 
                                ? URL.createObjectURL(medicalProof)
                                : (application as LeaveApplication).medicalProof;
                              return displayMedicalProof?.endsWith('.pdf') ? (
                                <div className="text-sm text-gray-600">PDF Document</div>
                              ) : (
                                <img 
                                  src={displayMedicalProof} 
                                  alt="Medical Proof" 
                                  className="max-w-xs max-h-32 object-contain rounded border"
                                  onError={(e) => {
                                    // Fallback if image fails to load
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                    target.nextElementSibling?.classList.remove('hidden')
                                  }}
                                />
                              );
                            })()}
                          </div>
                       </div>
                     )}
                     <Input
                        id="medicalProof"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          if (file && !validateFileSize(file, 50)) {
                            e.target.value = ''
                            return
                          }
                          setMedicalProof(file)
                          // Don't update application state immediately - we'll handle it during update
                        }}
                        disabled={application.status !== 'PENDING'}
                      />
                     <p className="text-xs text-gray-500">
                       Accepted formats: PDF, JPG, JPEG, PNG. Maximum file size: 50MB. Upload a new file to replace the current one.
                     </p>
                   </div>
                 </div>
               </CardContent>
             </Card>
            </div>
          ) : (
            // Travel Order Form
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Travel Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="destination">Destination *</Label>
                    <Input
                      id="destination"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Enter destination"
                      required
                      disabled={application.status !== 'PENDING'}
                    />
                  </div>

                  <div>
                    <Label htmlFor="purpose">Purpose *</Label>
                    <Textarea
                      id="purpose"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="Please provide a detailed purpose for your travel"
                      required
                      disabled={application.status !== 'PENDING'}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateOfTravel">Date of Travel *</Label>
                      <Input
                        id="dateOfTravel"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        disabled={application.status !== 'PENDING'}
                      />
                    </div>
                    <div>
                      <Label htmlFor="expectedReturn">Expected Return *</Label>
                      <Input
                        id="expectedReturn"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                        disabled={application.status !== 'PENDING'}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Financial Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="transportationFee">Transportation Fee</Label>
                      <Input
                        id="transportationFee"
                        type="number"
                        min="0"
                        step="0.01"
                        value={transportationFee}
                        onChange={(e) => setTransportationFee(e.target.value)}
                        disabled={application.status !== 'PENDING'}
                      />
                    </div>
                    <div>
                      <Label htmlFor="seminarConferenceFee">Seminar/Conference Fee</Label>
                      <Input
                        id="seminarConferenceFee"
                        type="number"
                        min="0"
                        step="0.01"
                        value={seminarConferenceFee}
                        onChange={(e) => setSeminarConferenceFee(e.target.value)}
                        disabled={application.status !== 'PENDING'}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="mealsAccommodations">Meals & Accommodations</Label>
                      <Input
                        id="mealsAccommodations"
                        type="number"
                        min="0"
                        step="0.01"
                        value={mealsAccommodations}
                        onChange={(e) => setMealsAccommodations(e.target.value)}
                        disabled={application.status !== 'PENDING'}
                      />
                    </div>
                    <div>
                      <Label htmlFor="totalCashRequested">Total Cash Requested</Label>
                      <Input
                        id="totalCashRequested"
                        type="number"
                        min="0"
                        step="0.01"
                        value={totalCashRequested}
                        onChange={(e) => setTotalCashRequested(e.target.value)}
                        disabled={application.status !== 'PENDING'}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea
                      id="remarks"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Additional remarks or notes"
                      disabled={application.status !== 'PENDING'}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="supportingDocuments">Supporting Documents</Label>
                    <div className="space-y-2">
                      {(() => {
                        // Show new file if selected, otherwise show existing file
                        const displaySupportingDocs = supportingDocuments && supportingDocuments instanceof File 
                          ? URL.createObjectURL(supportingDocuments)
                          : (application as TravelOrder).supportingDocuments;
                        return displaySupportingDocs && typeof displaySupportingDocs === 'string' && displaySupportingDocs.trim() !== '';
                      })() && (
                       <div className="border rounded-lg p-3 bg-gray-50">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-2">
                             <FileText className="h-4 w-4 text-blue-600" />
                             <span className="text-sm font-medium">Current Supporting Documents</span>
                           </div>
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => {
                               // Clear the supporting documents from the application state
                               setApplication(prev => {
                                 if (prev && applicationType === 'travel') {
                                   return { ...(prev as TravelOrder), supportingDocuments: undefined }
                                 }
                                 return prev
                               })
                             }}
                             disabled={application.status !== 'PENDING'}
                             className="text-red-600 hover:text-red-700"
                           >
                             <X className="h-4 w-4" />
                           </Button>
                         </div>
                         <div className="mt-2">
                            {(() => {
                              const displaySupportingDocs = supportingDocuments && supportingDocuments instanceof File 
                                ? URL.createObjectURL(supportingDocuments)
                                : (application as TravelOrder).supportingDocuments;
                              return displaySupportingDocs?.endsWith('.pdf') ? (
                                <div className="text-sm text-gray-600">PDF Document</div>
                              ) : (
                                <img 
                                  src={displaySupportingDocs} 
                                  alt="Supporting Documents" 
                                  className="max-w-xs max-h-32 object-contain rounded border"
                                  onError={(e) => {
                                    // Fallback if image fails to load
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                    target.nextElementSibling?.classList.remove('hidden')
                                  }}
                                />
                              );
                            })()}
                          </div>
                       </div>
                     )}
                     <Input
                        id="supportingDocuments"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          if (file && !validateFileSize(file, 50)) {
                            e.target.value = ''
                            return
                          }
                          setSupportingDocuments(file)
                          // Don't update application state immediately - we'll handle it during update
                        }}
                        disabled={application.status !== 'PENDING'}
                      />
                     <p className="text-xs text-gray-500">
                       Accepted formats: PDF, JPG, JPEG, PNG. Maximum file size: 50MB. Upload a new file to replace the current one.
                     </p>
                   </div>
                 </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading || application.status !== 'PENDING'}
            >
              <X className="mr-2 h-4 w-4" />
              Delete
            </Button>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || application.status !== 'PENDING'}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Update
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
