const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Store connected clients and their subscriptions
const clients = new Map();
const subscriptions = new Map(); // userId -> Set of client IDs

console.log('🚀 Enhanced WebSocket server starting...');

wss.on('connection', (ws) => {
  const clientId = Date.now() + Math.random();
  clients.set(clientId, ws);
  
  console.log(`🔌 New client connected: ${clientId}`);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(clientId, data);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log(`🔌 Client disconnected: ${clientId}`);
    removeClient(clientId);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
    removeClient(clientId);
  });
});

function handleMessage(clientId, data) {
  console.log(`📨 Received from client ${clientId}:`, data.type);

  switch (data.type) {
    case 'subscribe':
      handleSubscribe(clientId, data);
      break;
    
    case 'ping':
      handlePing(clientId);
      break;
    
    case 'notification':
      handleNotification(clientId, data);
      break;
    
    case 'dashboard_update':
      handleDashboardUpdate(clientId, data);
      break;
    
    case 'application_update':
      handleApplicationUpdate(clientId, data);
      break;
    
    case 'user_update':
      handleUserUpdate(clientId, data);
      break;
    
    case 'leave_balance_update':
      handleLeaveBalanceUpdate(clientId, data);
      break;
    
    case 'faculty_update':
      handleFacultyUpdate(clientId, data);
      break;
    
    case 'department_update':
      handleDepartmentUpdate(clientId, data);
      break;
    
    case 'calendar_update':
      handleCalendarUpdate(clientId, data);
      break;
    
    default:
      console.log(`Unknown message type: ${data.type}`);
  }
}

function handleSubscribe(clientId, data) {
  const { userId } = data;
  
  if (!subscriptions.has(userId)) {
    subscriptions.set(userId, new Set());
  }
  
  subscriptions.get(userId).add(clientId);
  console.log(`👤 Client ${clientId} subscribed to user ${userId}`);
  
  // Send confirmation
  sendToClient(clientId, {
    type: 'subscription_confirmed',
    userId: userId,
    timestamp: Date.now()
  });
}

function handlePing(clientId) {
  sendToClient(clientId, {
    type: 'pong',
    timestamp: Date.now()
  });
}

function handleNotification(clientId, data) {
  const { userId, notification } = data;
  broadcastToUser(userId, {
    type: 'notification',
    data: notification,
    timestamp: Date.now()
  });
}

function handleDashboardUpdate(clientId, data) {
  const { userId, dashboardData } = data;
  broadcastToUser(userId, {
    type: 'dashboard_update',
    data: dashboardData,
    timestamp: Date.now()
  });
}

function handleApplicationUpdate(clientId, data) {
  const { userId, applicationData } = data;
  broadcastToUser(userId, {
    type: 'application_update',
    data: applicationData,
    timestamp: Date.now()
  });
}

function handleUserUpdate(clientId, data) {
  const { userId, userData } = data;
  broadcastToUser(userId, {
    type: 'user_update',
    data: userData,
    timestamp: Date.now()
  });
}

function handleLeaveBalanceUpdate(clientId, data) {
  const { userId, leaveBalanceData } = data;
  broadcastToUser(userId, {
    type: 'leave_balance_update',
    data: leaveBalanceData,
    timestamp: Date.now()
  });
}

function handleFacultyUpdate(clientId, data) {
  const { userId, facultyData } = data;
  broadcastToUser(userId, {
    type: 'faculty_update',
    data: facultyData,
    timestamp: Date.now()
  });
}

function handleDepartmentUpdate(clientId, data) {
  const { userId, departmentData } = data;
  broadcastToUser(userId, {
    type: 'department_update',
    data: departmentData,
    timestamp: Date.now()
  });
}

function handleCalendarUpdate(clientId, data) {
  const { userId, calendarData } = data;
  broadcastToUser(userId, {
    type: 'calendar_update',
    data: calendarData,
    timestamp: Date.now()
  });
}

function broadcastToUser(userId, message) {
  const userSubscriptions = subscriptions.get(userId);
  if (!userSubscriptions) return;

  const messageStr = JSON.stringify(message);
  let sentCount = 0;

  userSubscriptions.forEach(clientId => {
    if (sendToClient(clientId, message)) {
      sentCount++;
    }
  });

  console.log(`📡 Broadcasted ${message.type} to ${sentCount} clients for user ${userId}`);
}

function sendToClient(clientId, message) {
  const ws = clients.get(clientId);
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return false;
  }

  try {
    ws.send(JSON.stringify(message));
    return true;
  } catch (error) {
    console.error(`Error sending message to client ${clientId}:`, error);
    return false;
  }
}

function removeClient(clientId) {
  // Remove from clients
  clients.delete(clientId);
  
  // Remove from all subscriptions
  subscriptions.forEach((clientSet, userId) => {
    clientSet.delete(clientId);
    if (clientSet.size === 0) {
      subscriptions.delete(userId);
    }
  });
}

// Broadcast to all connected clients
function broadcastToAll(message) {
  const messageStr = JSON.stringify(message);
  let sentCount = 0;

  clients.forEach((ws, clientId) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(messageStr);
        sentCount++;
      } catch (error) {
        console.error(`Error broadcasting to client ${clientId}:`, error);
      }
    }
  });

  console.log(`📡 Broadcasted to ${sentCount} clients`);
}

// API endpoints for external services to trigger updates
const express = require('express');
const app = express();
app.use(express.json());

// Notification endpoint
app.post('/api/realtime/notify', (req, res) => {
  const { userId, title, message, action } = req.body;
  
  broadcastToUser(userId, {
    type: 'notification',
    data: { title, message, action },
    timestamp: Date.now()
  });
  
  res.json({ success: true });
});

// Dashboard update endpoint
app.post('/api/realtime/dashboard', (req, res) => {
  const { userId, data } = req.body;
  
  broadcastToUser(userId, {
    type: 'dashboard_update',
    data: data,
    timestamp: Date.now()
  });
  
  res.json({ success: true });
});

// Application update endpoint
app.post('/api/realtime/application', (req, res) => {
  const { userId, type, application } = req.body;
  
  broadcastToUser(userId, {
    type: 'application_update',
    data: { type, application },
    timestamp: Date.now()
  });
  
  res.json({ success: true });
});

// Leave balance update endpoint
app.post('/api/realtime/leave-balance', (req, res) => {
  const { userId, data } = req.body;
  
  broadcastToUser(userId, {
    type: 'leave_balance_update',
    data: data,
    timestamp: Date.now()
  });
  
  res.json({ success: true });
});

// Faculty update endpoint
app.post('/api/realtime/faculty', (req, res) => {
  const { userId, type, faculty } = req.body;
  
  broadcastToUser(userId, {
    type: 'faculty_update',
    data: { type, faculty },
    timestamp: Date.now()
  });
  
  res.json({ success: true });
});

// Department update endpoint
app.post('/api/realtime/department', (req, res) => {
  const { userId, data } = req.body;
  
  broadcastToUser(userId, {
    type: 'department_update',
    data: data,
    timestamp: Date.now()
  });
  
  res.json({ success: true });
});

// Calendar update endpoint
app.post('/api/realtime/calendar', (req, res) => {
  const { userId, data } = req.body;
  
  broadcastToUser(userId, {
    type: 'calendar_update',
    data: data,
    timestamp: Date.now()
  });
  
  res.json({ success: true });
});

// Status endpoint
app.get('/api/realtime/status', (req, res) => {
  res.json({
    connectedClients: clients.size,
    activeSubscriptions: subscriptions.size,
    timestamp: Date.now()
  });
});

// Mount API routes on the same server
server.on('request', app);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Enhanced WebSocket server started on port ${PORT}`);
  console.log(`📡 Real-time API available at http://localhost:${PORT}/api/realtime`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down WebSocket server...');
  wss.close(() => {
    server.close(() => {
      console.log('✅ WebSocket server shut down gracefully');
      process.exit(0);
    });
  });
});
