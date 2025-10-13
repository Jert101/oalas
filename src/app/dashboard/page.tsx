'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    console.log("[Dashboard] 🔍 CLIENT-SIDE ROUTING CHECK:", {
      status: status,
      hasSession: !!session,
      userRole: (session?.user as any)?.role,
      isDepartmentHead: (session?.user as any)?.isDepartmentHead
    })

    if (status === 'loading') {
      console.log("[Dashboard] ⏳ Session loading...")
      return
    }

    if (!session) {
      console.log("[Dashboard] ❌ No session, redirecting to login")
      router.push('/')
      return
    }

    const userRole = (session.user as any)?.role
    const isDepartmentHead = (session.user as any)?.isDepartmentHead

    // EMERGENCY CLIENT-SIDE ROUTING for Maintenance Office
    if (userRole === 'Maintenance Office') {
      console.log("[Dashboard] 🚨 CLIENT-SIDE EMERGENCY: Maintenance Office detected, redirecting to dean dashboard")
      router.push('/dean/dashboard')
      return
    }

    // Role-based routing (PRIORITY: specific roles first, before general isDepartmentHead check)
    if (userRole === 'Admin') {
      console.log("[Dashboard] 🔧 Admin detected, redirecting to admin dashboard")
      router.push('/admin/dashboard')
      return
    }

    if (userRole === 'Finance Department' || userRole === 'Finance Officer' || userRole === 'Finance Office Head') {
      console.log("[Dashboard] 💰 Finance detected, redirecting to finance dashboard")
      router.push('/finance/dashboard')
      return
    }

    // Office head check (only for non-Finance roles)
    if (isDepartmentHead) {
      console.log("[Dashboard] ✅ Office head detected, redirecting to dean dashboard")
      router.push('/dean/dashboard')
      return
    }

    if (userRole === 'Dean/Program Head' || userRole === 'Department Head') {
      console.log("[Dashboard] 🏛️ Dean detected, redirecting to dean dashboard")
      router.push('/dean/dashboard')
      return
    }

    // Default to teacher dashboard
    console.log("[Dashboard] 👨‍🏫 Default routing to teacher dashboard for role:", userRole)
    router.push('/teacher/dashboard')

  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting to your dashboard...</p>
        <p className="text-sm text-gray-400 mt-1">Role: {(session.user as any)?.role}</p>
      </div>
    </div>
  )
}
}