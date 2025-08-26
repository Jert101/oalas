"use client"

import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get("error") || "Unknown"

  const messageMap: Record<string, string> = {
    Configuration: "Authentication is misconfigured on the server. Please contact the administrator.",
    AccessDenied: "You do not have access to sign in with this provider.",
    Verification: "The sign-in link is no longer valid. Request a new one.",
    OAuthSignin: "There was an issue initiating OAuth sign-in.",
    OAuthCallback: "There was an issue completing OAuth sign-in.",
    OAuthCreateAccount: "There was an issue creating your account from the provider.",
    EmailCreateAccount: "There was an issue creating your email account.",
    Callback: "There was an issue in the sign-in callback.",
    OAuthAccountNotLinked: "Your email is already linked to a different sign-in method.",
    EmailSignin: "There was an issue sending the email.",
    CredentialsSignin: "Invalid email or password.",
    SessionRequired: "Please sign in to continue.",
  }

  const message = messageMap[error] || "An authentication error occurred."

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Authentication Error</CardTitle>
          <CardDescription className="text-center">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-center text-gray-500">Error code: {error}</div>
          <Button className="w-full" onClick={() => router.push("/")}>Go to Home</Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Loading...</CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}


