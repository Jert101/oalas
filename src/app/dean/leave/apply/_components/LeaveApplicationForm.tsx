"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Clock, 
  User, 
  Building, 
  FileText,
  ArrowLeft,
  Upload,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import DateValidation from "@/components/date-validation"

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

interface LeaveApplicationFormProps {
  leaveType: LeaveType | null
  leaveLimit: LeaveLimit | null
  userData: UserData | null
  onSubmit: (data: FormData) => void
  onBack: () => void
  isLoading: boolean
}

// Base schema for common fields
const baseSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  hours: z.number().min(1, "Hours is required").max(24, "Hours cannot exceed 24"),
})

// Vacation Leave Schema
const vacationSchema = baseSchema.extend({
  specificPurpose: z.string().min(1, "Specific purpose is required"),
})

// Sick Leave Schema
const sickSchema = baseSchema.extend({
  descriptionOfSickness: z.string().min(1, "Description of sickness is required"),
  medicalProof: z.instanceof(File).optional(),
})

// Maternity Leave Schema
const maternitySchema = baseSchema.extend({
  specificPurpose: z.string().min(1, "Specific purpose is required"),
})

// Paternity Leave Schema
const paternitySchema = baseSchema.extend({
  specificPurpose: z.string().min(1, "Specific purpose is required"),
})

// Emergency Leave Schema
const emergencySchema = baseSchema.extend({
  descriptionOfSickness: z.string().min(1, "Description of emergency is required"),
  medicalProof: z.instanceof(File).optional(),
})

export function LeaveApplicationForm({ 
  leaveType, 
  leaveLimit, 
  userData, 
  onSubmit, 
  onBack, 
  isLoading 
}: LeaveApplicationFormProps) {
  const [numberOfDays, setNumberOfDays] = useState(0)
  const [maxEndDate, setMaxEndDate] = useState<string | null>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDateValid, setIsDateValid] = useState(true)

  // Determine which schema to use based on leave type
  const getSchema = () => {
    if (!leaveType) return baseSchema
    
    switch (leaveType.name) {
      case 'Vacation Leave':
        return vacationSchema
      case 'Sick Leave':
        return sickSchema
      case 'Maternity Leave':
        return maternitySchema
      case 'Paternity Leave':
        return paternitySchema
      case 'Emergency Leave':
        return emergencySchema
      default:
        return baseSchema
    }
  }

  const schema = getSchema()
  type FormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange"
  })

  const startDate = watch("startDate")
  const endDate = watch("endDate")

  // Calculate number of days when dates change (business days only)
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
        
        setNumberOfDays(days)
      }
    }
  }, [startDate, endDate])

  // Set max end date based on start date and remaining days
  useEffect(() => {
    if (startDate && leaveLimit) {
      const start = new Date(startDate)
      // For dean applications, allow unlimited date selection
      // since deans can approve applications regardless of leave limits
      const maxDays = null // No restriction for dean applications
      
      if (maxDays !== null) {
        const maxEnd = new Date(start)
        maxEnd.setDate(start.getDate() + maxDays - 1)
        setMaxEndDate(maxEnd.toISOString().split('T')[0])
      } else {
        setMaxEndDate(null) // Remove restriction for dean applications
      }
    }
  }, [startDate, leaveLimit])

  // Set minimum start date to today
  const today = new Date().toISOString().split('T')[0]

  const handleFormSubmit = (data: FormData) => {
    if (!leaveType || !userData) return

    const formData = {
      ...data,
      numberOfDays,
      leaveTypeId: leaveType.leave_type_id,
              paymentStatus: 'PAID',
      name: userData.name,
      department: userData.department,
      dateCreated: new Date().toISOString(),
      typeOfLeave: leaveType.name,
      medicalProof: selectedFile
    }

    onSubmit(formData)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file size (50MB max)
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (file.size > maxSize) {
        toast.error('File size must be less than 50MB')
        event.target.value = ''
        return
      }
      setSelectedFile(file)
    }
  }

  if (!leaveType || !userData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Unable to load form data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Leave Application Form</h2>
        <p className="text-muted-foreground mt-2">
          Complete your {leaveType.name} application
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Employee Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Employee Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input value={userData.name} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>Department</Label>
                <Input value={userData.department} disabled className="bg-gray-50" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Application Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Date Created</Label>
                <Input 
                  value={new Date().toLocaleDateString()} 
                  disabled 
                  className="bg-gray-50" 
                />
              </div>
              <div>
                <Label>Type of Leave</Label>
                <Input value={leaveType.name} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>Payment Status</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value="PAID" 
                    disabled 
                    className="bg-gray-50" 
                  />
                  <Badge variant="default">
                    PAID
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leave Duration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Leave Duration
            </CardTitle>
            <CardDescription>
              Select the start and end dates for your leave
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="startDate">Duration From *</Label>
                <Input
                  id="startDate"
                  type="date"
                  min={today}
                  {...register("startDate")}
                  className={errors.startDate ? "border-red-500" : ""}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="endDate">Duration To *</Label>
                <Input
                  id="endDate"
                  type="date"
                  min={startDate || today}
                  max={maxEndDate || undefined}
                  {...register("endDate")}
                  className={errors.endDate ? "border-red-500" : ""}
                />
                {errors.endDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>
                )}
                {maxEndDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: {new Date(maxEndDate).toLocaleDateString()}
                  </p>
                )}
                {!maxEndDate && (
                  <p className="text-xs text-blue-600 mt-1">
                    📅 No date restriction (dean application)
                  </p>
                )}
              </div>
              <div>
                <Label>Number of Days</Label>
                <Input value={numberOfDays} disabled className="bg-gray-50" />
              </div>
            </div>

            {/* Date Validation */}
            {startDate && endDate && (
              <div className="mt-4">
                <DateValidation 
                  startDate={startDate}
                  endDate={endDate}
                  onValidationChange={setIsDateValid}
                />
              </div>
            )}

            <div className="mt-4">
              <Label htmlFor="hours">Hours *</Label>
              <Input
                id="hours"
                type="number"
                min="1"
                max="24"
                {...register("hours", { valueAsNumber: true })}
                className={errors.hours ? "border-red-500" : ""}
              />
              {errors.hours && (
                <p className="text-red-500 text-sm mt-1">{errors.hours.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leave Type Specific Fields */}
        {(leaveType.name === 'Vacation Leave' || leaveType.name === 'Maternity Leave' || leaveType.name === 'Paternity Leave') && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="specificPurpose">Specific Purpose *</Label>
                <Textarea
                  id="specificPurpose"
                  placeholder="Please provide details about the purpose of your leave..."
                  {...register("specificPurpose")}
                  className={errors.specificPurpose ? "border-red-500" : ""}
                />
                {errors.specificPurpose && (
                  <p className="text-red-500 text-sm mt-1">{errors.specificPurpose.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {(leaveType.name === 'Sick Leave' || leaveType.name === 'Emergency Leave') && (
          <Card>
            <CardHeader>
              <CardTitle>Medical Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="descriptionOfSickness">
                    {leaveType.name === 'Sick Leave' ? 'Description of Sickness' : 'Description of Emergency'} *
                  </Label>
                  <Textarea
                    id="descriptionOfSickness"
                    placeholder={`Please provide details about your ${leaveType.name === 'Sick Leave' ? 'sickness' : 'emergency'}...`}
                    {...register("descriptionOfSickness")}
                    className={errors.descriptionOfSickness ? "border-red-500" : ""}
                  />
                  {errors.descriptionOfSickness && (
                    <p className="text-red-500 text-sm mt-1">{errors.descriptionOfSickness.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="medicalProof">Medical Proof (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="medicalProof"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                    />
                    <Upload className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Accepted formats: PDF, JPG, JPEG, PNG. Maximum file size: 50MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}



        {/* Action Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Limits
          </Button>
          
          <Button
            type="submit"
            disabled={isLoading || !isValid || !isDateValid}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
