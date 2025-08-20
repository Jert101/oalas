"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Plane, 
  FileText, 
  ArrowLeft,
  Clock,
  CheckCircle
} from "lucide-react"
import { LeaveTypeSelection } from "./_components/LeaveTypeSelection"
import { LeaveLimitsDisplay } from "./_components/LeaveLimitsDisplay"
import { LeaveApplicationForm } from "./_components/LeaveApplicationForm"
import { TravelOrderForm } from "./_components/TravelOrderForm"
import { toast } from "sonner"

interface LeaveType {
  leave_type_id: number
  name: string
  description: string
}

interface LeaveLimit {
  leave_limit_id: number
  daysAllowed: number
  leaveType: {
    name: string
  }
}



interface UserData {
  name: string
  department: string
  status: string
}

type ApplicationStep = 'choice' | 'leave-types' | 'leave-limits' | 'leave-form' | 'travel-form'

export default function DeanLeaveApplicationPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<ApplicationStep>('choice')
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null)
  const [leaveLimits, setLeaveLimits] = useState<LeaveLimit | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [canApply, setCanApply] = useState(true)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Fetch user data and check validation on component mount
  useEffect(() => {
    fetchUserData()
    checkValidation()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserData({
          name: data.user.name,
          department: data.user.department?.name || 'Not assigned',
          status: data.user.status?.name || 'Unknown'
        })
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const checkValidation = async () => {
    try {
      const response = await fetch('/api/dean/validation')
      if (response.ok) {
        const data = await response.json()
        setCanApply(data.canApply)
        if (!data.canApply) {
          setValidationError(data.reason || 'You have pending applications that need to be reviewed first.')
        }
      } else {
        console.error('Error checking validation:', response.status)
        setCanApply(true) // Default to allowing if check fails
      }
    } catch (error) {
      console.error('Error checking validation:', error)
      setCanApply(true) // Default to allowing if check fails
    }
  }

  const handleLeaveApplicationChoice = () => {
    if (!canApply) {
      toast.error(validationError || 'You have pending applications that need to be reviewed first.')
      return
    }
    setCurrentStep('leave-types')
  }

  const handleTravelOrderChoice = () => {
    if (!canApply) {
      toast.error(validationError || 'You have pending applications that need to be reviewed first.')
      return
    }
    setCurrentStep('travel-form')
  }

  const handleLeaveTypeSelect = async (leaveType: LeaveType) => {
    setSelectedLeaveType(leaveType)
    setIsLoading(true)
    
    try {
      console.log(`Fetching data for leave type: ${leaveType.name} (ID: ${leaveType.leave_type_id})`)
      
      // For deans, we only need leave limits, not balance (since they have automatic approval)
      const limitsResponse = await fetch(`/api/teacher/leave-limits?leaveTypeId=${leaveType.leave_type_id}`)

      console.log(`Leave limits response status: ${limitsResponse.status}`)

      if (limitsResponse.ok) {
        const limitsData = await limitsResponse.json()
        setLeaveLimits(limitsData.leaveLimit)
        console.log('Leave limits data:', limitsData)
        
        // For deans, proceed directly to the form since they have automatic approval
        setCurrentStep('leave-form')
      } else {
        const errorData = await limitsResponse.json()
        console.error('Leave limits API error:', errorData)
        console.error('Leave limits response status:', limitsResponse.status)
        
        // Handle authentication errors
        if (limitsResponse.status === 401) {
          toast.error("Authentication error. Please log in again.")
          router.push('/login')
          return
        }
        
        // Handle other errors
        toast.error("Unable to load leave limits. Please try again.")
      }
    } catch (error) {
      console.error('Error fetching leave data:', error)
      toast.error('An error occurred while loading leave information. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProceedToForm = () => {
    setCurrentStep('leave-form')
  }

  const handleBackToChoice = () => {
    setCurrentStep('choice')
    setSelectedLeaveType(null)
    setLeaveLimits(null)
  }

  const handleBackToLeaveTypes = () => {
    setCurrentStep('leave-types')
    setSelectedLeaveType(null)
    setLeaveLimits(null)
  }

  const handleBackToLimits = () => {
    setCurrentStep('leave-limits')
  }

  const handleFormSubmit = async (formData: {
    startDate: string;
    endDate: string;
    hours: number;
    specificPurpose?: string;
    descriptionOfSickness?: string;
    medicalProof?: File;
  }) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/dean/leave/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          leaveTypeId: selectedLeaveType?.leave_type_id,
        }),
      })

      if (response.ok) {
        toast.success('Leave application submitted and automatically approved!')
        router.push('/dean/leave/current')
      } else {
        const error = await response.json()
        console.error('Error submitting application:', error)
        
        if (error.validationDetails) {
          toast.error(error.error || 'Validation failed')
        } else {
          toast.error(error.error || 'Failed to submit application')
        }
      }
    } catch (error) {
      console.error('Error submitting application:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTravelOrderSubmit = async (formData: {
    dateOfTravel: string;
    expectedReturn: string;
    purpose: string;
    destination: string;
    supportingDocuments?: File;
  }) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/dean/travel/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Travel order submitted and automatically approved!')
        router.push('/dean/leave/current')
      } else {
        const error = await response.json()
        console.error('Error submitting travel order:', error)
        
        if (error.validationDetails) {
          toast.error(error.error || 'Validation failed')
        } else {
          toast.error(error.error || 'Failed to submit travel order')
        }
      }
    } catch (error) {
      console.error('Error submitting travel order:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'choice':
                 return (
           <div className="space-y-6">
             {/* Validation Error Message - At the Top */}
             {!canApply && validationError && (
               <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                 <div className="flex items-center gap-2">
                   <Clock className="h-5 w-5 text-red-600" />
                   <h3 className="text-sm font-medium text-red-800">Cannot Apply for New Applications</h3>
                 </div>
                 <p className="mt-1 text-sm text-red-700">{validationError}</p>
                 <div className="mt-3">
                   <Button 
                     variant="outline" 
                     size="sm"
                     onClick={() => router.push('/dean/leave')}
                     className="text-red-700 border-red-300 hover:bg-red-100"
                   >
                     View Pending Applications
                   </Button>
                 </div>
               </div>
             )}
             
             <div className="text-center">
               <h1 className="text-3xl font-bold tracking-tight">Apply for Leave or Travel</h1>
               <p className="text-muted-foreground mt-2">
                 Choose the type of application you want to submit. Your application will be automatically approved.
               </p>
             </div>

                         <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
               <Card 
                 className={`transition-shadow ${
                   canApply 
                     ? 'cursor-pointer hover:shadow-lg' 
                     : 'cursor-not-allowed opacity-60'
                 }`} 
                 onClick={canApply ? handleLeaveApplicationChoice : undefined}
               >
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>Leave Application</CardTitle>
                  <CardDescription>
                    Apply for various types of leave including vacation, sick, maternity, paternity, and emergency leave
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Vacation Leave</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Sick Leave</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Maternity/Paternity Leave</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Emergency Leave</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

                             <Card 
                 className={`transition-shadow ${
                   canApply 
                     ? 'cursor-pointer hover:shadow-lg' 
                     : 'cursor-not-allowed opacity-60'
                 }`} 
                 onClick={canApply ? handleTravelOrderChoice : undefined}
               >
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Plane className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>Travel Order</CardTitle>
                  <CardDescription>
                    Request travel orders for conferences, seminars, and official business trips
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Conference Travel</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Seminar Attendance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Official Business</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Training Programs</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      
      case 'leave-types':
        return (
          <LeaveTypeSelection 
            onSelect={handleLeaveTypeSelect}
            onBack={handleBackToChoice}
            isLoading={isLoading}
          />
        )
      
      case 'leave-limits':
        // For deans, skip this step and go directly to form
        return null
      
      case 'leave-form':
                 return (
           <LeaveApplicationForm
             leaveType={selectedLeaveType}
             leaveLimit={leaveLimits}
             userData={userData}
             onSubmit={handleFormSubmit}
             onBack={handleBackToLeaveTypes}
             isLoading={isLoading}
           />
         )
      
      case 'travel-form':
        return (
          <TravelOrderForm
            userData={userData}
            onSubmit={handleTravelOrderSubmit}
            onBack={handleBackToChoice}
            isLoading={isLoading}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
                     <Button
             variant="ghost"
             onClick={() => router.push('/dean/leave')}
             className="mb-4"
           >
             <ArrowLeft className="h-4 w-4 mr-2" />
             Back to Leave Management
           </Button>
          
          {currentStep !== 'choice' && (
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">
                  {currentStep === 'leave-types' && 'Select Leave Type'}
                  {currentStep === 'leave-form' && 'Complete Leave Application'}
                  {currentStep === 'travel-form' && 'Travel Order Application'}
                </h1>
                <p className="text-gray-600 mt-2">
                  {currentStep === 'leave-types' && 'Choose the type of leave you want to apply for'}
                  {currentStep === 'leave-form' && 'Fill out your leave application details'}
                  {currentStep === 'travel-form' && 'Fill out your travel order details'}
                </p>
              </div>
              
              {/* Progress indicator */}
              {currentStep !== 'travel-form' && (
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${currentStep === 'leave-types' ? 'bg-blue-600' : 'bg-gray-300'}`} />
                  <div className={`w-3 h-3 rounded-full ${currentStep === 'leave-form' ? 'bg-blue-600' : 'bg-gray-300'}`} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main content */}
        {renderStep()}
      </div>
    </div>
  )
}
