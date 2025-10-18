/**
 * Debug Component to Track Redirect Loop Issue
 * Place this in your dashboard or admin console page temporarily
 */

"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DebugRedirectPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    console.log("🐞 DEBUG SESSION DATA:")
    console.log("Status:", status)
    console.log("Session:", session)
    console.log("User Role:", session?.user?.role)
    console.log("Current URL:", window.location.href)
    
    if (session?.user?.role) {
      console.log("Role check results:")
      console.log("- Is Admin?", session.user.role === "Admin")
      console.log("- Is Teacher/Instructor?", session.user.role === "Teacher/Instructor")
      console.log("- Is Dean/Program Head?", session.user.role === "Dean/Program Head")
      console.log("- Includes in teacher array?", ["Teacher/Instructor", "Dean/Program Head"].includes(session.user.role))
    }
  }, [session, status])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">🐞 Debug Session Info</h1>
      <div className="bg-gray-100 p-4 rounded">
        <p><strong>Status:</strong> {status}</p>
        <p><strong>User Role:</strong> {session?.user?.role || "No role"}</p>
        <p><strong>User Email:</strong> {session?.user?.email || "No email"}</p>
        <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server-side'}</p>
      </div>
      
      <div className="mt-4">
        <h2 className="text-lg font-semibold">Expected Navigation:</h2>
        <ul className="list-disc ml-6">
          <li>Admin → /admin/console</li>
          <li>Teacher/Instructor → /teacher/dashboard</li>
          <li>Dean/Program Head → /teacher/dashboard</li>
        </ul>
      </div>
    </div>
  )
}
