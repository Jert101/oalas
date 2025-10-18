"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar,
  Clock,
  Users,
  FileText
} from "lucide-react"

export default function FinanceCalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Calendar Overview</h1>
        <p className="text-muted-foreground">
          Calendar view of leave applications and important dates
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Current Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Academic Year:</span>
                <span className="text-sm font-medium">2024-2025</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Start Date:</span>
                <span className="text-sm font-medium">June 1, 2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">End Date:</span>
                <span className="text-sm font-medium">May 31, 2025</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Semester Break</p>
                  <p className="text-xs text-gray-500">December 15, 2024</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Holiday</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Academic Year End</p>
                  <p className="text-xs text-gray-500">May 31, 2025</p>
                </div>
                <Badge className="bg-orange-100 text-orange-800">Deadline</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Leave Application Cut-off</p>
                  <p className="text-xs text-gray-500">May 15, 2025</p>
                </div>
                <Badge className="bg-red-100 text-red-800">Important</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Monthly Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">January 2025:</span>
                <span className="text-sm font-medium">12 applications</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">February 2025:</span>
                <span className="text-sm font-medium">8 applications</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">March 2025:</span>
                <span className="text-sm font-medium">15 applications</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">April 2025:</span>
                <span className="text-sm font-medium">10 applications</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">May 2025:</span>
                <span className="text-sm font-medium">13 applications</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calendar Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Calendar integration coming soon</h3>
            <p className="mt-1 text-sm text-gray-500">
              Interactive calendar view will be available in the next update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
