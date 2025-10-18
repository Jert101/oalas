/**
 * Utility functions for handling avatar/profile picture URLs
 */

export function getAvatarUrl(raw?: string | null, fallbackName?: string): string {
  // If it looks URL-encoded, safely decode once or twice if needed
  let url = raw || ""
  
  if (url.includes("%")) {
    try { 
      url = decodeURIComponent(url)
      // Check if it's still encoded (double encoding)
      if (url.includes("%")) {
        url = decodeURIComponent(url)
      }
      console.log("[AvatarUtils] Decoded URL:", { original: raw, decoded: url })
    } catch (e) {
      console.warn("[AvatarUtils] Failed to decode URL:", raw, e)
      url = raw || ""
    }
  }
  
  // Ensure URL is valid
  if (url && (url.startsWith('http') || url.startsWith('/'))) {
    console.log("[AvatarUtils] Using profile picture:", url)
    return url
  }
  
  console.log("[AvatarUtils] Using fallback picture for:", fallbackName)
  return '/ckcm.png'
}

export function getAvatarImageProps(src?: string | null, alt?: string) {
  return {
    src: getAvatarUrl(src, alt),
    alt: alt || 'User Avatar',
    onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
      console.warn("[AvatarImage] Failed to load avatar:", src, e)
      const img = e.target as HTMLImageElement
      if (img.src !== '/ckcm.png') {
        img.src = '/ckcm.png'
      }
    },
    onLoad: () => {
      console.log("[AvatarImage] Successfully loaded avatar:", src)
    }
  }
}

/**
 * Fetch Google profile picture using access token
 */
export async function fetchGoogleProfilePicture(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })
    
    if (response.ok) {
      const userData = await response.json()
      if (userData?.picture && typeof userData.picture === 'string') {
        console.log("[AvatarUtils] Fetched fresh Google profile picture:", userData.picture)
        return userData.picture
      }
    }
  } catch (error) {
    console.warn("[AvatarUtils] Failed to fetch Google profile picture:", error)
  }
  
  return null
}
