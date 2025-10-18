// Real-time Client for OALASS - Live Updates Across All Pages
import { toast } from 'sonner'

interface RealtimeMessage {
  type: string
  data: any
  userId?: string
  timestamp: number
}

interface RealtimeCallback {
  id: string
  callback: (data: any) => void
  type?: string
}

class RealtimeClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3  // Reduced from 10 to 3
  private reconnectDelay = 2000     // Increased from 1000ms to 2000ms
  private isConnecting = false
  private callbacks: Map<string, RealtimeCallback> = new Map()
  private userId: string | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private isConnected = false

  // Connect to WebSocket server
  async connect(userId: string): Promise<void> {
    if (this.isConnecting || this.isConnected) return

    this.userId = userId
    this.isConnecting = true

    try {
      // Use the same hostname as the current page, but port 3001 for WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const hostname = window.location.hostname
      const wsUrl = `${protocol}//${hostname}:3001`
      
      console.log('🔌 Attempting to connect to:', wsUrl)
      this.ws = new WebSocket(wsUrl)
      


      this.ws.onmessage = (event) => {
        try {
          const message: RealtimeMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('🔌 Real-time connection closed')
        this.isConnected = false
        this.stopHeartbeat()
        this.scheduleReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.isConnected = false
        this.isConnecting = false
      }

      // Add connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.isConnecting) {
          console.warn('WebSocket connection timeout')
          this.isConnecting = false
          if (this.ws) {
            this.ws.close()
          }
        }
      }, 5000) // 5 second timeout

      this.ws.onopen = () => {
        clearTimeout(connectionTimeout)
        console.log('🔌 Real-time connection established')
        this.isConnected = true
        this.isConnecting = false
        this.reconnectAttempts = 0
        
        // Subscribe to user-specific updates
        this.send({
          type: 'subscribe',
          userId: this.userId
        })

        // Start heartbeat
        this.startHeartbeat()
      }

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
      this.isConnecting = false
      this.scheduleReconnect()
    }
  }

  // Send message to WebSocket server
  private send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  // Handle incoming messages
  private handleMessage(message: RealtimeMessage): void {
    console.log('📨 Real-time message received:', message.type)

    switch (message.type) {
      case 'notification':
        this.handleNotification(message.data)
        break
      
      case 'dashboard_update':
        this.handleDashboardUpdate(message.data)
        break
      
      case 'application_update':
        this.handleApplicationUpdate(message.data)
        break
      
      case 'user_update':
        this.handleUserUpdate(message.data)
        break
      
      case 'leave_balance_update':
        this.handleLeaveBalanceUpdate(message.data)
        break
      
      case 'faculty_update':
        this.handleFacultyUpdate(message.data)
        break
      
      case 'department_update':
        this.handleDepartmentUpdate(message.data)
        break
      
      case 'calendar_update':
        this.handleCalendarUpdate(message.data)
        break
      
      case 'pong':
        // Heartbeat response
        break
      
      default:
        // Trigger generic callbacks
        this.triggerCallbacks(message.type, message.data)
    }
  }

  // Handle notification updates
  private handleNotification(data: any): void {
    // Show toast notification
    if (data.title && data.message) {
      toast(data.title, {
        description: data.message,
        action: data.action ? {
          label: data.action.label,
          onClick: () => {
            if (data.action.url) {
              window.location.href = data.action.url
            }
          }
        } : undefined
      })
    }

    // Trigger notification callbacks
    this.triggerCallbacks('notification', data)
  }

  // Handle dashboard updates
  private handleDashboardUpdate(data: any): void {
    this.triggerCallbacks('dashboard_update', data)
  }

  // Handle application updates
  private handleApplicationUpdate(data: any): void {
    this.triggerCallbacks('application_update', data)
  }

  // Handle user updates
  private handleUserUpdate(data: any): void {
    this.triggerCallbacks('user_update', data)
  }

  // Handle leave balance updates
  private handleLeaveBalanceUpdate(data: any): void {
    this.triggerCallbacks('leave_balance_update', data)
  }

  // Handle faculty updates
  private handleFacultyUpdate(data: any): void {
    this.triggerCallbacks('faculty_update', data)
  }

  // Handle department updates
  private handleDepartmentUpdate(data: any): void {
    this.triggerCallbacks('department_update', data)
  }

  // Handle calendar updates
  private handleCalendarUpdate(data: any): void {
    this.triggerCallbacks('calendar_update', data)
  }

  // Register callback for specific event type
  on(eventType: string, callback: (data: any) => void): string {
    const id = `${eventType}_${Date.now()}_${Math.random()}`
    this.callbacks.set(id, { id, callback, type: eventType })
    return id
  }

  // Register callback for any event
  onAny(callback: (data: any) => void): string {
    const id = `any_${Date.now()}_${Math.random()}`
    this.callbacks.set(id, { id, callback })
    return id
  }

  // Remove callback
  off(callbackId: string): void {
    this.callbacks.delete(callbackId)
  }

  // Trigger callbacks for specific event type
  private triggerCallbacks(eventType: string, data: any): void {
    this.callbacks.forEach((callback) => {
      if (callback.type === eventType || !callback.type) {
        try {
          callback.callback(data)
        } catch (error) {
          console.error('Callback error:', error)
        }
      }
    })
  }

  // Start heartbeat to keep connection alive
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping' })
      }
    }, 30000) // Send ping every 30 seconds
  }

  // Stop heartbeat
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // Schedule reconnection
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached')
      return
    }

    setTimeout(() => {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      this.connect(this.userId!)
    }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts))
  }

  // Disconnect
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
    this.isConnecting = false
    this.stopHeartbeat()
    this.callbacks.clear()
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  // Send custom message
  sendMessage(type: string, data: any): void {
    this.send({ type, data, userId: this.userId })
  }
}

export const realtimeClient = new RealtimeClient()
