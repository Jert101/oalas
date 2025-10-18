const fetch = require('node-fetch');

async function testAdminDashboard() {
  try {
    console.log('🧪 Testing Admin Dashboard APIs...');
    
    // Test the dashboard stats endpoint
    console.log('\n📊 Testing Dashboard Stats API...');
    const statsResponse = await fetch('http://localhost:3000/api/admin/dashboard', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const statsData = await statsResponse.json();
    
    console.log('📊 Stats Response Status:', statsResponse.status);
    if (statsResponse.ok && statsData.success) {
      console.log('✅ Dashboard Stats API Test Passed!');
      console.log(`👥 Total Users: ${statsData.data.totalUsers}`);
      console.log(`📈 Recent Users: ${statsData.data.recentUsers}`);
      console.log(`⚠️ Active Probations: ${statsData.data.activeProbations}`);
      console.log(`📋 Pending Leave Applications: ${statsData.data.pendingLeaveApplications}`);
      console.log(`📅 Monthly Leave Applications: ${statsData.data.monthlyLeaveApplications}`);
      console.log(`📊 Growth Rate: ${statsData.data.growthRate}%`);
      
      console.log('\n🏷️ Roles:');
      statsData.data.roles.forEach(role => {
        console.log(`  - ${role.name}: ${role.count} users`);
      });
      
      console.log('\n📋 Statuses:');
      statsData.data.statuses.forEach(status => {
        console.log(`  - ${status.name}: ${status.count} users`);
      });
    } else {
      console.log('❌ Dashboard Stats API Test Failed!');
      console.log('Error:', statsData.error);
    }
    
    // Test the recent activity endpoint
    console.log('\n📋 Testing Recent Activity API...');
    const activityResponse = await fetch('http://localhost:3000/api/admin/recent-activity', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const activityData = await activityResponse.json();
    
    console.log('📋 Activity Response Status:', activityResponse.status);
    if (activityResponse.ok && activityData.success) {
      console.log('✅ Recent Activity API Test Passed!');
      console.log(`📈 Total Activities: ${activityData.data.totalCount}`);
      
      if (activityData.data.activities.length > 0) {
        console.log('\n🕒 Recent Activities:');
        activityData.data.activities.forEach((activity, index) => {
          console.log(`  ${index + 1}. ${activity.type}: ${activity.description}`);
          console.log(`     User: ${activity.user.name}`);
          console.log(`     Time: ${new Date(activity.timestamp).toLocaleString()}`);
        });
      } else {
        console.log('📭 No recent activities found');
      }
    } else {
      console.log('❌ Recent Activity API Test Failed!');
      console.log('Error:', activityData.error);
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testAdminDashboard();













