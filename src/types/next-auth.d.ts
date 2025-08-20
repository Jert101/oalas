import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string // This will now be the custom format YYMM001
      role: string
      isEmailVerified: boolean
      profilePicture?: string
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    isEmailVerified: boolean
    profilePicture?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    isEmailVerified: boolean
    profilePicture?: string
  }
}
