# WebSocket Setup for Real-time Notifications

## Overview
The OALASS system uses WebSocket connections to provide real-time notifications to users. The notification bell component connects to a WebSocket server running on port 3001.

## Quick Start

### Option 1: Start Both Servers Together (Recommended)
```bash
npm run dev:full
```
This starts both the Next.js development server and the WebSocket server concurrently.

### Option 2: Use the Batch File (Windows)
```bash
start-dev.bat
```

### Option 3: Start Servers Separately
```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Start WebSocket server
node websocket-server.js
```

## Checking WebSocket Status
To check if the WebSocket server is running:
```bash
node check-websocket.js
```

## Troubleshooting

### WebSocket Error: {}
This error occurs when the WebSocket server is not running. The notification bell will still work but without real-time updates.

**Solution:**
1. Start the WebSocket server: `node websocket-server.js`
2. Or use the full development setup: `npm run dev:full`

### Connection Refused
If you see "Connection refused" errors:
1. Make sure port 3001 is not being used by another application
2. Check if the WebSocket server is running: `node check-websocket.js`
3. Restart the WebSocket server

### Notifications Not Appearing in Real-time
1. Check the browser console for WebSocket connection status
2. Verify the WebSocket server is running
3. Check if the user is properly authenticated
4. Look for the green dot indicator on the notification bell (indicates WebSocket connection)

## How It Works

1. **WebSocket Server** (`websocket-server.js`):
   - Runs on port 3001
   - Handles client connections
   - Broadcasts notifications to specific users

2. **Notification Bell Component** (`src/components/notification-bell.tsx`):
   - Connects to WebSocket server on page load
   - Subscribes to notifications for the current user
   - Updates in real-time when new notifications arrive
   - Falls back to polling if WebSocket is unavailable

3. **Notification Service** (`src/lib/notification-service.ts`):
   - Creates notifications in the database
   - Sends WebSocket messages for real-time delivery
   - Gracefully handles WebSocket unavailability

## Environment Variables
- `NEXT_PUBLIC_WS_URL`: WebSocket server URL (defaults to `ws://localhost:3001`)

## Development Notes
- The WebSocket connection is established only on the client side
- If the WebSocket server is not available, notifications still work via polling
- The system gracefully degrades when WebSocket is unavailable
- Real-time updates are indicated by a green dot on the notification bell

