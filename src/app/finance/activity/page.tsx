"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  User
} from "lucide-react"

export default function FinanceActivityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Recent Activity</h1>
        <p className="text-muted-foreground">
          Recent activities and actions in the finance department
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/ckcm.png" alt="Finance Officer" />
                <AvatarFallback>FO</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Finance Officer</span>
                  <Badge className="bg-green-100 text-green-800">Approved</Badge>
                  <span className="text-xs text-gray-500">2 minutes ago</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Approved leave application for <strong>John Doe</strong> (Computer Science)
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Application ID: #1234 • 5 days • Sick Leave
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/ckcm.png" alt="Finance Officer" />
                <AvatarFallback>FO</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Finance Officer</span>
                  <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                  <span className="text-xs text-gray-500">15 minutes ago</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Rejected leave application for <strong>Jane Smith</strong> (Information Technology)
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Application ID: #1235 • 3 days • Vacation Leave
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Reason: Insufficient documentation provided
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/ckcm.png" alt="Finance Officer" />
                <AvatarFallback>FO</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Finance Officer</span>
                  <Badge className="bg-green-100 text-green-800">Approved</Badge>
                  <span className="text-xs text-gray-500">1 hour ago</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Approved leave application for <strong>Mike Johnson</strong> (Business Administration)
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Application ID: #1236 • 2 days • Personal Leave
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/ckcm.png" alt="Finance Officer" />
                <AvatarFallback>FO</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Finance Officer</span>
                  <Badge className="bg-blue-100 text-blue-800">Viewed</Badge>
                  <span className="text-xs text-gray-500">2 hours ago</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Reviewed leave application for <strong>Sarah Wilson</strong> (Engineering)
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Application ID: #1237 • 7 days • Maternity Leave
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/ckcm.png" alt="Finance Officer" />
                <AvatarFallback>FO</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Finance Officer</span>
                  <Badge className="bg-green-100 text-green-800">Approved</Badge>
                  <span className="text-xs text-gray-500">3 hours ago</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Approved leave application for <strong>David Brown</strong> (Education)
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Application ID: #1238 • 1 day • Emergency Leave
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/ckcm.png" alt="Finance Officer" />
                <AvatarFallback>FO</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Finance Officer</span>
                  <Badge className="bg-purple-100 text-purple-800">Report Generated</Badge>
                  <span className="text-xs text-gray-500">5 hours ago</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Generated monthly leave application report
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Report: January 2025 Leave Applications Summary
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">15</div>
              <div className="text-sm text-gray-600">Approved Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">3</div>
              <div className="text-sm text-gray-600">Rejected Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">8</div>
              <div className="text-sm text-gray-600">Viewed Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">2</div>
              <div className="text-sm text-gray-600">Reports Generated</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
