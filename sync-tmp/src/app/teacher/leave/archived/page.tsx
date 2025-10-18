"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ArrowLeft,
  FileText,
  Archive
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ArchivedApplication {
  id: string
  leaveType: string
  startDate: string
  endDate: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  appliedAt: string
  reason: string
  numberOfDays: number
  hours: number
  comments?: string
  paymentStatus: string
  specificPurpose?: string
  descriptionOfSickness?: string
  academicYear: string
  termType: string
}

interface CalendarPeriod {
  calendar_period_id: number
  academicYear: string
  termType: {
    name: string
  }
  startDate: string
  endDate: string
  applications: ArchivedApplication[]
}

export default function ArchivedPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [archivedPeriods, setArchivedPeriods] = useState<CalendarPeriod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<ArchivedApplication | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  useEffect(() => {
    fetchArchivedData()
  }, [])

  const fetchArchivedData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/teacher/leave/archived')
      
      if (response.ok) {
        const data = await response.json()
        setArchivedPeriods(data.periods || [])
      } else {
        console.error('Error fetching archived data:', response.status)
      }
    } catch (error) {
      console.error('Error fetching archived data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
      case 'REJECTED':
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
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleViewApplication = (application: ArchivedApplication) => {
    setSelectedApplication(application)
    setIsViewDialogOpen(true)
  }

  const totalApplications = archivedPeriods.reduce((total, period) => total + period.applications.length, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Archived Applications</h1>
          <p className="text-muted-foreground">
            View your leave applications from past calendar periods
          </p>
        </div>
        <Button onClick={() => router.push('/teacher/leave')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Leave Management
        </Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{archivedPeriods.length}</div>
              <div className="text-sm text-gray-600">Past Periods</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{totalApplications}</div>
              <div className="text-sm text-gray-600">Total Applications</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {archivedPeriods.length > 0 ? Math.round(totalApplications / archivedPeriods.length) : 0}
              </div>
              <div className="text-sm text-gray-600">Avg per Period</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Archived Periods */}
      {archivedPeriods.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Archive className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No archived periods</h3>
            <p className="mt-1 text-sm text-gray-500">
              No past calendar periods with applications found.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {archivedPeriods.map((period) => (
            <Card key={period.calendar_period_id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {period.academicYear} - {period.termType.name}
                </CardTitle>
                <CardDescription>
                  {formatDate(period.startDate)} to {formatDate(period.endDate)} • {period.applications.length} application{period.applications.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {period.applications.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">No applications in this period</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {period.applications.map((application) => (
                      <div
                        key={application.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {getStatusIcon(application.status)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-lg font-medium text-gray-900">
                                {application.leaveType}
                              </h3>
                              {getStatusBadge(application.status)}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {application.reason}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(application.startDate)} - {formatDate(application.endDate)}
                              </span>
                              <span>{application.numberOfDays} day{application.numberOfDays !== 1 ? 's' : ''}</span>
                              <span>Applied on {formatDate(application.appliedAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewApplication(application)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Application Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Application Details
            </DialogTitle>
            <DialogDescription>
              Complete details of the archived leave application
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium text-gray-900">Leave Type</h4>
                  <p className="text-gray-600">{selectedApplication.leaveType}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Status</h4>
                  <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Start Date</h4>
                  <p className="text-gray-600">{formatDate(selectedApplication.startDate)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">End Date</h4>
                  <p className="text-gray-600">{formatDate(selectedApplication.endDate)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Number of Days</h4>
                  <p className="text-gray-600">{selectedApplication.numberOfDays} day{selectedApplication.numberOfDays !== 1 ? 's' : ''}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Hours</h4>
                  <p className="text-gray-600">{selectedApplication.hours} hour{selectedApplication.hours !== 1 ? 's' : ''}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Payment Status</h4>
                  <p className="text-gray-600">{selectedApplication.paymentStatus}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Applied On</h4>
                  <p className="text-gray-600">{formatDate(selectedApplication.appliedAt)}</p>
                </div>
              </div>

              {/* Period Information */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Calendar Period</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <span className="text-sm text-gray-500">Academic Year:</span>
                    <p className="text-gray-900">{selectedApplication.academicYear}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Term:</span>
                    <p className="text-gray-900">{selectedApplication.termType}</p>
                  </div>
                </div>
              </div>

              {/* Reason/Purpose */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Reason/Purpose</h4>
                <p className="text-gray-600">{selectedApplication.reason}</p>
              </div>

              {/* Specific Purpose or Description */}
              {selectedApplication.specificPurpose && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Specific Purpose</h4>
                  <p className="text-gray-600">{selectedApplication.specificPurpose}</p>
                </div>
              )}

              {selectedApplication.descriptionOfSickness && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Description of Sickness</h4>
                  <p className="text-gray-600">{selectedApplication.descriptionOfSickness}</p>
                </div>
              )}

              {/* Comments */}
              {selectedApplication.comments && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Comments</h4>
                  <p className="text-gray-600">{selectedApplication.comments}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
