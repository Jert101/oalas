"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Download,
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  CheckCircle,
  Clock
} from "lucide-react"

interface ReportData {
  reportType: string
  generatedAt: string
  dateRange: { startDate: string; endDate: string } | null
  totalApplications: number
  approvedApplications: number
  pendingApplications: number
  deniedApplications: number
  byLeaveType: Record<string, { total: number; approved: number; pending: number; denied: number }>
  byDepartment: Record<string, { total: number; approved: number; pending: number; denied: number }>
  monthlyTrends: Record<string, { total: number; approved: number; pending: number; denied: number }>
}

export default function FinanceReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedReportType, setSelectedReportType] = useState<string>('summary')

  const generateReport = async (reportType: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/finance/reports?type=${reportType}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setReportData(result.data)
          setSelectedReportType(reportType)
        }
      }
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Financial Reports</h1>
        <p className="text-muted-foreground">
          Generate and view financial reports and analytics
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Leave Application Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Summary report of all leave applications by status and department
            </p>
            <Button 
              className="w-full" 
              onClick={() => generateReport('summary')}
              disabled={isLoading}
            >
              {isLoading && selectedReportType === 'summary' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Approval Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Monthly trends of application approvals and rejections
            </p>
            <Button 
              className="w-full"
              onClick={() => generateReport('approval-trends')}
              disabled={isLoading}
            >
              {isLoading && selectedReportType === 'approval-trends' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detailed Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Detailed report with all application information
            </p>
            <Button 
              className="w-full"
              onClick={() => generateReport('detailed')}
              disabled={isLoading}
            >
              {isLoading && selectedReportType === 'detailed' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Results - {reportData.reportType.charAt(0).toUpperCase() + reportData.reportType.slice(1)}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Generated on {new Date(reportData.generatedAt).toLocaleString()}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Summary Statistics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{reportData.totalApplications}</div>
                  <div className="text-sm text-gray-600">Total Applications</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{reportData.approvedApplications}</div>
                  <div className="text-sm text-gray-600">Approved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{reportData.pendingApplications}</div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{reportData.deniedApplications}</div>
                  <div className="text-sm text-gray-600">Denied</div>
                </div>
              </div>

              {/* By Leave Type */}
              {Object.keys(reportData.byLeaveType).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">By Leave Type</h3>
                  <div className="grid gap-2">
                    {Object.entries(reportData.byLeaveType).map(([type, stats]) => (
                      <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">{type}</span>
                        <div className="flex gap-2">
                          <Badge className="bg-blue-100 text-blue-800">{stats.total}</Badge>
                          <Badge className="bg-green-100 text-green-800">{stats.approved}</Badge>
                          <Badge className="bg-yellow-100 text-yellow-800">{stats.pending}</Badge>
                          <Badge className="bg-red-100 text-red-800">{stats.denied}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* By Department */}
              {Object.keys(reportData.byDepartment).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">By Department</h3>
                  <div className="grid gap-2">
                    {Object.entries(reportData.byDepartment).map(([dept, stats]) => (
                      <div key={dept} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">{dept}</span>
                        <div className="flex gap-2">
                          <Badge className="bg-blue-100 text-blue-800">{stats.total}</Badge>
                          <Badge className="bg-green-100 text-green-800">{stats.approved}</Badge>
                          <Badge className="bg-yellow-100 text-yellow-800">{stats.pending}</Badge>
                          <Badge className="bg-red-100 text-red-800">{stats.denied}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No reports generated yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Generate your first report using the options above.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
