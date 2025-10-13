'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { fetchAndCleanGoogleProfilePicture } from '@/lib/google-avatar-fix'

interface GoogleAvatarProps {
  fallbackSrc?: string
  fallbackName?: string
  className?: string
  size?: number
}

export function GoogleAvatar({ 
  fallbackSrc = '/ckcm.png', 
  fallbackName = 'User',
  className = '',
  size = 32
}: GoogleAvatarProps) {
  const { data: session } = useSession()
  const [googleAvatarUrl, setGoogleAvatarUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (session?.user) {
      console.log('[GoogleAvatar] Session user data:', {
        email: session.user.email,
        profilePicture: (session.user as any)?.profilePicture,
        image: (session.user as any)?.image,
        hasAccessToken: !!((session as any)?.accessToken)
      })
      
      // ALWAYS use session.user.profilePicture first (set by session callback)
      const sessionPicture = (session.user as any)?.profilePicture || (session.user as any)?.image
      
      if (sessionPicture && sessionPicture !== '/ckcm.png' && sessionPicture.startsWith('http')) {
        console.log('[GoogleAvatar] ✅ Using session profile picture:', sessionPicture)
        setGoogleAvatarUrl(sessionPicture)
        return
      }
      
      // Try to fetch fresh from Google only if we have access token
      const accessToken = (session as any)?.accessToken
      if (accessToken) {
        console.log('[GoogleAvatar] 🔄 Fetching fresh from Google with access token')
        setIsLoading(true)
        setHasError(false)

        fetchAndCleanGoogleProfilePicture(accessToken)
          .then(result => {
            if (result.success && result.url) {
              setGoogleAvatarUrl(result.url)
              console.log('[GoogleAvatar] ✅ Fresh Google profile picture:', result.url)
            } else {
              console.warn('[GoogleAvatar] ❌ Google fetch failed:', result.error)
              setGoogleAvatarUrl(fallbackSrc)
            }
          })
          .catch(error => {
            console.warn('[GoogleAvatar] ❌ Google fetch error:', error)
            setGoogleAvatarUrl(fallbackSrc)
            setHasError(true)
          })
          .finally(() => {
            setIsLoading(false)
          })
      } else {
        console.log('[GoogleAvatar] ⚠️ No access token, using fallback')
        setGoogleAvatarUrl(fallbackSrc)
      }
    } else {
      console.log('[GoogleAvatar] ⚠️ No session, using fallback')
      setGoogleAvatarUrl(fallbackSrc)
    }
  }, [session, fallbackSrc])

  const displayName = session?.user?.name || fallbackName

  return (
    <Avatar className={className} style={{ width: size, height: size }}>
      {isLoading ? (
        <AvatarFallback className="animate-pulse bg-gray-200">
          <div className="w-4 h-4 bg-gray-400 rounded-full animate-bounce"></div>
        </AvatarFallback>
      ) : (
        <>
          <AvatarImage 
            src={googleAvatarUrl || fallbackSrc}
            alt={displayName}
            onError={(e) => {
              console.warn('[GoogleAvatar] Image failed to load:', googleAvatarUrl)
              setHasError(true)
              const img = e.target as HTMLImageElement
              if (img.src !== fallbackSrc) {
                img.src = fallbackSrc
              }
            }}
            onLoad={() => {
              console.log('[GoogleAvatar] Image loaded successfully:', googleAvatarUrl)
              setHasError(false)
            }}
          />
          <AvatarFallback>
            {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </>
      )}
    </Avatar>
  )
}

export default GoogleAvatar
