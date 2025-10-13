/**
 * Comprehensive Google Avatar URL handling to prevent persistent issues
 */

interface GoogleProfilePictureResult {
  success: boolean
  url: string | null
  error?: string
  originalLength?: number
  cleanedLength?: number
}

/**
 * Advanced Google profile picture URL cleaner with multiple fallback strategies
 */
export function cleanGoogleProfilePictureUrl(originalUrl: string): GoogleProfilePictureResult {
  try {
    console.log("[GoogleAvatarFix] Processing URL:", originalUrl.substring(0, 100) + "...")
    console.log("[GoogleAvatarFix] Original URL length:", originalUrl.length)
    
    // Strategy 1: Extract base URL and use minimal parameters
    const baseMatch = originalUrl.match(/^(https:\/\/lh[0-9]\.googleusercontent\.com\/[^\/]+\/[^\/=?&]+)/)
    if (baseMatch) {
      const cleanUrl = baseMatch[1] + '=s96-c'
      console.log("[GoogleAvatarFix] Strategy 1 - Base extraction successful")
      console.log("[GoogleAvatarFix] Cleaned URL length:", cleanUrl.length)
      
      if (cleanUrl.length <= 200) { // Much more conservative limit
        return {
          success: true,
          url: cleanUrl,
          originalLength: originalUrl.length,
          cleanedLength: cleanUrl.length
        }
      }
    }
    
    // Strategy 2: Use Google's photo ID extraction if available
    const photoIdMatch = originalUrl.match(/\/([a-zA-Z0-9_-]{20,})/)
    if (photoIdMatch) {
      const photoId = photoIdMatch[1]
      const shortUrl = `https://lh3.googleusercontent.com/${photoId}=s96-c`
      console.log("[GoogleAvatarFix] Strategy 2 - Photo ID extraction")
      console.log("[GoogleAvatarFix] Short URL length:", shortUrl.length)
      
      if (shortUrl.length <= 200) {
        return {
          success: true,
          url: shortUrl,
          originalLength: originalUrl.length,
          cleanedLength: shortUrl.length
        }
      }
    }
    
    // Strategy 3: Last resort - try to find any usable short version
    const anyMatch = originalUrl.match(/^(https:\/\/lh[0-9]\.googleusercontent\.com\/[^=]{1,50})/)
    if (anyMatch) {
      const lastResortUrl = anyMatch[1] + '=s96-c'
      console.log("[GoogleAvatarFix] Strategy 3 - Last resort")
      console.log("[GoogleAvatarFix] Last resort URL length:", lastResortUrl.length)
      
      if (lastResortUrl.length <= 200) {
        return {
          success: true,
          url: lastResortUrl,
          originalLength: originalUrl.length,
          cleanedLength: lastResortUrl.length
        }
      }
    }
    
    // All strategies failed
    console.warn("[GoogleAvatarFix] All cleaning strategies failed, URL too complex")
    return {
      success: false,
      url: null,
      error: "URL too complex to clean",
      originalLength: originalUrl.length
    }
    
  } catch (error) {
    console.error("[GoogleAvatarFix] URL cleaning error:", error)
    return {
      success: false,
      url: null,
      error: error instanceof Error ? error.message : "Unknown error",
      originalLength: originalUrl.length
    }
  }
}

/**
 * Fetch Google profile picture with aggressive URL cleaning
 */
export async function fetchAndCleanGoogleProfilePicture(accessToken: string): Promise<GoogleProfilePictureResult> {
  try {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })
    
    if (!response.ok) {
      return {
        success: false,
        url: null,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }
    
    const userData = await response.json()
    if (!userData?.picture || typeof userData.picture !== 'string') {
      return {
        success: false,
        url: null,
        error: "No picture field in Google response"
      }
    }
    
    return cleanGoogleProfilePictureUrl(userData.picture)
    
  } catch (error) {
    console.error("[GoogleAvatarFix] Fetch error:", error)
    return {
      success: false,
      url: null,
      error: error instanceof Error ? error.message : "Network error"
    }
  }
}

/**
 * Test if a Google profile picture URL is accessible
 */
export async function testGoogleProfilePictureUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', cache: 'no-store' })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Create a proxy URL for Google images to avoid direct URL issues
 */
export function createGoogleImageProxy(originalUrl: string): string {
  // For now, just return the cleaned URL, but this could be expanded
  // to use a server-side proxy if needed
  const result = cleanGoogleProfilePictureUrl(originalUrl)
  return result.success && result.url ? result.url : '/ckcm.png'
}





