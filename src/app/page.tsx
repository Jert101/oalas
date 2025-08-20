"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { loginSchema, type LoginInput } from "@/lib/validators/auth"
import Link from "next/link"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function Home() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isForgotOpen, setIsForgotOpen] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false
      })

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Login successful!")
        
        // Get session to check user role
        const session = await getSession()
        
        // Redirect based on role
        if (session?.user?.role === "Admin") {
          router.push("/admin/console")
        } else if (session?.user?.role === "Finance Officer") {
          router.push("/finance/dashboard")
        } else {
          router.push("/dashboard")
        }
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Welcome to OALAS
          </CardTitle>
          <CardDescription className="text-center">
            Online Application for Leave of Absence System
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Credentials Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email or User ID</Label>
              <Input
                id="email"
                type="text"
                placeholder="email@example.com or 25010xxx"
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...register("password")}
                  className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-end">
              <button 
                type="button"
                onClick={() => setIsForgotOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </button>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

        </CardContent>
      </Card>
      <FooterLegal />

      <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forgot Password</DialogTitle>
            <DialogDescription>
              This feature is not yet available. Please approach the administration for password resetting.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsForgotOpen(false)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FooterLegal() {
  const year = new Date().getFullYear()
  return (
    <div className="mt-6 text-center text-xs text-muted-foreground max-w-md">
      <span className="font-semibold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">CKCM OALAS</span>
      {" "}is a trademark of{" "}
      <span className="font-semibold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">Jerson Catadman</span>.
      {" "}© 2024 - {year} CKCM Technologies, LLC.
    </div>
  )
}
