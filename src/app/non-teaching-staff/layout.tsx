"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { NonTeachingStaffSidebar } from "@/components/non-teaching-staff-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function NonTeachingStaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  // Define non-teaching staff roles
  const nonTeachingRoles = [
    'Office Clerk', 
    'Non Teaching Personnel', 
    'Maintenance Office', 
    'Guidance Office', 
    'Registrar Office', 
    'Administrative Assistant', 
    'Library Staff', 
    'IT Support',
    'Security Office', 
    'Clinic Staff', 
    'Accounting Office',
    'HR Department',
    'Registrar'
  ]

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      // Check if user has non-teaching staff role (all Non Teaching Staff category roles)
      if (!nonTeachingRoles.includes(session?.user?.role || "")) {
        router.push("/dashboard")
      } else {
        setIsLoading(false)
      }
    }
  }, [status, session, router])

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading non-teaching staff dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session || !nonTeachingRoles.includes(session.user.role || "")) {
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
      <NonTeachingStaffSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
