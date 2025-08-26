// Real-time Hook for React Components
import { useEffect, useRef, useState } from 'react'
import { realtimeClient } from '@/lib/realtime-client'

interface UseRealtimeOptions {
  userId?: string
  autoConnect?: boolean
  events?: string[]
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { userId, autoConnect = true, events = [] } = options
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const callbackRefs = useRef<Map<string, string>>(new Map())

  // Connect to real-time service
  const connect = async (targetUserId?: string) => {
    const targetId = targetUserId || userId
    if (!targetId) return

    try {
      await realtimeClient.connect(targetId)
      setIsConnected(true)
    } catch (error) {
      console.error('Failed to connect to real-time service:', error)
    }
  }

  // Disconnect from real-time service
  const disconnect = () => {
    realtimeClient.disconnect()
    setIsConnected(false)
  }

  // Subscribe to specific event
  const subscribe = (eventType: string, callback: (data: any) => void) => {
    const callbackId = realtimeClient.on(eventType, callback)
    callbackRefs.current.set(eventType, callbackId)
    return callbackId
  }

  // Subscribe to any event
  const subscribeToAny = (callback: (data: any) => void) => {
    const callbackId = realtimeClient.onAny(callback)
    callbackRefs.current.set('any', callbackId)
    return callbackId
  }

  // Unsubscribe from event
  const unsubscribe = (eventType: string) => {
    const callbackId = callbackRefs.current.get(eventType)
    if (callbackId) {
      realtimeClient.off(callbackId)
      callbackRefs.current.delete(eventType)
    }
  }

  // Send message
  const sendMessage = (type: string, data: any) => {
    realtimeClient.sendMessage(type, data)
  }

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && userId) {
      connect()
    }

    // Cleanup on unmount
    return () => {
      callbackRefs.current.forEach((callbackId) => {
        realtimeClient.off(callbackId)
      })
      callbackRefs.current.clear()
    }
  }, [userId, autoConnect])

  // Update connection status
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(realtimeClient.getConnectionStatus())
    }

    checkConnection()
    const interval = setInterval(checkConnection, 1000)

    return () => clearInterval(interval)
  }, [])

  return {
    isConnected,
    lastMessage,
    connect,
    disconnect,
    subscribe,
    subscribeToAny,
    unsubscribe,
    sendMessage
  }
}

// Specialized hooks for common use cases
export function useRealtimeNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<any[]>([])
  const { subscribe, isConnected } = useRealtime({ userId, autoConnect: true })

  useEffect(() => {
    if (!userId) return

    try {
      const callbackId = subscribe('notification', (data) => {
        setNotifications(prev => [data, ...prev.slice(0, 9)]) // Keep last 10
      })

      return () => {
        // Cleanup handled by useRealtime
      }
    } catch (error) {
      console.warn('Failed to subscribe to notifications:', error)
    }
  }, [subscribe, userId])

  return { notifications, isConnected }
}

export function useRealtimeDashboard(userId?: string) {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const { subscribe, isConnected } = useRealtime({ userId, autoConnect: true })

  useEffect(() => {
    const callbackId = subscribe('dashboard_update', (data) => {
      setDashboardData(data)
    })

    return () => {
      // Cleanup handled by useRealtime
    }
  }, [subscribe])

  return { dashboardData, isConnected }
}

export function useRealtimeApplications(userId?: string) {
  const [applications, setApplications] = useState<any[]>([])
  const { subscribe, isConnected } = useRealtime({ userId, autoConnect: true })

  useEffect(() => {
    const callbackId = subscribe('application_update', (data) => {
      if (data.type === 'new') {
        setApplications(prev => [data.application, ...prev])
      } else if (data.type === 'update') {
        setApplications(prev => 
          prev.map(app => 
            app.id === data.application.id ? data.application : app
          )
        )
      } else if (data.type === 'delete') {
        setApplications(prev => 
          prev.filter(app => app.id !== data.applicationId)
        )
      }
    })

    return () => {
      // Cleanup handled by useRealtime
    }
  }, [subscribe])

  return { applications, isConnected }
}

export function useRealtimeLeaveBalance(userId?: string) {
  const [leaveBalance, setLeaveBalance] = useState<any>(null)
  const { subscribe, isConnected } = useRealtime({ userId, autoConnect: true })

  useEffect(() => {
    const callbackId = subscribe('leave_balance_update', (data) => {
      setLeaveBalance(data)
    })

    return () => {
      // Cleanup handled by useRealtime
    }
  }, [subscribe])

  return { leaveBalance, isConnected }
}

export function useRealtimeFaculty(userId?: string) {
  const [faculty, setFaculty] = useState<any[]>([])
  const { subscribe, isConnected } = useRealtime({ userId, autoConnect: true })

  useEffect(() => {
    const callbackId = subscribe('faculty_update', (data) => {
      if (data.type === 'new') {
        setFaculty(prev => [...prev, data.faculty])
      } else if (data.type === 'update') {
        setFaculty(prev => 
          prev.map(f => f.id === data.faculty.id ? data.faculty : f)
        )
      } else if (data.type === 'delete') {
        setFaculty(prev => 
          prev.filter(f => f.id !== data.facultyId)
        )
      }
    })

    return () => {
      // Cleanup handled by useRealtime
    }
  }, [subscribe])

  return { faculty, isConnected }
}
