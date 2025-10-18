'use client'

import { useSession } from 'next-auth/react'
import { GoogleAvatar } from '@/components/GoogleAvatar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function DebugSessionPage() {
  const { data: session } = useSession()

  console.log('[DebugSession] Current session:', session)

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Session Debug</h1>
        <p className="text-muted-foreground">Check what's actually in the session</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Session Data</h2>
          
          {session ? (
            <div className="space-y-2 text-sm bg-gray-100 p-4 rounded">
              <div><strong>Email:</strong> {session.user?.email}</div>
              <div><strong>Name:</strong> {session.user?.name}</div>
              <div><strong>Role:</strong> {(session.user as any)?.role}</div>
              <div><strong>ProfilePicture:</strong> {(session.user as any)?.profilePicture || 'None'}</div>
              <div><strong>Image:</strong> {(session.user as any)?.image || 'None'}</div>
              <div><strong>AccessToken:</strong> {(session as any)?.accessToken ? 'Present' : 'None'}</div>
              <div><strong>IsDepartmentHead:</strong> {(session.user as any)?.isDepartmentHead ? 'Yes' : 'No'}</div>
            </div>
          ) : (
            <div>Not logged in</div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Avatar Tests</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">GoogleAvatar Component:</h3>
              <div className="flex items-center gap-4 mt-2">
                <GoogleAvatar size={64} />
                <span className="text-sm text-gray-600">Check console for GoogleAvatar logs</span>
              </div>
            </div>

            <div>
              <h3 className="font-medium">Regular Avatar with Session Data:</h3>
              <div className="flex items-center gap-4 mt-2">
                <Avatar className="w-16 h-16">
                  <AvatarImage 
                    src={(session?.user as any)?.profilePicture || '/ckcm.png'} 
                    alt={session?.user?.name || 'User'}
                    onError={(e) => {
                      console.log('[DebugSession] Regular avatar failed:', (session?.user as any)?.profilePicture)
                    }}
                    onLoad={() => {
                      console.log('[DebugSession] Regular avatar loaded:', (session?.user as any)?.profilePicture)
                    }}
                  />
                  <AvatarFallback>{session?.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-600">Direct session.user.profilePicture</span>
              </div>
            </div>

            <div>
              <h3 className="font-medium">Regular Avatar with Image Field:</h3>
              <div className="flex items-center gap-4 mt-2">
                <Avatar className="w-16 h-16">
                  <AvatarImage 
                    src={(session?.user as any)?.image || '/ckcm.png'} 
                    alt={session?.user?.name || 'User'}
                    onError={(e) => {
                      console.log('[DebugSession] Image avatar failed:', (session?.user as any)?.image)
                    }}
                    onLoad={() => {
                      console.log('[DebugSession] Image avatar loaded:', (session?.user as any)?.image)
                    }}
                  />
                  <AvatarFallback>{session?.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-600">Direct session.user.image</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
        <h3 className="font-medium text-yellow-800">Debug Instructions</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-700 mt-2 space-y-1">
          <li>Open browser console (F12)</li>
          <li>Look for "[NextAuth] SESSION CALLBACK" logs</li>
          <li>Look for "[GoogleAvatar]" logs</li>
          <li>Check which avatar actually displays an image</li>
          <li>If all show fallback, the issue is in session data</li>
        </ol>
      </div>
    </div>
  )
}