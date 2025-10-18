// Service Worker for OALASS - Offline Caching & Network Optimization
const CACHE_NAME = 'oalass-v1.0.1'
const STATIC_CACHE = 'oalass-static-v1.0.1'
const API_CACHE = 'oalass-api-v1.0.1'

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/login',
  '/dashboard',
  '/admin/console',
  '/teacher/dashboard',
  '/dean/dashboard',
  '/finance/dashboard',
  '/static/css/globals.css',
  '/static/js/main.js',
  '/favicon.ico',
  '/ckcm.png'
]

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/notifications',
  '/api/user/current',
  '/api/calendar-period/current',
  '/api/teacher/dashboard',
  '/api/dean/dashboard-stats',
  '/api/finance/dashboard-stats'
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker installing...')
  
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Caching static files...')
        return cache.addAll(STATIC_FILES)
      }),
      
      // Cache API responses
      caches.open(API_CACHE).then((cache) => {
        console.log('🔌 Caching API endpoints...')
        return Promise.all(
          API_ENDPOINTS.map(endpoint => 
            fetch(endpoint).then(response => {
              if (response.ok) {
                return cache.put(endpoint, response.clone())
              }
            }).catch(() => {
              // Silently fail for offline scenarios
            })
          )
        )
      })
    ]).then(() => {
      console.log('✅ Service Worker installed successfully')
      return self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            console.log('🗑️ Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('✅ Service Worker activated')
      return self.clients.claim()
    })
  )
})

// Fetch event - network first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle static files
  if (url.origin === self.location.origin) {
    event.respondWith(handleStaticRequest(request))
    return
  }
})

// API request handler - Network first, cache fallback
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE)
  
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Optionally bypass caching for dynamic lists
      const url = new URL(request.url)
      const bypassCache = url.pathname.startsWith('/api/teacher/leave-types') || url.pathname.startsWith('/api/leave-types')
      if (!bypassCache) {
        // Cache the fresh response
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    }
  } catch (error) {
    console.log('🌐 Network failed, trying cache...')
  }

  // Fallback to cache
  const cachedResponse = await cache.match(request)
  if (cachedResponse) {
    console.log('📦 Serving from cache:', request.url)
    return cachedResponse
  }

  // Return offline response
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: 'Offline - No cached data available' 
    }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

// Static file handler - Cache first, network fallback
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE)
  
  // Try cache first
  const cachedResponse = await cache.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    // Fallback to network
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    // Return offline page
    return cache.match('/')
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Background sync triggered')
    event.waitUntil(performBackgroundSync())
  }
})

async function performBackgroundSync() {
  try {
    // Sync any pending offline actions
    const pendingActions = await getPendingActions()
    
    for (const action of pendingActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        })
        
        // Remove from pending actions
        await removePendingAction(action.id)
      } catch (error) {
        console.error('Background sync failed for action:', action.id)
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Store pending actions for offline scenarios
async function getPendingActions() {
  // This would typically use IndexedDB
  return []
}

async function removePendingAction(id) {
  // This would typically use IndexedDB
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received')
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from OALASS',
    icon: '/ckcm.png',
    badge: '/ckcm.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/ckcm.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/ckcm.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('OALASS Notification', options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked')
  
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    )
  }
})

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATS') {
    event.ports[0].postMessage({
      type: 'CACHE_STATS',
      data: {
        staticCache: STATIC_CACHE,
        apiCache: API_CACHE,
        staticFiles: STATIC_FILES.length,
        apiEndpoints: API_ENDPOINTS.length
      }
    })
  }
})












