import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { fetchAndCleanGoogleProfilePicture, testGoogleProfilePictureUrl } from "@/lib/google-avatar-fix"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action') || 'status'

    if (action === 'status') {
      // Get overview of profile picture status
      const [
        totalUsers,
        usersWithGooglePics,
        usersWithFallback,
        googleUrlLengths
      ] = await Promise.all([
        prisma.user.count({ where: { isActive: true } }),
        
        prisma.user.count({
          where: {
            isActive: true,
            profilePicture: {
              contains: 'googleusercontent.com'
            }
          }
        }),
        
        prisma.user.count({
          where: {
            isActive: true,
            profilePicture: '/ckcm.png'
          }
        }),
        
        prisma.user.findMany({
          where: {
            isActive: true,
            profilePicture: {
              contains: 'googleusercontent.com'
            }
          },
          select: {
            email: true,
            profilePicture: true
          }
        })
      ])

      const urlStats = googleUrlLengths.map(u => ({
        email: u.email,
        length: u.profilePicture?.length || 0,
        isLong: (u.profilePicture?.length || 0) > 200
      }))

      const problematicUrls = urlStats.filter(u => u.isLong)

      return NextResponse.json({
        success: true,
        data: {
          totalUsers,
          usersWithGooglePics,
          usersWithFallback,
          googlePictureStats: {
            total: googleUrlLengths.length,
            averageLength: urlStats.length > 0 ? Math.round(urlStats.reduce((sum, u) => sum + u.length, 0) / urlStats.length) : 0,
            maxLength: Math.max(...urlStats.map(u => u.length), 0),
            problematicCount: problematicUrls.length
          },
          problematicUrls: problematicUrls.slice(0, 10) // Limit to first 10
        }
      })
    }

    if (action === 'test' && session.user.role === 'Admin') {
      // Test current user's Google profile picture
      const accessToken = (session as any)?.accessToken
      
      if (!accessToken) {
        return NextResponse.json({
          success: false,
          error: "No Google access token available"
        })
      }

      const result = await fetchAndCleanGoogleProfilePicture(accessToken)
      
      // Also test if the URL works
      let urlWorks = false
      if (result.success && result.url) {
        urlWorks = await testGoogleProfilePictureUrl(result.url)
      }

      return NextResponse.json({
        success: true,
        data: {
          fetchResult: result,
          urlWorks,
          currentUserPicture: (session.user as any)?.profilePicture
        }
      })
    }

    if (action === 'refresh' && session.user.role === 'Admin') {
      // Force refresh current user's profile picture
      const accessToken = (session as any)?.accessToken
      
      if (!accessToken) {
        return NextResponse.json({
          success: false,
          error: "No Google access token available"
        })
      }

      const result = await fetchAndCleanGoogleProfilePicture(accessToken)
      
      if (result.success && result.url) {
        await prisma.user.update({
          where: { users_id: session.user.id },
          data: { profilePicture: result.url }
        })
        
        return NextResponse.json({
          success: true,
          message: "Profile picture refreshed successfully",
          data: {
            newUrl: result.url,
            originalLength: result.originalLength,
            cleanedLength: result.cleanedLength
          }
        })
      } else {
        return NextResponse.json({
          success: false,
          error: "Failed to fetch/clean profile picture",
          details: result
        })
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (error) {
    console.error("Google avatars debug error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}





