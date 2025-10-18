"use client"

export const dynamic = 'force-dynamic'

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Only CKCM school email addresses (@ckcm.edu.ph) are allowed to sign in.":
        return "Access Denied: Only CKCM school email addresses are allowed to sign in."
      case "Configuration":
        return "There is a problem with the server configuration."
      case "AccessDenied":
        return "Access Denied: Only CKCM school email addresses (@ckcm.edu.ph) are allowed to sign in. Please use your official CKCM email address."
      case "Verification":
        return "The verification token has expired or has already been used."
      case "NonCkcmAccount":
        return "Access Denied: Only CKCM school email addresses (@ckcm.edu.ph) are allowed to sign in with Google. Please use your official CKCM email address."
      default:
        return error || "An error occurred during authentication."
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Authentication Error
          </CardTitle>
          <CardDescription className="text-center">
            {getErrorMessage(error)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            {error === "AccessDenied" || error === "NonCkcmAccount" ? (
              <div className="space-y-2">
                <p>This system is restricted to CKCM faculty and staff members only.</p>
                <p>If you believe this is an error, please contact your system administrator.</p>
              </div>
            ) : (
              <p>Please try again or contact support if the problem persists.</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Link href="/">
              <Button className="w-full" variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


