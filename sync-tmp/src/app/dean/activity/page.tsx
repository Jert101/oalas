"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, Clock } from "lucide-react"

export default function DeanActivityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Recent Activity</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          View recent activities and updates in your department
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Activity feed coming soon</h3>
            <p className="mt-1 text-sm text-gray-500">
              Recent activity tracking and notifications will be available soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
