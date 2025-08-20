"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserCheck, Users } from "lucide-react"

export default function DeanFacultyStatusPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Faculty Status</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage faculty employment status and probation periods
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Status Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Status management coming soon</h3>
            <p className="mt-1 text-sm text-gray-500">
              Faculty status management features will be available soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
