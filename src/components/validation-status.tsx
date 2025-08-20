"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Calendar,
  XCircle,
  FileText,
  Plane
} from "lucide-react"
import { useRouter } from "next/navigation"
import { formatDateForDisplay, getApplicationTypeName } from "@/lib/validation-service"

interface ValidationStatusProps {
  onValidationChange?: (canApply: boolean) => void
  validationApi?: string
  applyPath?: string
}

interface ValidationResult {
  canApply: boolean
  reason?: string
  pendingApplications?: any[]
  conflictingApplications?: any[]
}

export default function ValidationStatus({ 
  onValidationChange, 
  validationApi = '/api/teacher/validation',
  applyPath = '/teacher/leave/apply'
}: ValidationStatusProps) {
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkValidation()
  }, [])

  useEffect(() => {
    if (validation) {
      onValidationChange?.(validation.canApply)
    }
  }, [validation, onValidationChange])

  const checkValidation = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(validationApi)
      
      if (response.ok) {
        const data = await response.json()
        setValidation(data)
      } else {
        console.error('Error checking validation:', response.status)
        setValidation({ canApply: true }) // Default to allowing if check fails
      }
    } catch (error) {
      console.error('Error checking validation:', error)
      setValidation({ canApply: true }) // Default to allowing if check fails
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Checking Application Status...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!validation) {
    return null
  }

  if (validation.canApply) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            Ready to Apply
          </CardTitle>
          <CardDescription className="text-green-700">
            You can submit a new leave application or travel order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              onClick={() => router.push(applyPath)}
              className="bg-green-600 hover:bg-green-700"
            >
              Apply for Leave
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <XCircle className="h-5 w-5" />
          Cannot Apply
        </CardTitle>
        <CardDescription className="text-red-700">
          {validation.reason}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pending Applications */}
        {validation.pendingApplications && validation.pendingApplications.length > 0 && (
          <div>
            <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Applications
            </h4>
            <div className="space-y-2">
              {validation.pendingApplications.map((app: any) => (
                <div key={app.id} className="bg-white p-3 rounded border border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {app.type === 'leave' ? (
                        <FileText className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Plane className="h-4 w-4 text-green-600" />
                      )}
                      <Badge variant="outline" className="text-xs">
                        {getApplicationTypeName(app.type)}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      Applied: {formatDateForDisplay(app.appliedAt)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium">
                      {app.type === 'leave' ? app.leaveType?.name : 'Travel Order'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {app.type === 'leave' ? (
                        app.leaveType?.name === 'Sick Leave' || app.leaveType?.name === 'Emergency Leave' 
                          ? (app.descriptionOfSickness || app.reason)
                          : app.specificPurpose || app.reason
                      ) : app.purpose}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
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
          </div>
        )}

        {/* Conflicting Applications */}
        {validation.conflictingApplications && validation.conflictingApplications.length > 0 && (
          <div>
            <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Conflicting Approved Applications
            </h4>
            <div className="space-y-2">
              {validation.conflictingApplications.map((app: any) => (
                <div key={app.id} className="bg-white p-3 rounded border border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {app.type === 'leave' ? (
                        <FileText className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Plane className="h-4 w-4 text-green-600" />
                      )}
                      <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                        Approved
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium">
                      {app.type === 'leave' ? app.leaveType?.name : 'Travel Order'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {app.type === 'leave' ? (
                        app.leaveType?.name === 'Sick Leave' || app.leaveType?.name === 'Emergency Leave' 
                          ? (app.descriptionOfSickness || app.reason)
                          : app.specificPurpose || app.reason
                      ) : app.purpose}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
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
          </div>
        )}

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please wait for your pending applications to be reviewed, or choose different dates that don't conflict with your approved applications.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
