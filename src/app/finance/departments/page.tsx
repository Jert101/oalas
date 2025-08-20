"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Building,
  Users,
  FileText,
  CheckCircle,
  Clock
} from "lucide-react"

export default function FinanceDepartmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Department Overview</h1>
        <p className="text-muted-foreground">
          Overview of all departments and their leave application statistics
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Computer Science
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Faculty:</span>
                <span className="text-sm font-medium">15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Applications:</span>
                <span className="text-sm font-medium">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Approved:</span>
                <Badge className="bg-green-100 text-green-800 text-xs">5</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pending:</span>
                <Badge className="bg-yellow-100 text-yellow-800 text-xs">3</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Information Technology
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Faculty:</span>
                <span className="text-sm font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Applications:</span>
                <span className="text-sm font-medium">6</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Approved:</span>
                <Badge className="bg-green-100 text-green-800 text-xs">4</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pending:</span>
                <Badge className="bg-yellow-100 text-yellow-800 text-xs">2</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Business Administration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Faculty:</span>
                <span className="text-sm font-medium">18</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Applications:</span>
                <span className="text-sm font-medium">10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Approved:</span>
                <Badge className="bg-green-100 text-green-800 text-xs">7</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pending:</span>
                <Badge className="bg-yellow-100 text-yellow-800 text-xs">3</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Engineering
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Faculty:</span>
                <span className="text-sm font-medium">20</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Applications:</span>
                <span className="text-sm font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Approved:</span>
                <Badge className="bg-green-100 text-green-800 text-xs">8</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pending:</span>
                <Badge className="bg-yellow-100 text-yellow-800 text-xs">4</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Faculty:</span>
                <span className="text-sm font-medium">14</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Applications:</span>
                <span className="text-sm font-medium">7</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Approved:</span>
                <Badge className="bg-green-100 text-green-800 text-xs">5</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pending:</span>
                <Badge className="bg-yellow-100 text-yellow-800 text-xs">2</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Non-Teaching Personnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Staff:</span>
                <span className="text-sm font-medium">25</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Applications:</span>
                <span className="text-sm font-medium">15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Approved:</span>
                <Badge className="bg-green-100 text-green-800 text-xs">10</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pending:</span>
                <Badge className="bg-yellow-100 text-yellow-800 text-xs">5</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">6</div>
              <div className="text-sm text-gray-600">Total Departments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">104</div>
              <div className="text-sm text-gray-600">Total Faculty</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">58</div>
              <div className="text-sm text-gray-600">Total Applications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">39</div>
              <div className="text-sm text-gray-600">Approved Applications</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
