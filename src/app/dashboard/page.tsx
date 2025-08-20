"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      // Not authenticated, redirect to login
              router.push("/")
      return
    }

    // Redirect based on user role
    const userRole = session.user?.role

    if (userRole === "Admin") {
      router.push("/admin/console")
    } else if (userRole === "Dean/Program Head") {
      router.push("/dean/dashboard")
    } else if (userRole === "Finance Officer") {
      router.push("/finance/dashboard")
    } else if (["Teacher/Instructor", "Non Teaching Personnel"].includes(userRole || "")) {
      router.push("/teacher/dashboard")
    } else {
      // Default fallback for unknown roles
      router.push("/teacher/dashboard")
    }
  }, [session, status, router])

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}
