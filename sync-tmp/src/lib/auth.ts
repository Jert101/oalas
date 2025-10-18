import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { fetchAndCleanGoogleProfilePicture } from "@/lib/google-avatar-fix"

const providers = [] as any[]
// Google OAuth provider (CKCM domain only)
providers.push(
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    authorization: {
      params: {
        prompt: process.env.GOOGLE_OAUTH_PROMPT || "select_account",
        access_type: "offline",
        response_type: "code",
        hd: "ckcm.edu.ph",
      },
    },
  })
)

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    })
  )
}


providers.push(
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error("Email and password required")
      }

      try {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            users_id: true,
            email: true,
            password: true,
            name: true,
            profilePicture: true,
            isEmailVerified: true,
            isActive: true,
            isDepartmentHead: true,
            role: {
              select: {
                name: true
              }
            }
          }
        })

        if (!user || !user.password) {
          throw new Error("Invalid credentials")
        }

        if (!user.isActive) {
          throw new Error("Account is deactivated")
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error("Invalid credentials")
        }

        return {
          id: user.users_id,
          email: user.email,
          name: user.name,
          role: user.role?.name || "Guest",
          isEmailVerified: user.isEmailVerified,
          isDepartmentHead: user.isDepartmentHead,
          // Preserve existing/provider images; no hard fallback to ckcm.png
          profilePicture: (() => {
            const p = user.profilePicture || undefined
            if (!p) return undefined as any
            return (p.startsWith('http') || p.startsWith('/')) ? p : `/${p}`
          })(),
        }
      } catch (dbError) {
        console.error("Database error during authentication:", dbError)
        if (dbError instanceof Error && dbError.message.includes("Invalid credentials")) {
          throw dbError
        }
        if (dbError instanceof Error && dbError.message.includes("Account is deactivated")) {
          throw dbError
        }
        throw new Error("Database connection failed")
      }
    }
  })
)

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  debug: true,
  logger: {
    error(code, metadata) { console.error("[NextAuth][error]", code, metadata) },
    warn(code) { console.warn("[NextAuth][warn]", code) },
    debug(code, metadata) { console.log("[NextAuth][debug]", code, metadata) },
  },
  pages: {
    signIn: "/",
    signOut: "/",
    error: "/auth/error",
  },
  providers,
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Respect intended destination; avoid forcing /dashboard to prevent bouncing
      if (url.startsWith(baseUrl)) return url
      if (url.startsWith('/')) return `${baseUrl}${url}`
      return baseUrl
    },
    async jwt({ token, user, trigger, session, account }) {
      console.log("[NextAuth] 🔍 JWT CALLBACK ENTRY:", {
        hasUser: !!user,
        hasAccount: !!account,
        accountProvider: account?.provider,
        userEmail: user?.email,
        tokenEmail: token.email,
        trigger
      })
      
      if (user) {
        console.log("[NextAuth] 🔍 JWT: Processing user object (credentials login):", user)
        // If user object is present, use it (for credentials login)
        token.role = (user as any).role
        token.isEmailVerified = (user as any).isEmailVerified
        ;(token as any).isDepartmentHead = (user as any).isDepartmentHead
        // prefer explicit picture fields from provider/user, then fallback
        token.profilePicture = (user as any).picture || (user as any).profilePicture || (token as any).profilePicture
        // ensure userId is present for UI (e.g., sidebar)
        ;(token as any).userId = (user as any).id || (user as any).users_id || (token as any).userId
        if ((user as any).gender) (token as any).gender = (user as any).gender
        if ((user as any).phone) (token as any).phone = (user as any).phone
        if ((user as any).birthday) (token as any).birthday = (user as any).birthday
        if ((user as any).address) (token as any).address = (user as any).address
        if (user.name) token.name = user.name
        if (user.email) token.email = user.email

        // For OAuth sign-ins, NextAuth's user object may not include role.
        // Ensure role and office-head flags are present by fetching from DB when necessary.
        if ((!token.role || typeof token.role === 'undefined') && token.email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: token.email },
              select: {
                users_id: true,
                role: { select: { name: true } },
                isDepartmentHead: true,
                profilePicture: true,
              }
            })
            if (dbUser) {
              ;(token as any).role = dbUser.role?.name
              ;(token as any).isDepartmentHead = dbUser.isDepartmentHead
              ;(token as any).userId = (token as any).userId || dbUser.users_id
              ;(token as any).profilePicture = (token as any).profilePicture || dbUser.profilePicture
            }
          } catch (e) {
            console.warn('[NextAuth] JWT: DB enrichment failed in user branch', e)
          }
        }
      } else if (token.email) {
        console.log("[NextAuth] 🔍 JWT: OAuth flow - fetching user from database for:", token.email)
        // Always fetch fresh user data from database for OAuth users
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: {
              users_id: true,
              email: true,
              name: true,
              firstName: true,
              lastName: true,
              middleName: true,
              suffix: true,
              isEmailVerified: true,
              isDepartmentHead: true,
              profilePicture: true,
              role: {
                select: {
                  name: true
                }
              }
            }
          })
          
          console.log("[NextAuth] 🔍 JWT: Database lookup result:", {
            found: !!dbUser,
            email: dbUser?.email,
            role: dbUser?.role?.name,
            isDepartmentHead: dbUser?.isDepartmentHead,
            isEmailVerified: dbUser?.isEmailVerified,
            users_id: dbUser?.users_id
          })
          
          if (dbUser) {
            console.log("[NextAuth] JWT: Fetched fresh user data from database:", {
              users_id: dbUser.users_id,
              name: dbUser.name,
              hasProfilePicture: !!dbUser.profilePicture,
              role: dbUser.role?.name,
              isDepartmentHead: dbUser.isDepartmentHead,
              isEmailVerified: dbUser.isEmailVerified
            })
            
            ;(token as any).role = dbUser.role?.name
            ;(token as any).isEmailVerified = dbUser.isEmailVerified
            ;(token as any).isDepartmentHead = dbUser.isDepartmentHead
            ;(token as any).profilePicture = dbUser.profilePicture || (token as any).profilePicture
            if (dbUser.name) {
              token.name = dbUser.name
            }
            // Store user details for session
            (token as any).userId = dbUser.users_id
            if (dbUser.firstName) (token as any).firstName = dbUser.firstName
            if (dbUser.lastName) (token as any).lastName = dbUser.lastName
            if (dbUser.middleName) (token as any).middleName = dbUser.middleName
            if (dbUser.suffix) (token as any).suffix = dbUser.suffix
            
            console.log("[NextAuth] JWT: Set token data:", {
              role: (token as any).role,
              isDepartmentHead: (token as any).isDepartmentHead,
              isDepartmentHeadType: typeof (token as any).isDepartmentHead,
              userId: (token as any).userId,
              email: token.email,
              profilePicture: (token as any).profilePicture,
              profilePictureLength: ((token as any).profilePicture || '').length
            })
            
            // Special logging for office heads
            if ((token as any).isDepartmentHead === true) {
              console.log("[NextAuth] ✅ OFFICE HEAD TOKEN CREATED:", {
                email: token.email,
                role: (token as any).role,
                isDepartmentHead: (token as any).isDepartmentHead,
                expectedDashboard: 'Dean Dashboard'
              })
            }
          }
        } catch (error) {
          console.error("[NextAuth] JWT: Error fetching user from database:", error)
        }
      }
      // Persist provider access token on sign-in (generic)
      if (account && (account as any).access_token) {
        ;(token as any).accessToken = (account as any).access_token
      }
      if (trigger === "update" && session) {
        if ((session as any).profilePicture) (token as any).profilePicture = (session as any).profilePicture
        if (session.name) (token as any).name = session.name as string
        if (session.email) (token as any).email = session.email as string
        if ((session as any).phone) (token as any).phone = (session as any).phone
        if ((session as any).birthday) (token as any).birthday = (session as any).birthday
        if ((session as any).address) (token as any).address = (session as any).address
        if ((session as any).accessToken) (token as any).accessToken = (session as any).accessToken
        // Accept role and office-head updates from client to enable immediate role-based routing
        if ((session as any).role) (token as any).role = (session as any).role
        if (typeof (session as any).isDepartmentHead !== 'undefined') (token as any).isDepartmentHead = (session as any).isDepartmentHead
      }
      
      // FINAL TOKEN DEBUG
      console.log("[NextAuth] 🔍 JWT CALLBACK FINAL TOKEN:", {
        sub: token.sub,
        email: token.email,
        name: token.name,
        role: token.role,
        isDepartmentHead: (token as any).isDepartmentHead,
        userId: (token as any).userId,
        isEmailVerified: token.isEmailVerified,
        allKeys: Object.keys(token)
      })
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        console.log("[NextAuth] SESSION CALLBACK DEBUG - Input token:", {
          sub: token.sub,
          role: token.role,
          isDepartmentHead: (token as any).isDepartmentHead,
          profilePicture: (token as any).profilePicture,
          email: token.email
        });
        
        session.user.id = token.sub!
        ;(session.user as any).role = token.role as string
        ;(session.user as any).isEmailVerified = token.isEmailVerified as boolean
        ;(session.user as any).isDepartmentHead = (token as any).isDepartmentHead as boolean
        // profilePicture will be set fresh from DB below
        ;(session.user as any).gender = (token as any).gender as string | undefined
        ;(session.user as any).phone = (token as any).phone as string | undefined
        ;(session.user as any).birthday = (token as any).birthday as string | undefined
        ;(session.user as any).address = (token as any).address as string | undefined
        ;(session as any).accessToken = (token as any).accessToken
        if (token.name) session.user.name = token.name as string
        if (token.email) session.user.email = token.email as string
        // also populate image for components that expect it
        ;(session.user as any).image = (token as any).profilePicture as string
        
        // Add user details from database
        if ((token as any).userId) (session.user as any).userId = (token as any).userId
        if ((token as any).firstName) (session.user as any).firstName = (token as any).firstName
        if ((token as any).lastName) (session.user as any).lastName = (token as any).lastName
        if ((token as any).middleName) (session.user as any).middleName = (token as any).middleName
        if ((token as any).suffix) (session.user as any).suffix = (token as any).suffix
        // ALWAYS ensure profile picture is fresh from database (fixes cache issues)
        if (session.user.email) {
          console.log("[NextAuth] SESSION CALLBACK - Fetching fresh profilePicture from DB for:", session.user.email);
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: session.user.email },
              select: { profilePicture: true }
            })
            console.log("[NextAuth] SESSION CALLBACK - DB lookup result:", dbUser?.profilePicture);
            
            // Check if we have a valid profile picture
            const hasValidPicture = dbUser?.profilePicture && 
              dbUser.profilePicture !== '/ckcm.png' && 
              dbUser.profilePicture.startsWith('http') &&
              !dbUser.profilePicture.includes('ACg8ocL_Qw5Qr8QzHPqJzNv8FGHhZl2iKzYxWvUP1mN0') // Remove test URLs
            
            if (hasValidPicture) {
              ;(session.user as any).profilePicture = dbUser.profilePicture
              ;(session.user as any).image = dbUser.profilePicture
              console.log("[NextAuth] SESSION CALLBACK - ✅ Set fresh profilePicture from DB:", dbUser.profilePicture);
            } else {
              console.log("[NextAuth] SESSION CALLBACK - ⚠️ No valid profilePicture in DB; preserving existing session picture");
              // Do not override with a default image; keep provider/token picture if present
            }
          } catch (error) {
            console.error("[NextAuth] SESSION CALLBACK - DB fetch error:", error);
            // Do not force a fallback image here; keep whatever is already in session
          }
        }
        
        console.log("[NextAuth] SESSION CALLBACK DEBUG - Final session.user:", {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          profilePicture: (session.user as any).profilePicture,
          image: (session.user as any).image,
          role: (session.user as any).role,
          isDepartmentHead: (session.user as any).isDepartmentHead
        });
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Restrict Google logins to ckcm.edu.ph emails and route new users to setup
      if (account?.provider === "google") {
        const email = (user.email || "").toLowerCase()
        if (!email.endsWith("@ckcm.edu.ph")) return false

        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (!existingUser) {
          let googlePicture = (profile as any)?.picture || (user as any)?.image || (user as any)?.picture || ""
          // If no picture in basic profile, try fetching from Google userinfo with the access token
          try {
            const accessToken = (account as any)?.access_token as string | undefined
            if (!googlePicture && accessToken) {
              const resp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${accessToken}` },
                cache: "no-store",
              })
              if (resp.ok) {
                const u = await resp.json()
                if (u?.picture && typeof u.picture === 'string') {
                  googlePicture = u.picture as string
                }
                if (!user.name && u?.name) {
                  ;(user as any).name = u.name as string
                }
              }
            }
          } catch {}
          const pictureParam = encodeURIComponent(googlePicture)
          const nameParam = encodeURIComponent(user.name || (profile as any)?.name || "")
          return `/auth/setup-account?email=${encodeURIComponent(email)}&name=${nameParam}&picture=${pictureParam}`
        } else {
          // Ensure the Google account is linked to this user to avoid OAuthAccountNotLinked
          const linked = await prisma.account.findFirst({
            where: { users_id: existingUser.users_id, provider: 'google', providerAccountId: account.providerAccountId }
          })
          if (!linked) {
            await prisma.account.create({
              data: {
                users_id: existingUser.users_id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: (account as any).session_state ?? null,
              }
            })
          }
          // SIMPLE Google profile picture handling - direct approach
          console.log("[NextAuth] 🚀 Starting Google profile picture update...")
          try {
            let googlePicture = (profile as any)?.picture || (user as any)?.image || (user as any)?.picture
            const accessToken = (account as any)?.access_token as string | undefined
            
            console.log("[NextAuth] Initial picture sources:", {
              profilePicture: !!((profile as any)?.picture),
              userImage: !!((user as any)?.image),
              userPicture: !!((user as any)?.picture),
              hasAccessToken: !!accessToken
            })
            
            // Always try to get fresh picture from Google userinfo endpoint
            if (accessToken) {
              console.log("[NextAuth] Fetching fresh picture with access token...")
              try {
                const resp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${accessToken}` },
                  cache: "no-store",
                })
                if (resp.ok) {
                  const u = await resp.json()
                  if (u?.picture && typeof u.picture === 'string') {
                    googlePicture = u.picture as string
                    console.log("[NextAuth] ✅ Fresh Google profile picture fetched:", googlePicture.substring(0, 100) + "...")
                    console.log("[NextAuth] Picture length:", googlePicture.length)
                  }
                }
              } catch (fetchError) {
                console.warn("[NextAuth] Failed to fetch fresh Google picture:", fetchError)
              }
            }
            
            let finalProfilePicture: string | null = null
            
            if (googlePicture) {
              console.log("[NextAuth] Processing Google picture URL...")
              
              // Simple cleaning approach - extract base and add small size parameter
              try {
                // Try to extract the photo ID and create a short URL
                const photoIdMatch = googlePicture.match(/\/([a-zA-Z0-9_-]{21,})/);
                if (photoIdMatch && photoIdMatch[1]) {
                  const shortUrl = `https://lh3.googleusercontent.com/${photoIdMatch[1]}=s96-c`
                  console.log("[NextAuth] Created short URL:", shortUrl, "Length:", shortUrl.length)
                  
                  if (shortUrl.length <= 200) {
                    finalProfilePicture = shortUrl
                    console.log("[NextAuth] ✅ Using short Google URL")
                  } else {
                    console.warn("[NextAuth] ⚠️ Short URL still too long, using fallback")
                  }
                } else {
                  console.warn("[NextAuth] ⚠️ Could not extract photo ID, using fallback")
                }
              } catch (cleanError) {
                console.error("[NextAuth] URL cleaning error:", cleanError)
              }
            } else {
              console.warn("[NextAuth] ⚠️ No Google picture available")
            }
            
            console.log("[NextAuth] Final profile picture decision:", finalProfilePicture)
            
            if (finalProfilePicture) {
              await prisma.user.update({
                where: { users_id: existingUser.users_id },
                data: { profilePicture: finalProfilePicture }
              })
              console.log("[NextAuth] ✅ Profile picture updated in database")
            } else {
              console.log("[NextAuth] ⚠️ No valid Google picture; leaving existing profilePicture unchanged")
            }
            
          } catch (e) {
            console.error("[NextAuth] ❌ Profile picture update failed:", e)
            // Do not force a default fallback; keep existing DB value untouched
          }
        }
      }
      
      if (account?.provider === "github") {
        const existingUser = await prisma.user.findUnique({ where: { email: user.email! } })
        if (!existingUser) {
          const pictureParam = encodeURIComponent(((user as any).picture || (user as any).profilePicture || ""))
          const nameParam = encodeURIComponent(user.name || "")
          return `/auth/setup-account?email=${encodeURIComponent(user.email!)}&name=${nameParam}&picture=${pictureParam}`
        }
      }
      
      return true
    }
  }
}
