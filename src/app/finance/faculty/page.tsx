"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Users,
  Building,
  Mail,
  Phone,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react"

interface FacultyMember {
  users_id: number
  name: string
  email: string
  profilePicture: string
  department: string
  role: string
  isActive: boolean
  isDepartmentHead: boolean
  totalApplications: number
  approvedApplications: number
  pendingApplications: number
  deniedApplications: number
  recentApplications: Array<{
    leave_application_id: number
    leaveType: string
    status: string
    startDate: string
    endDate: string
    appliedAt: string
  }>
}

interface FacultyData {
  faculty: FacultyMember[]
  summary: {
    totalFaculty: number
    totalApplications: number
    approvedApplications: number
    pendingApplications: number
    deniedApplications: number
    byRole: Record<string, { count: number; applications: number }>
    byDepartment: Record<string, { count: number; applications: number }>
  }
}

export default function FinanceFacultyPage() {
  const [data, setData] = useState<FacultyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadFaculty = async () => {
      try {
        const response = await fetch('/api/finance/faculty')
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setData(result.data)
          }
        }
      } catch (error) {
        console.error('Error loading faculty:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadFaculty()
  }, [])

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
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Faculty Directory</h1>
        <p className="text-muted-foreground">
          Complete directory of all faculty members and staff
        </p>
      </div>

      {!data || data.faculty.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No faculty found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No faculty members are currently available in the system.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {data.faculty.map((member) => (
              <Card key={member.users_id}>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage 
                        src={member.profilePicture || '/ckcm.png'} 
                        alt={member.name}
                        onError={(e) => {
                          const img = e.target as HTMLImageElement
                          if (img.src !== '/ckcm.png') {
                            img.src = '/ckcm.png'
                          }
                        }}
                      />
                      <AvatarFallback>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium">{member.name}</h3>
                      <p className="text-xs text-gray-500">{member.department}</p>
                      <p className="text-xs text-gray-400">{member.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-blue-100 text-blue-800 text-xs">{member.role}</Badge>
                        {member.isDepartmentHead && (
                          <Badge className="bg-purple-100 text-purple-800 text-xs">Head</Badge>
                        )}
                      </div>
                    </div>
                    <Badge className={member.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  {member.totalApplications > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Applications:</span>
                        <span className="font-medium">{member.totalApplications}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>Approved:</span>
                        <span className="text-green-600 font-medium">{member.approvedApplications}</span>
                      </div>
                      {member.pendingApplications > 0 && (
                        <div className="flex justify-between text-xs text-gray-600 mt-1">
                          <span>Pending:</span>
                          <span className="text-yellow-600 font-medium">{member.pendingApplications}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Faculty Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{data.summary.totalFaculty}</div>
                  <div className="text-sm text-gray-600">Total Faculty</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{data.summary.byRole['Teacher/Instructor']?.count || 0}</div>
                  <div className="text-sm text-gray-600">Teaching Staff</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{data.summary.byRole['Non Teaching Personnel']?.count || 0}</div>
                  <div className="text-sm text-gray-600">Non-Teaching Staff</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{Object.keys(data.summary.byDepartment).length}</div>
                  <div className="text-sm text-gray-600">Departments</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
