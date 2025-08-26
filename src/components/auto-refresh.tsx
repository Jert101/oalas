"use client"

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface AutoRefreshProps {
  interval?: number // Refresh interval in milliseconds (default: 30 seconds)
  enabled?: boolean // Whether auto-refresh is enabled (default: true)
}

export function AutoRefresh({ interval = 30000, enabled = true }: AutoRefreshProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateRef = useRef<number>(Date.now())

  useEffect(() => {
    if (!enabled || !session?.user?.id) return

    // Function to refresh the current page
    const refreshPage = () => {
      console.log('🔄 Auto-refreshing page...')
      router.refresh()
    }

    // Set up interval for auto-refresh
    intervalRef.current = setInterval(refreshPage, interval)

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, interval, router, session?.user?.id])

  // Listen for visibility changes to pause/resume when tab is not active
  useEffect(() => {
    if (!enabled) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause auto-refresh when tab is not visible
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else {
        // Resume auto-refresh when tab becomes visible
        if (!intervalRef.current) {
          intervalRef.current = setInterval(() => {
            console.log('🔄 Auto-refreshing page...')
            router.refresh()
          }, interval)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, interval, router])

  return null // This component doesn't render anything
}

// Hook for manual refresh triggers
export function useAutoRefresh() {
  const router = useRouter()

  const triggerRefresh = () => {
    console.log('🔄 Manual refresh triggered...')
    router.refresh()
  }

  return { triggerRefresh }
}

