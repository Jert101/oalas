"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  FileText,
  Plane
} from "lucide-react"
import { formatDateForDisplay, getApplicationTypeName } from "@/lib/validation-service"

interface DateValidationProps {
  startDate: string
  endDate: string
  onValidationChange?: (isValid: boolean) => void
}

interface ValidationResult {
  canApply: boolean
  reason?: string
  conflictingApplications?: any[]
}

export default function DateValidation({ 
  startDate, 
  endDate, 
  onValidationChange 
}: DateValidationProps) {
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (startDate && endDate) {
      checkDateValidation()
    } else {
      setValidation(null)
      onValidationChange?.(true)
    }
  }, [startDate, endDate])

  useEffect(() => {
    if (validation) {
      onValidationChange?.(validation.canApply)
    }
  }, [validation, onValidationChange])

  const checkDateValidation = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/teacher/validation?startDate=${startDate}&endDate=${endDate}`)
      
      if (response.ok) {
        const data = await response.json()
        setValidation(data)
      } else {
        console.error('Error checking date validation:', response.status)
        setValidation({ canApply: true }) // Default to allowing if check fails
      }
    } catch (error) {
      console.error('Error checking date validation:', error)
      setValidation({ canApply: true }) // Default to allowing if check fails
    } finally {
      setIsLoading(false)
    }
  }

  if (!startDate || !endDate) {
    return null
  }

  if (isLoading) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Checking date availability...
        </AlertDescription>
      </Alert>
    )
  }

  if (!validation) {
    return null
  }

  if (validation.canApply) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Selected dates are available for application
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        <div className="space-y-2">
          <p>{validation.reason}</p>
          
          {validation.conflictingApplications && validation.conflictingApplications.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="font-medium">Conflicting applications:</p>
              {validation.conflictingApplications.map((app: any) => (
                <div key={app.id} className="bg-white p-2 rounded border border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {app.type === 'leave' ? (
                        <FileText className="h-3 w-3 text-blue-600" />
                      ) : (
                        <Plane className="h-3 w-3 text-green-600" />
                      )}
                      <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                        Approved
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-1">
                    <p className="text-xs font-medium">
                      {app.type === 'leave' ? app.leaveType?.name : 'Travel Order'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {app.type === 'leave' ? app.reason : app.purpose}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {app.type === 'leave' 
                        ? `${formatDateForDisplay(app.startDate)} - ${formatDateForDisplay(app.endDate)}`
                        : `${formatDateForDisplay(app.dateOfTravel)} - ${formatDateForDisplay(app.expectedReturn)}`
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

