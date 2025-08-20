"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AdminSectionCards } from "@/components/admin-section-cards"
import { AdminQuickActions } from "@/components/admin-quick-actions"
import { AdminRecentActivity } from "@/components/admin-recent-activity"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
              router.push("/")
    } else if (session?.user?.role !== "Admin") {
      router.push("/teacher/dashboard")  // Direct redirect to teacher dashboard
    } else {
      setIsLoading(false)
    }
  }, [status, session, router])

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user?.role !== "Admin") {
    return null
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--header-height": "3.5rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {/* Page Header */}
            <div className="border-b bg-background px-4 py-4 lg:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
                  <p className="text-muted-foreground">
                    Overview of OALASS system statistics and quick access to admin functions
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  Welcome, {session?.user?.name}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">`
              {/* Dashboard Statistics Cards */}
              <AdminSectionCards />
              
              {/* Quick Actions Grid */}
              <AdminQuickActions />
              
              {/* Recent Activity */}
              <div className="px-4 lg:px-6">
                <AdminRecentActivity />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
