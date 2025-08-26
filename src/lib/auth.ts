import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

const providers = [] as any[]

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

        // Check if user is active
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
          profilePicture: user.profilePicture?.startsWith('/') 
            ? user.profilePicture 
            : `/${user.profilePicture || 'ckcm.png'}`,
        }
      } catch (dbError) {
        console.error("Database error during authentication:", dbError)
        // Re-throw the original error if it's an authentication error
        if (dbError instanceof Error && dbError.message.includes("Invalid credentials")) {
          throw dbError
        }

        if (dbError instanceof Error && dbError.message.includes("Account is deactivated")) {
          throw dbError
        }
        // Only throw "Database connection failed" for actual DB errors
        throw new Error("Database connection failed")
      }
    }
  })
)

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/",
    signOut: "/",
    error: "/auth/error",
  },
  providers,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial login
      if (user) {
        token.role = user.role
        token.isEmailVerified = user.isEmailVerified
        token.profilePicture = user.profilePicture
        // keep name/email in token so client sees updates after login
        if (user.name) token.name = user.name
        if (user.email) token.email = user.email
      }
      
      // Handle session updates (when update() is called)
      if (trigger === "update" && session) {
        if (session.profilePicture) {
          token.profilePicture = session.profilePicture
        }
        if (session.name) {
          token.name = session.name as string
        }
        if (session.email) {
          token.email = session.email as string
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.isEmailVerified = token.isEmailVerified as boolean
        session.user.profilePicture = token.profilePicture as string
        if (token.name) session.user.name = token.name as string
        if (token.email) session.user.email = token.email as string
      }
      return session
    },
    async signIn({ user, account }) {
      if (account?.provider === "github") {
        // Auto-verify GitHub users but assign Teacher role by default
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        })
        
        if (!existingUser) {
          // Get Teacher role ID
          const teacherRole = await prisma.role.findUnique({
            where: { name: "Teacher/Instructor" }
          })
          
          // Generate a unique user ID
          const userCount = await prisma.user.count()
          const userId = `25010${String(userCount + 1).padStart(3, '0')}` // 2025, January, next user
          
          // Create new user from GitHub
          await prisma.user.create({
            data: {
              users_id: userId,
              email: user.email!,
              name: user.name || "GitHub User",
              role_id: teacherRole?.role_id || null,
              isEmailVerified: true,
              isActive: false, // Admin must activate
            }
          })
        }
      }
      return true
    }
  }
}
