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
  Plane, 
  User, 
  Building, 
  FileText,
  ArrowLeft,
  Upload,
  Loader2,
  Calculator
} from "lucide-react"
import { toast } from "sonner"
import DateValidation from "@/components/date-validation"

interface UserData {
  name: string
  department: string
  status: string
}

interface TravelOrderFormProps {
  userData: UserData | null
  onSubmit: (data: FormData & {
    name: string;
    department: string;
    dateCreated: string;
    totalCashRequested: number;
    supportingDocuments: File | null;
  }) => void
  onBack: () => void
  isLoading: boolean
}

// Travel Order Schema
const travelOrderSchema = z.object({
  destination: z.string().min(1, "Destination is required"),
  purpose: z.string().min(1, "Purpose is required"),
  dateOfTravel: z.string().min(1, "Date of travel is required"),
  expectedReturn: z.string().min(1, "Expected return date is required"),
  transportationFee: z.number().min(0, "Transportation fee must be 0 or greater"),
  seminarConferenceFee: z.number().min(0, "Seminar/Conference fee must be 0 or greater"),
  mealsAccommodations: z.number().min(0, "Meals & Accommodations must be 0 or greater"),
  remarks: z.string().optional(),
})

type FormData = z.infer<typeof travelOrderSchema>

export function TravelOrderForm({ 
  userData, 
  onSubmit, 
  onBack, 
  isLoading 
}: TravelOrderFormProps) {
  const [totalCashRequested, setTotalCashRequested] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDateValid, setIsDateValid] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<FormData>({
    resolver: zodResolver(travelOrderSchema),
    mode: "onChange"
  })

  const transportationFee = watch("transportationFee") || 0
  const seminarConferenceFee = watch("seminarConferenceFee") || 0
  const mealsAccommodations = watch("mealsAccommodations") || 0
  const dateOfTravel = watch("dateOfTravel")
  const expectedReturn = watch("expectedReturn")

  // Calculate total when fees change
  useEffect(() => {
    const total = Number(transportationFee) + Number(seminarConferenceFee) + Number(mealsAccommodations)
    setTotalCashRequested(total)
  }, [transportationFee, seminarConferenceFee, mealsAccommodations])

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0]

  const handleFormSubmit = (data: FormData) => {
    if (!userData) return

    const formData = {
      ...data,
      name: userData.name,
      department: userData.department,
      dateCreated: new Date().toISOString(),
      totalCashRequested,
      supportingDocuments: selectedFile
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

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Unable to load user data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Travel Order Application</h2>
        <p className="text-muted-foreground mt-2">
          Complete your travel order request
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
                <Label>Application Type</Label>
                <Input value="Travel Order" disabled className="bg-gray-50" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Travel Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Travel Information
            </CardTitle>
            <CardDescription>
              Provide details about your travel request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="destination">Destination *</Label>
                <Input
                  id="destination"
                  placeholder="e.g., Manila, Cebu, etc."
                  {...register("destination")}
                  className={errors.destination ? "border-red-500" : ""}
                />
                {errors.destination && (
                  <p className="text-red-500 text-sm mt-1">{errors.destination.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="purpose">Purpose *</Label>
                <Input
                  id="purpose"
                  placeholder="e.g., Conference, Seminar, Training"
                  {...register("purpose")}
                  className={errors.purpose ? "border-red-500" : ""}
                />
                {errors.purpose && (
                  <p className="text-red-500 text-sm mt-1">{errors.purpose.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Travel Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Travel Dates</CardTitle>
            <CardDescription>
              Select your travel and return dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="dateOfTravel">Date of Travel *</Label>
                <Input
                  id="dateOfTravel"
                  type="date"
                  min={today}
                  {...register("dateOfTravel")}
                  className={errors.dateOfTravel ? "border-red-500" : ""}
                />
                {errors.dateOfTravel && (
                  <p className="text-red-500 text-sm mt-1">{errors.dateOfTravel.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="expectedReturn">Expected Return *</Label>
                <Input
                  id="expectedReturn"
                  type="date"
                  min={dateOfTravel || today}
                  {...register("expectedReturn")}
                  className={errors.expectedReturn ? "border-red-500" : ""}
                />
                {errors.expectedReturn && (
                  <p className="text-red-500 text-sm mt-1">{errors.expectedReturn.message}</p>
                )}
              </div>
            </div>

            {/* Date Validation */}
            {dateOfTravel && expectedReturn && (
              <div className="mt-4">
                <DateValidation 
                  startDate={dateOfTravel}
                  endDate={expectedReturn}
                  onValidationChange={setIsDateValid}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Financial Details
            </CardTitle>
            <CardDescription>
              Specify the costs for your travel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="transportationFee">Transportation Fee (₱) *</Label>
                  <Input
                    id="transportationFee"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    {...register("transportationFee", { valueAsNumber: true })}
                    className={errors.transportationFee ? "border-red-500" : ""}
                  />
                  {errors.transportationFee && (
                    <p className="text-red-500 text-sm mt-1">{errors.transportationFee.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="seminarConferenceFee">Seminar/Conference Fee (₱) *</Label>
                  <Input
                    id="seminarConferenceFee"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    {...register("seminarConferenceFee", { valueAsNumber: true })}
                    className={errors.seminarConferenceFee ? "border-red-500" : ""}
                  />
                  {errors.seminarConferenceFee && (
                    <p className="text-red-500 text-sm mt-1">{errors.seminarConferenceFee.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="mealsAccommodations">Meals & Accommodations (₱) *</Label>
                  <Input
                    id="mealsAccommodations"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    {...register("mealsAccommodations", { valueAsNumber: true })}
                    className={errors.mealsAccommodations ? "border-red-500" : ""}
                  />
                  {errors.mealsAccommodations && (
                    <p className="text-red-500 text-sm mt-1">{errors.mealsAccommodations.message}</p>
                  )}
                </div>
              </div>
              
              {/* Total Calculation */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Total Cash Requested</h4>
                    <p className="text-sm text-gray-600">
                      Automatically calculated from the fees above
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      ₱{totalCashRequested.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-gray-500">
                      Total amount requested
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supporting Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Supporting Documents</CardTitle>
            <CardDescription>
              Upload proof of supporting details for the seminar or conference
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="supportingDocuments">Proof of Supporting Details (Optional)</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="supportingDocuments"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                />
                <Upload className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Accepted formats: PDF, JPG, JPEG, PNG, DOC, DOCX. Maximum file size: 50MB
              </p>
              {selectedFile && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    ✓ File selected: {selectedFile.name}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Remarks */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="remarks">Remarks (Optional)</Label>
              <Textarea
                id="remarks"
                placeholder="Add any additional information or special requests..."
                {...register("remarks")}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Choice
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
              'Submit Travel Order'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}



