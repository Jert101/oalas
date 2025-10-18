"use client"

import Link from "next/link"
import { 
  IconUsers, 
  IconUserPlus, 
  IconClipboardList, 
  IconCalendarStats,
  IconSettings,
  IconAlertTriangle
} from "@tabler/icons-react"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function AdminQuickActions() {
  const quickActions = [
    {
      title: "Manage Accounts",
      description: "View, edit, and manage user accounts",
      icon: IconUsers,
      href: "/admin/manage-accounts",
      color: "text-blue-600 bg-blue-50 hover:bg-blue-100"
    },
    {
      title: "Add New Account",
      description: "Create new user accounts",
      icon: IconUserPlus,
      href: "/admin/add-account",
      color: "text-green-600 bg-green-50 hover:bg-green-100"
    },
    {
      title: "Manage Probations",
      description: "Track and manage probationary periods",
      icon: IconAlertTriangle,
      href: "/admin/manage-probation",
      color: "text-amber-600 bg-amber-50 hover:bg-amber-100"
    },
    {
      title: "Leave Applications",
      description: "Review and manage leave requests",
      icon: IconClipboardList,
      href: "/admin/leave-applications",
      color: "text-purple-600 bg-purple-50 hover:bg-purple-100"
    },
    {
      title: "Leave Limits",
      description: "Configure leave limits and policies",
      icon: IconCalendarStats,
      href: "/admin/manage-leave-limits",
      color: "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
    },
    {
      title: "Calendar Settings",
      description: "Manage calendar periods and settings",
      icon: IconSettings,
      href: "/admin/calendar-settings",
      color: "text-gray-600 bg-gray-50 hover:bg-gray-100"
    }
  ]

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Quick Actions</h2>
        <p className="text-muted-foreground">
          Access frequently used admin functions
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
        {quickActions.map((action) => {
          const IconComponent = action.icon
          return (
            <Card key={action.href} className="group transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className={`p-2 rounded-lg ${action.color} transition-colors`}>
                        <IconComponent className="size-5" />
                      </div>
                      {action.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {action.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="pt-4">
                  <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Link href={action.href}>
                      Access
                    </Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
