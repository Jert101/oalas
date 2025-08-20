"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { verifyEmail } from "@/lib/actions/auth"
import { CheckCircle, XCircle } from "lucide-react"

export default function VerifyEmailPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  useEffect(() => {
    const verifyEmailToken = async () => {
      if (!token) {
        setError("Invalid verification link")
        setIsLoading(false)
        return
      }

      try {
        const result = await verifyEmail(token)
        
        if (result.success) {
          setIsVerified(true)
          toast.success(result.message || "Email verified successfully!")
        } else {
          setError(result.error || "Verification failed")
        }
      } catch {
        setError("Something went wrong")
      } finally {
        setIsLoading(false)
      }
    }

    verifyEmailToken()
  }, [token])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Verifying your email...
            </CardTitle>
            <CardDescription className="text-center">
              Please wait while we verify your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-center text-red-600">
              Verification Failed
            </CardTitle>
            <CardDescription className="text-center">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => router.push("/auth/forgot-password")}
              variant="outline"
              className="w-full"
            >
              Request new verification
            </Button>
            <Button 
              onClick={() => router.push("/login")}
              className="w-full"
            >
              Back to login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-center text-green-600">
              Email Verified!
            </CardTitle>
            <CardDescription className="text-center">
              Your email has been successfully verified. You can now sign in to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push("/login")}
              className="w-full"
            >
              Continue to login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
