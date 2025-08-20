"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function DebugLandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [debugInfo, setDebugInfo] = useState<{
    status: string;
    userRole?: string;
    userEmail?: string;
    userId?: string;
    currentUrl: string;
    timestamp: string;
  }>({})

  useEffect(() => {
    const info = {
      status,
      userRole: session?.user?.role,
      userEmail: session?.user?.email,
      userId: session?.user?.id,
      currentUrl: window.location.href,
      timestamp: new Date().toISOString()
    }
    setDebugInfo(info)
    console.log("🐞 DEBUG INFO:", info)
  }, [session, status])

  const handleManualRedirect = (path: string) => {
    console.log("🚀 Manual redirect to:", path)
    router.push(path)
  }

  if (status === "loading") {
    return <div className="p-8">Loading session...</div>
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🐞 Debug Session Information</h1>
      
      <div className="bg-gray-100 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Current Session Data:</h2>
        <div className="space-y-2">
          <p><strong>Status:</strong> {debugInfo.status}</p>
          <p><strong>User Role:</strong> {debugInfo.userRole || "No role found"}</p>
          <p><strong>User Email:</strong> {debugInfo.userEmail || "No email"}</p>
          <p><strong>User ID:</strong> {debugInfo.userId || "No ID"}</p>
          <p><strong>Current URL:</strong> {debugInfo.currentUrl}</p>
          <p><strong>Timestamp:</strong> {debugInfo.timestamp}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Manual Navigation (to test routing):</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={() => handleManualRedirect("/teacher/dashboard")}
            className="bg-blue-500 text-white p-3 rounded hover:bg-blue-600"
          >
            Go to Teacher Dashboard
          </button>
          <button 
            onClick={() => handleManualRedirect("/admin/console")}
            className="bg-red-500 text-white p-3 rounded hover:bg-red-600"
          >
            Go to Admin Console
          </button>
          <button 
            onClick={() => handleManualRedirect("/dashboard")}
            className="bg-green-500 text-white p-3 rounded hover:bg-green-600"
          >
            Go to Main Dashboard
          </button>
          <button 
            onClick={() => handleManualRedirect("/account")}
            className="bg-purple-500 text-white p-3 rounded hover:bg-purple-600"
          >
            Go to Account Settings
          </button>
        </div>
      </div>

      <div className="mt-6 bg-yellow-100 p-4 rounded-lg">
        <h3 className="font-semibold">Expected Behavior:</h3>
        <ul className="list-disc ml-6 mt-2">
          <li>Admin users → /admin/console</li>
          <li>Teacher/Instructor → /teacher/dashboard</li>
          <li>Dean/Program Head → /teacher/dashboard</li>
        </ul>
      </div>
    </div>
  )
}
