"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp } from "lucide-react"

export default function DeanReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Department Reports</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          View analytics and reports for your department
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Reports coming soon</h3>
            <p className="mt-1 text-sm text-gray-500">
              Detailed analytics and reporting features will be available soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
