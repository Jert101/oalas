// Load Testing for Deployment
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.1'], // Error rate must be below 10%
  },
};

const BASE_URL = 'http://localhost:3000';

export default function() {
  // Test health check endpoint
  let healthResponse = http.get(`${BASE_URL}/api/health`);
  check(healthResponse, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 1s': (r) => r.timings.duration < 1000,
    'health check contains status': (r) => r.body.includes('status'),
    'health check contains uptime': (r) => r.body.includes('uptime'),
  });

  // Test main application endpoint
  let appResponse = http.get(`${BASE_URL}/`);
  check(appResponse, {
    'main page status is 200': (r) => r.status === 200,
    'main page response time < 2s': (r) => r.timings.duration < 2000,
  });

  // Test API endpoints
  let apiResponse = http.get(`${BASE_URL}/api/leave-types`);
  check(apiResponse, {
    'API endpoint accessible': (r) => r.status === 200 || r.status === 401, // 401 is expected without auth
    'API response time < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
  };
}
