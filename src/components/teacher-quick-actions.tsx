"use client"

import { useState } from "react"
import Link from "next/link"
import { IconCalendarPlus, IconFileText, IconUser, IconSettings, IconBell, IconClipboardList } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function TeacherQuickActions() {
  const [notifications] = useState(3) // This would come from an API

  const quickActions = [
    {
      title: "Apply for Leave",
      description: "Submit a new leave application",
      icon: IconCalendarPlus,
  href: "/teacher/leave/apply",
      variant: "default" as const,
      badge: null,
    },
    {
      title: "My Leave History",
      description: "View your leave applications",
      icon: IconFileText,
      href: "/teacher/leave/history",
      variant: "outline" as const,
      badge: null,
    },
    {
      title: "Probation Status",
      description: "Check your employment status",
      icon: IconUser,
      href: "/teacher/probation",
      variant: "outline" as const,
      badge: null,
    },
    {
      title: "Profile Settings",
      description: "Update your profile information",
      icon: IconSettings,
      href: "/account",
      variant: "outline" as const,
      badge: null,
    },
    {
      title: "Notifications",
      description: "View recent notifications",
      icon: IconBell,
      href: "/teacher/notifications",
      variant: "outline" as const,
      badge: notifications > 0 ? notifications.toString() : null,
    },
    {
      title: "Class Schedule",
      description: "View your teaching schedule",
      icon: IconClipboardList,
      href: "/teacher/schedule",
      variant: "outline" as const,
      badge: null,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common tasks and tools for teachers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link key={index} href={action.href}>
                <Button
                  variant={action.variant}
                  className="h-auto w-full justify-start p-4 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <Icon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{action.title}</p>
                        {action.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Button>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
