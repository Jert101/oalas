import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

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
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
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
              lockUntil: true,
              loginAttempts: true,
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

          // Check if account is locked
          if (user.lockUntil && user.lockUntil > new Date()) {
            throw new Error("Account temporarily locked due to too many failed attempts")
          }

          // Check if user is active
          if (!user.isActive) {
            throw new Error("Account is deactivated")
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            // Increment login attempts
            await prisma.user.update({
              where: { users_id: user.users_id },
              data: {
                loginAttempts: { increment: 1 },
                lockUntil: user.loginAttempts >= 4 
                  ? new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
                  : undefined
              }
            })
            throw new Error("Invalid credentials")
          }

          // Reset login attempts on successful login
          await prisma.user.update({
            where: { users_id: user.users_id },
            data: {
              loginAttempts: 0,
              lockUntil: null
            }
          })

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
          if (dbError instanceof Error && dbError.message.includes("Account temporarily locked")) {
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
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial login
      if (user) {
        token.role = user.role
        token.isEmailVerified = user.isEmailVerified
        token.profilePicture = user.profilePicture
      }
      
      // Handle session updates (when update() is called)
      if (trigger === "update" && session) {
        if (session.profilePicture) {
          token.profilePicture = session.profilePicture
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
