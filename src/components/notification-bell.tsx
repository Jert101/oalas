"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, BellOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: string
  isRead: boolean
  link?: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [wsConnected, setWsConnected] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Load initial notifications
    loadNotifications()
    
    // Only set up WebSocket on client side
    if (typeof window === 'undefined') return
    
    // Set up WebSocket connection for real-time updates with retry and backoff
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `${wsProtocol}://${window.location.hostname}:3001`
    console.log('🔌 WebSocket target:', wsUrl)
    let ws: WebSocket | null = null
    let retryTimeout: ReturnType<typeof setTimeout> | null = null
    let isConnecting = false
    let reconnectAttempt = 0

    const connect = () => {
      if (isConnecting) return
      isConnecting = true
      
      try {
        console.log('🔌 Connecting to WebSocket:', wsUrl)
        ws = new WebSocket(wsUrl)
      } catch (e) {
        console.warn('WebSocket construct error (will retry):', e)
        isConnecting = false
        scheduleReconnect()
        return
      }
    
      ws.onopen = () => {
        console.log('WebSocket connected')
        isConnecting = false
        setWsConnected(true)
        reconnectAttempt = 0
        // Subscribe to notifications for the current user
        fetch('/api/user/current')
          .then(res => res.json())
          .then(data => {
            if (data?.success && data.user && ws?.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'subscribe',
                userId: data.user.users_id
              }))
            }
          })
          .catch(error => {
            console.error('Error getting current user:', error)
          })
      }
    
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('WebSocket message received:', data)
          if (data.type === 'notification') {
            addNotification(data.notification)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
    
      ws.onerror = (error) => {
        // Downgrade to warn to avoid dev overlay; schedule reconnect
        console.warn('WebSocket error (will retry):', error)
        isConnecting = false
      }
    
      ws.onclose = () => {
        console.log('WebSocket disconnected')
        isConnecting = false
        setWsConnected(false)
        // Always schedule reconnect with backoff; this lets the client recover
        scheduleReconnect()
      }
    }

    const scheduleReconnect = () => {
      if (retryTimeout) return
      // Exponential backoff up to 30s
      const delay = Math.min(30000, 1000 * Math.pow(2, reconnectAttempt || 0))
      reconnectAttempt = Math.min(reconnectAttempt + 1, 10)
      console.log(`⏳ Reconnecting WebSocket in ${Math.round(delay / 1000)}s (attempt ${reconnectAttempt})`)
      retryTimeout = setTimeout(() => {
        retryTimeout = null
        connect()
      }, delay)
    }

    // Delay initial connection to ensure page is fully loaded
    const initialTimeout = setTimeout(() => {
      connect()
    }, 1000)
    
    // Set up periodic refresh as fallback (every 30 seconds)
    const refreshInterval = setInterval(() => {
      loadNotifications()
    }, 30000)
    
    return () => {
      if (retryTimeout) clearTimeout(retryTimeout)
      if (initialTimeout) clearTimeout(initialTimeout)
      if (refreshInterval) clearInterval(refreshInterval)
      ws?.close()
    }
  }, [])

  useEffect(() => {
    // Update unread count whenever notifications change
    setUnreadCount(notifications.filter(n => !n.isRead).length)
  }, [notifications])

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const addNotification = (notification: Notification) => {
    console.log('Adding new notification:', notification)
    setNotifications(prev => [notification, ...prev])
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      })
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      })
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        )
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'error':
        return '❌'
      default:
        return 'ℹ️'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    
    if (notification.link) {
      // Prefer client navigation
      try {
        router.push(notification.link)
      } catch {
        window.location.href = notification.link
      }
    }
    
    setIsOpen(false)
  }



  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {unreadCount > 0 ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          {wsConnected ? (
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full" title="WebSocket connected" />
          ) : (
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-gray-400 rounded-full" title="WebSocket disconnected" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Mark all as read
                  </Button>
                )}

              </div>
            </div>
          </CardHeader>
          <Separator />
          <div className="max-h-80 overflow-y-auto">
            <CardContent className="p-0">
              {notifications.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  <div className="text-center">
                    <BellOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      } ${index !== notifications.length - 1 ? 'border-b' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-600'
                            }`}>
                              {notification.title}
                            </p>
                            <span className="text-xs text-gray-400" suppressHydrationWarning>
                              {formatTimestamp(notification.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
