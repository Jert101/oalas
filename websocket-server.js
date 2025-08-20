const WebSocket = require('ws');

// Create WebSocket server on port 3001
const wss = new WebSocket.Server({ port: 3001 });

// Store connected clients
const clients = new Map();

console.log('WebSocket server started on port 3001');

wss.on('connection', (ws, req) => {
  console.log('New client connected');
  
  // Generate a unique client ID
  const clientId = Date.now().toString();
  clients.set(clientId, ws);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to notification server',
    clientId: clientId
  }));
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);
      
      // Handle different message types
      switch (data.type) {
        case 'subscribe':
          // Client wants to subscribe to notifications for a specific user
          ws.userId = data.userId;
          console.log(`Client ${clientId} subscribed to user ${data.userId}`);
          break;
          
        case 'notification':
          // Broadcast notification to specific user
          broadcastToUser(data.userId, {
            type: 'notification',
            notification: data.notification
          });
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected:', clientId);
    clients.delete(clientId);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(clientId);
  });
});

// Function to broadcast notification to a specific user
function broadcastToUser(userId, message) {
  let sentCount = 0;
  
  clients.forEach((client, clientId) => {
    if (client.userId === userId && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
      sentCount++;
    }
  });
  
  console.log(`Sent notification to ${sentCount} clients for user ${userId}`);
}

// Function to broadcast to all connected clients
function broadcastToAll(message) {
  let sentCount = 0;
  
  clients.forEach((client, clientId) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
      sentCount++;
    }
  });
  
  console.log(`Broadcasted message to ${sentCount} clients`);
}

// Export functions for use in other parts of the application
module.exports = {
  broadcastToUser,
  broadcastToAll,
  getClientCount: () => clients.size
};

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down WebSocket server...');
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});
