const WebSocket = require('ws');

// Test WebSocket connection and account approval notification
async function testApprovalNotification() {
  console.log('🧪 Testing Account Approval Notification System...\n');

  // Test 1: WebSocket Connection
  console.log('1. Testing WebSocket connection...');
  const ws = new WebSocket('ws://localhost:3001');
  
  ws.on('open', () => {
    console.log('✅ WebSocket connected successfully');
    
    // Subscribe to account approval updates
    ws.send(JSON.stringify({
      type: 'subscribe',
      userId: 'test@example.com'
    }));
  });

  ws.on('message', (data) => {
    const message = JSON.parse(data);
    console.log('📨 Received message:', message);
    
    if (message.type === 'subscription_confirmed') {
      console.log('✅ Subscription confirmed');
      
      // Test 2: Send notification via HTTP API
      console.log('\n2. Testing HTTP notification API...');
      testHttpNotification();
    }
    
    if (message.type === 'account_approval_update') {
      console.log('✅ Account approval notification received!');
      console.log('📋 Notification data:', message.data);
      ws.close();
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
  });
}

async function testHttpNotification() {
  try {
    const response = await fetch('http://localhost:3000/api/websocket/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'account_approval_update',
        email: 'test@example.com',
        status: 'approved',
        userId: 'test@example.com'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ HTTP notification sent successfully');
      console.log('📋 Response:', result);
    } else {
      console.error('❌ HTTP notification failed:', result);
    }
  } catch (error) {
    console.error('❌ HTTP notification error:', error.message);
  }
}

// Run the test
testApprovalNotification();








