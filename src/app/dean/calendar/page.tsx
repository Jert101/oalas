"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock } from "lucide-react"

export default function DeanCalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Calendar Overview</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          View department calendar and leave schedules
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Department Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Calendar coming soon</h3>
            <p className="mt-1 text-sm text-gray-500">
              Calendar view and scheduling features will be available soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
