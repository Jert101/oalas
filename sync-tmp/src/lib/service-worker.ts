// Service Worker Registration Utility
class ServiceWorkerManager {
  private swRegistration: ServiceWorkerRegistration | null = null
  private isSupported = 'serviceWorker' in navigator

  async register(): Promise<void> {
    if (!this.isSupported) {
      console.log('⚠️ Service Worker not supported')
      return
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      console.log('🚀 Service Worker registered:', this.swRegistration)

      // Handle updates
      this.swRegistration.addEventListener('updatefound', () => {
        const newWorker = this.swRegistration!.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New Service Worker available')
              this.showUpdateNotification()
            }
          })
        }
      })

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker controller changed')
        window.location.reload()
      })

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error)
    }
  }

  private showUpdateNotification(): void {
    // Show update notification to user
    if (confirm('A new version of OALASS is available. Would you like to update?')) {
      this.swRegistration?.waiting?.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  async unregister(): Promise<void> {
    if (this.swRegistration) {
      await this.swRegistration.unregister()
      console.log('🗑️ Service Worker unregistered')
    }
  }

  getRegistration(): ServiceWorkerRegistration | null {
    return this.swRegistration
  }

  isReady(): boolean {
    return this.swRegistration?.active?.state === 'activated'
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('⚠️ Notifications not supported')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      console.log('❌ Notification permission denied')
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  // Send push notification
  async sendNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/ckcm.png',
        badge: '/ckcm.png',
        ...options
      })
    }
  }

  // Get cache statistics
  async getCacheStats(): Promise<any> {
    if (!this.swRegistration?.active) {
      return null
    }

    return new Promise((resolve) => {
      const channel = new MessageChannel()
      
      channel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_STATS') {
          resolve(event.data.data)
        }
      }

      this.swRegistration!.active!.postMessage(
        { type: 'GET_CACHE_STATS' },
        [channel.port2]
      )
    })
  }
}

export const serviceWorkerManager = new ServiceWorkerManager()

// Auto-register on client side
if (typeof window !== 'undefined') {
  serviceWorkerManager.register()
}












