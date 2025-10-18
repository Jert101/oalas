"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { realtimeClient } from "@/lib/realtime-client"

interface RealtimeProviderProps {
  children: React.ReactNode
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.user?.users_id) {
      realtimeClient.connect(session.user.users_id)
    }

    return () => {
      realtimeClient.disconnect()
    }
  }, [session?.user?.users_id])

  return <>{children}</>
}












