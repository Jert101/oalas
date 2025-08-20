"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Calendar,
  Users,
  Building
} from "lucide-react"

interface LeaveApplication {
  leave_application_id: number
  startDate: string
  endDate: string
  status: 'PENDING' | 'DEAN_APPROVED' | 'DEAN_REJECTED' | 'APPROVED' | 'DENIED'
  appliedAt: string
  reason: string
  numberOfDays: number
  hours: number
  specificPurpose?: string
  descriptionOfSickness?: string
  medicalProof?: string
  paymentStatus: 'PAID' | 'UNPAID'
  leaveType?: {
    leave_type_id: number
    name: string
    description?: string
  }
  user: {
    name: string
    email: string
    profilePicture: string
    department: {
      name: string
    }
  }
}

interface DeanApplicationsData {
  applications: LeaveApplication[]
  deanDepartment: string
  currentPeriod: {
    academicYear: string
    startDate: string
    endDate: string
  }
}

export default function DeanApplicationsPage() {
  const [applicationsData, setApplicationsData] = useState<DeanApplicationsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const res = await fetch('/api/dean/applications')
        if (!res.ok) throw new Error('Failed to load applications')
        const data = await res.json()
        if (data.success) {
          setApplicationsData(data.data)
        }
      } catch (error) {
        console.error('Error loading applications:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadApplications()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
      case 'DEAN_APPROVED':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Dean Approved</Badge>
      case 'DEAN_REJECTED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Dean Rejected</Badge>
      case 'DENIED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Denied</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleViewApplication = (applicationId: number) => {
    router.push(`/dean/applications/${applicationId}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Leave Applications</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Review and manage leave applications from your department faculty
        </p>
      </div>

      {/* Department Info */}
      {applicationsData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Department Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Department:</span>
                <span className="text-sm text-gray-600">{applicationsData.deanDepartment}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Academic Year:</span>
                <span className="text-sm text-gray-600">{applicationsData.currentPeriod.academicYear}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Total Applications:</span>
                <span className="text-sm text-gray-600">{applicationsData.applications.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Faculty Leave Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!applicationsData || applicationsData.applications.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No leave applications have been submitted from your department faculty yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {applicationsData.applications.map((application) => (
                <div
                  key={application.leave_application_id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors gap-4"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={application.user.profilePicture || '/ckcm.png'} alt={application.user.name} />
                      <AvatarFallback>{application.user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {application.user.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(application.startDate)} - {formatDate(application.endDate)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Applied on {formatDate(application.appliedAt)}
                      </p>
                                             <p className="text-xs text-gray-500">
                         {application.numberOfDays} days • {application.hours} hours
                       </p>
                       <div className="flex items-center gap-2 mt-1">
                         <span className="text-xs text-gray-500">
                           {application.leaveType?.name || 'N/A'}
                         </span>
                         <Badge className={application.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800 text-xs' : 'bg-red-100 text-red-800 text-xs'}>
                           {application.paymentStatus}
                         </Badge>
                       </div>
                       {application.reason && (
                         <p className="text-xs text-gray-600 mt-1">
                           Reason: {application.reason.substring(0, 100)}...
                         </p>
                       )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-wrap">
                    {getStatusBadge(application.status)}
                    {application.status === 'DENIED' && application.comments?.includes('Rejected by Finance Officer') && (
                      <Badge className="bg-orange-100 text-orange-800 text-xs">
                        Needs Review
                      </Badge>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewApplication(application.leave_application_id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
