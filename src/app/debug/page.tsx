'use client'

import { useSession } from "next-auth/react"

export default function DebugPage() {
  const { data: session } = useSession()
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Session Data</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(session, null, 2)}
      </pre>
    </div>
  )
}
