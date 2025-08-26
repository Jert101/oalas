"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRealtimeApplications } from '@/hooks/use-realtime'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  Calendar,
  FileText,
  Wifi,
  WifiOff
} from 'lucide-react'

interface Application {
  id: string
  user: {
    name: string
    email: string
    profilePicture?: string
    department?: {
      name: string
    }
  }
  leaveType: {
    name: string
  }
  status: string
  startDate: string
  endDate: string
  reason: string
  appliedAt: string
}

export function RealtimeApplications() {
  const { data: session } = useSession()
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  
  // Real-time applications hook
  const { applications: realtimeApps, isConnected } = useRealtimeApplications(session?.user?.users_id)

  // Fetch initial applications
  useEffect(() => {
    fetchApplications()
  }, [session?.user?.users_id])

  // Update applications when real-time data arrives
  useEffect(() => {
    if (realtimeApps.length > 0) {
      setApplications(realtimeApps)
      setIsLoading(false)
    }
  }, [realtimeApps])

  const fetchApplications = async () => {
    if (!session?.user?.users_id) return

    try {
      setIsLoading(true)
      const endpoint = getApplicationsEndpoint(session.user.role)
      const response = await fetch(endpoint)
      const data = await response.json()
      
      if (data.success) {
        setApplications(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getApplicationsEndpoint = (role: string) => {
    switch (role) {
      case 'Teacher/Instructor':
        return '/api/teacher/leave-applications'
      case 'Dean/Program Head':
        return '/api/dean/applications'
      case 'Finance Department':
        return '/api/finance/applications'
      default:
        return '/api/admin/leave-applications'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'DENIED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'DENIED':
        return 'bg-red-100 text-red-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true
    return app.status === filter
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Header with Connection Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Leave Applications</h2>
          <p className="text-gray-600">Real-time updates of all applications</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm text-gray-600">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({applications.length})
        </Button>
        <Button
          variant={filter === 'PENDING' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('PENDING')}
        >
          Pending ({applications.filter(app => app.status === 'PENDING').length})
        </Button>
        <Button
          variant={filter === 'APPROVED' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('APPROVED')}
        >
          Approved ({applications.filter(app => app.status === 'APPROVED').length})
        </Button>
        <Button
          variant={filter === 'DENIED' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('DENIED')}
        >
          Denied ({applications.filter(app => app.status === 'DENIED').length})
        </Button>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No applications found</p>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={application.user.profilePicture} />
                      <AvatarFallback>
                        {getInitials(application.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{application.user.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {application.user.department?.name || 'No Department'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>{application.user.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span>{application.leaveType.name}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {formatDate(application.startDate)} - {formatDate(application.endDate)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Applied: {formatDateTime(application.appliedAt)}
                          </div>
                        </div>
                      </div>
                      
                      {application.reason && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Reason:</strong> {application.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(application.status)}
                      <Badge className={getStatusColor(application.status)}>
                        {application.status}
                      </Badge>
                    </div>
                    
                    {session?.user?.role !== 'Teacher/Instructor' && application.status === 'PENDING' && (
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700">
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          Deny
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Real-time Status */}
      <div className="text-center text-sm text-gray-500">
        {isConnected ? (
          <span className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live updates active - {filteredApplications.length} applications shown</span>
          </span>
        ) : (
          <span className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Offline mode - showing cached data</span>
          </span>
        )}
      </div>
    </div>
  )
}

