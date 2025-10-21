import http from 'k6/http'
import { check, sleep } from 'k6'

export let options = {
  stages: [
    { duration: '30s', target: 5 },  // Ramp up
    { duration: '2m', target: 15 }, // Stay at 15 users
    { duration: '30s', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests must complete below 1s
    http_req_failed: ['rate<0.05'],    // Error rate must be below 5%
  },
}

export default function () {
  // Test various API endpoints
  const endpoints = [
    '/api/health',
    '/api/auth/session',
    '/api/finance/reports/reference-data',
    '/api/dean/reports',
  ]
  
  endpoints.forEach(endpoint => {
    let response = http.get(`http://localhost:3000${endpoint}`)
    
    check(response, {
      [`${endpoint} status is 200 or 401`]: (r) => r.status === 200 || r.status === 401,
      [`${endpoint} response time < 1s`]: (r) => r.timings.duration < 1000,
    })
    
    sleep(0.5)
  })
}
