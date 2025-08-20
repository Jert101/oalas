"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  User,
  Building,
  Award
} from "lucide-react"

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

interface LeaveBalance {
  allowedDays: number
  usedDays: number
  remainingDays: number
  leaveType: {
    name: string
  }
}

interface UserData {
  name: string
  department: string
  status: string
}

interface CurrentPeriod {
  calendar_period_id: number
  academicYear: string
  startDate: string
  endDate: string
  termType: {
    name: string
  }
}

interface LeaveLimitsDisplayProps {
  leaveType: LeaveType | null
  leaveLimit: LeaveLimit | null
  leaveBalance: LeaveBalance | null
  userData: UserData | null
  onProceed: () => void
  onBack: () => void
  isLoading: boolean
}

export function LeaveLimitsDisplay({ 
  leaveType, 
  leaveLimit, 
  leaveBalance, 
  userData, 
  onProceed, 
  onBack, 
  isLoading 
}: LeaveLimitsDisplayProps) {
  const [currentPeriod, setCurrentPeriod] = useState<CurrentPeriod | null>(null)
  const [periodLoading, setPeriodLoading] = useState(true)

  // Fetch current calendar period
  useEffect(() => {
    const fetchCurrentPeriod = async () => {
      try {
        setPeriodLoading(true)
        const response = await fetch('/api/calendar-period/current')
        
        if (response.ok) {
          const data = await response.json()
          setCurrentPeriod(data)
        } else {
          console.error('Failed to fetch current period:', response.status)
        }
      } catch (error) {
        console.error('Error fetching current period:', error)
      } finally {
        setPeriodLoading(false)
      }
    }

    fetchCurrentPeriod()
  }, [])

  if (!leaveType || !leaveLimit || !leaveBalance || !userData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">Unable to load leave information</p>
        </div>
      </div>
    )
  }

  const usagePercentage = leaveBalance.allowedDays > 0 
    ? (leaveBalance.usedDays / leaveBalance.allowedDays) * 100 
    : 0

  const getStatusColor = () => {
    if (leaveBalance.remainingDays === 0) return 'text-red-600'
    if (usagePercentage > 80) return 'text-orange-600'
    return 'text-green-600'
  }

  const getStatusText = () => {
    if (leaveBalance.remainingDays === 0) return 'No days remaining'
    if (usagePercentage > 80) return 'Limited days remaining'
    return 'Days available'
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Leave Limits & Balance</h2>
        <p className="text-muted-foreground mt-2">
          Review your leave allocation for {leaveType.name}
        </p>
      </div>

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Employee Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Name:</span>
              <span className="text-gray-600">{userData.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span className="font-medium">Department:</span>
              <span className="text-gray-600">{userData.department}</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span className="font-medium">Status:</span>
              <Badge variant="outline">{userData.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Type Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave Type Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{leaveType.name}</h3>
              <p className="text-gray-600">{leaveType.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Leave Balance
          </CardTitle>
          <CardDescription>
            Your current leave allocation and usage for this semester
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Leave Usage</span>
                <span className={getStatusColor()}>{getStatusText()}</span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{leaveBalance.usedDays} days used</span>
                <span>{leaveBalance.allowedDays} days total</span>
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{leaveBalance.allowedDays}</div>
                <div className="text-sm text-gray-600">Allowed Days</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{leaveBalance.usedDays}</div>
                <div className="text-sm text-gray-600">Used Days</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{leaveBalance.remainingDays}</div>
                <div className="text-sm text-gray-600">Remaining Days</div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Payment Status</h4>
                  <p className="text-sm text-gray-600">
                    {leaveBalance.remainingDays > 0 
                      ? 'Leave will be paid from your remaining allocation'
                      : 'Leave will be unpaid (no remaining days)'
                    }
                  </p>
                </div>
                <Badge variant={leaveBalance.remainingDays > 0 ? "default" : "secondary"}>
                  {leaveBalance.remainingDays > 0 ? 'PAID' : 'UNPAID'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Academic Period */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Current Academic Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          {periodLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading current period...</span>
            </div>
          ) : currentPeriod ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <span className="font-medium">Academic Year:</span>
                <span className="ml-2 text-gray-600">{currentPeriod.academicYear}</span>
              </div>
              <div>
                <span className="font-medium">Current Term:</span>
                <span className="ml-2 text-gray-600">{currentPeriod.termType.name}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-gray-600">Unable to load current period</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Leave Types
        </Button>
        
        <Button
          onClick={onProceed}
          disabled={isLoading}
        >
          Proceed to Application
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
