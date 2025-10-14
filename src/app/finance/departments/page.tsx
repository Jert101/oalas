"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Building,
  Users,
  FileText,
  CheckCircle,
  Clock
} from "lucide-react"

interface Department {
  department_id: number
  name: string
  description: string
  totalFaculty: number
  totalApplications: number
  approvedApplications: number
  pendingApplications: number
  deniedApplications: number
  faculty: Array<{
    users_id: number
    name: string
    email: string
    role: string
    isActive: boolean
  }>
}

interface DepartmentData {
  departments: Department[]
  summary: {
    totalDepartments: number
    totalFaculty: number
    totalApplications: number
    approvedApplications: number
    pendingApplications: number
    deniedApplications: number
  }
}

export default function FinanceDepartmentsPage() {
  const [data, setData] = useState<DepartmentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await fetch('/api/finance/departments')
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setData(result.data)
          }
        }
      } catch (error) {
        console.error('Error loading departments:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadDepartments()
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
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Department Overview</h1>
        <p className="text-muted-foreground">
          Overview of all departments and their leave application statistics
        </p>
      </div>

      {!data || data.departments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No departments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No departments are currently available in the system.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {data.departments.map((department) => (
              <Card key={department.department_id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {department.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Faculty:</span>
                      <span className="text-sm font-medium">{department.totalFaculty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Applications:</span>
                      <span className="text-sm font-medium">{department.totalApplications}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Approved:</span>
                      <Badge className="bg-green-100 text-green-800 text-xs">{department.approvedApplications}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Pending:</span>
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs">{department.pendingApplications}</Badge>
                    </div>
                    {department.deniedApplications > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Denied:</span>
                        <Badge className="bg-red-100 text-red-800 text-xs">{department.deniedApplications}</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Department Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{data.summary.totalDepartments}</div>
                  <div className="text-sm text-gray-600">Total Departments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{data.summary.totalFaculty}</div>
                  <div className="text-sm text-gray-600">Total Faculty</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{data.summary.totalApplications}</div>
                  <div className="text-sm text-gray-600">Total Applications</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{data.summary.approvedApplications}</div>
                  <div className="text-sm text-gray-600">Approved Applications</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
