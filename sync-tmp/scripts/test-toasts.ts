import { toast } from "sonner"

// Test sonner toast functionality
export function testToasts() {
  // Success toast
  toast.success("Login successful!")
  
  // Error toast
  setTimeout(() => {
    toast.error("Invalid credentials")
  }, 1000)
  
  // Loading toast
  setTimeout(() => {
    toast.loading("Signing in...")
  }, 2000)
  
  // Promise toast
  setTimeout(() => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Processing...',
        success: 'Done!',
        error: 'Failed!',
      }
    )
  }, 3000)
}

// For testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testToasts = testToasts
}
