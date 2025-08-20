const WebSocket = require('ws');

// Check if WebSocket server is running
function checkWebSocketServer() {
  const wsUrl = 'ws://localhost:3001';
  console.log('🔍 Checking WebSocket server status...');
  
  try {
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('✅ WebSocket server is running and accessible');
      ws.close();
      process.exit(0);
    };
    
    ws.onerror = (error) => {
      console.log('❌ WebSocket server is not running or not accessible');
      console.log('💡 To start the WebSocket server, run: node websocket-server.js');
      process.exit(1);
    };
    
    // Timeout after 5 seconds
    setTimeout(() => {
      console.log('⏰ Connection timeout - WebSocket server may not be running');
      process.exit(1);
    }, 5000);
    
  } catch (error) {
    console.log('❌ Error connecting to WebSocket server:', error.message);
    process.exit(1);
  }
}

checkWebSocketServer();


