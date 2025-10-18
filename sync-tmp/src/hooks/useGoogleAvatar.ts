import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { fetchGoogleProfilePicture } from '@/lib/avatar-utils'

export function useGoogleAvatar() {
  const { data: session } = useSession()
  const [googleAvatarUrl, setGoogleAvatarUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAvatar() {
      // Only fetch if user has Google access token
      const accessToken = (session as any)?.accessToken
      
      if (!accessToken) {
        setGoogleAvatarUrl(null)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const avatarUrl = await fetchGoogleProfilePicture(accessToken)
        setGoogleAvatarUrl(avatarUrl)
      } catch (err) {
        setError('Failed to fetch Google avatar')
        console.error('[useGoogleAvatar] Error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (session) {
      fetchAvatar()
    }
  }, [session])

  return {
    googleAvatarUrl,
    isLoading,
    error,
    hasGoogleAccount: !!(session as any)?.accessToken
  }
}





