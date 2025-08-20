"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Heart, 
  Baby, 
  AlertTriangle, 
  Clock,
  ArrowLeft,
  Loader2
} from "lucide-react"

interface LeaveType {
  leave_type_id: number
  name: string
  description: string
}

interface LeaveTypeSelectionProps {
  onSelect: (leaveType: LeaveType) => void
  onBack: () => void
  isLoading: boolean
}

const leaveTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Vacation Leave': Calendar,
  'Sick Leave': Heart,
  'Maternity Leave': Baby,
  'Paternity Leave': Baby,
  'Emergency Leave': AlertTriangle
}

const leaveTypeColors: Record<string, string> = {
  'Vacation Leave': 'bg-blue-100 text-blue-600',
  'Sick Leave': 'bg-red-100 text-red-600',
  'Maternity Leave': 'bg-pink-100 text-pink-600',
  'Paternity Leave': 'bg-purple-100 text-purple-600',
  'Emergency Leave': 'bg-orange-100 text-orange-600'
}

export function LeaveTypeSelection({ onSelect, onBack, isLoading }: LeaveTypeSelectionProps) {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaveTypes()
  }, [])

  const fetchLeaveTypes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/teacher/leave-types')
      if (response.ok) {
        const data = await response.json()
        // Get first 5 leave types (excluding Travel Order)
        const filteredTypes = data.leave_types
          .filter((type: LeaveType) => type.name !== 'Travel Order')
          .slice(0, 5)
        setLeaveTypes(filteredTypes)
      }
    } catch (error) {
      console.error('Error fetching leave types:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (leaveTypeName: string) => {
    return leaveTypeIcons[leaveTypeName] || Clock
  }

  const getColor = (leaveTypeName: string) => {
    return leaveTypeColors[leaveTypeName] || 'bg-gray-100 text-gray-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading leave types...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Select Leave Type</h2>
        <p className="text-muted-foreground mt-2">
          Choose the type of leave you want to apply for
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {leaveTypes.map((leaveType) => {
          const IconComponent = getIcon(leaveType.name)
          const colorClass = getColor(leaveType.name)
          
          return (
            <Card 
              key={leaveType.leave_type_id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => !isLoading && onSelect(leaveType)}
            >
              <CardHeader className="text-center pb-3">
                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${colorClass}`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{leaveType.name}</CardTitle>
                <CardDescription className="text-sm">
                  {leaveType.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-center">
                  <Badge variant="outline" className="text-xs">
                    Click to select
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex justify-center pt-6">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Choice
        </Button>
      </div>
    </div>
  )
}
