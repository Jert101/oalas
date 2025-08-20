import { useSession } from "next-auth/react"

export function SessionDebugger() {
  const { data: session, status } = useSession()
  
  if (status === "loading") return <div>Loading session...</div>
  
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg max-w-sm text-xs">
      <h3 className="font-bold mb-2">Session Debug</h3>
      <div>Status: {status}</div>
      <div>Name: {session?.user?.name || 'N/A'}</div>
      <div>Email: {session?.user?.email || 'N/A'}</div>
      <div>ID: {session?.user?.id || 'N/A'}</div>
      <div>Role: {session?.user?.role || 'N/A'}</div>
      <div>Profile Picture: {session?.user?.profilePicture || 'N/A'}</div>
      <div>Email Verified: {session?.user?.isEmailVerified ? 'Yes' : 'No'}</div>
    </div>
  )
}
