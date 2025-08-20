import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().min(1, "Email or User ID is required").refine((val) => {
    // Accept either a valid email or a numeric/string user ID (e.g., 25010xxx)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(val) || val.length >= 5
  }, "Enter a valid email or user ID"),
  password: z.string().min(1, "Password is required")
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address")
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role_id: z.string().min(1, "Role is required"),
  isActive: z.boolean().default(true)
})

export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
