# OALASS Testing & Monitoring Guide

## 🧪 **Testing Framework Setup Complete!**

Your OALASS system now has a comprehensive testing and monitoring setup.

## 📋 **Available Testing Commands**

### **Unit & Integration Tests**
```bash
npm run test              # Run all unit tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage report
```

### **End-to-End Tests**
```bash
npm run test:e2e          # Run Playwright E2E tests
npm run test:e2e:ui       # Run E2E tests with UI
```

### **Load Testing**
```bash
npm run test:load         # Run health check load test
npm run test:load:api     # Run API endpoints load test
```

### **All Tests**
```bash
npm run test:all          # Run unit + E2E tests
```

## 🔧 **Testing Framework Components**

### **1. Jest (Unit Testing)**
- **Location:** `tests/unit/`
- **Config:** `jest.config.js`
- **Setup:** `jest.setup.js`
- **Coverage:** 70% threshold for all metrics

### **2. Playwright (E2E Testing)**
- **Location:** `tests/e2e/`
- **Config:** `playwright.config.ts`
- **Browsers:** Chrome, Firefox, Safari
- **Features:** Parallel execution, retry logic, trace collection

### **3. K6 (Load Testing)**
- **Location:** `tests/load/`
- **Health Check Test:** `health-check.js`
- **API Load Test:** `api-endpoints.js`
- **Thresholds:** 95% requests < 500ms, <10% error rate

## 📊 **Monitoring & Performance**

### **Performance Monitoring**
- **Class:** `PerformanceMonitor` in `src/lib/monitoring.ts`
- **Features:** Timer tracking, metrics collection, performance analysis
- **API Endpoint:** `/api/monitoring/metrics`

### **Error Tracking**
- **Class:** `ErrorTracker` in `src/lib/monitoring.ts`
- **Features:** Error logging, context tracking, error history
- **Access:** Admin-only via `/api/monitoring/metrics`

### **Health Checks**
- **Endpoint:** `/api/health`
- **Tests:** Database connectivity, Prisma status
- **Response:** JSON with system status

## 🚀 **Getting Started**

### **1. Run Your First Test**
```bash
npm run test
```

### **2. Check Test Coverage**
```bash
npm run test:coverage
```

### **3. Run Load Tests**
```bash
# Start your server first
npm run dev

# In another terminal
npm run test:load
```

### **4. Monitor Performance**
```bash
# Access monitoring data (Admin only)
curl http://localhost:3000/api/monitoring/metrics
```

## 📈 **Performance Thresholds**

### **Load Testing Targets**
- **Response Time:** 95% of requests < 500ms
- **Error Rate:** < 10% for health checks, < 5% for API endpoints
- **Concurrent Users:** 20 users for health checks, 15 for API tests

### **Coverage Requirements**
- **Branches:** 70%
- **Functions:** 70%
- **Lines:** 70%
- **Statements:** 70%

## 🔍 **Monitoring Dashboard**

Access monitoring data at `/api/monitoring/metrics` (Admin only):
- Performance metrics (avg, min, max response times)
- Error tracking (last 50 errors)
- System health status

## 📝 **Writing Tests**

### **Unit Test Example**
```typescript
// tests/unit/components/Button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

### **E2E Test Example**
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('should display login page', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/.*login.*/)
})
```

### **Load Test Example**
```javascript
// tests/load/health-check.js
import http from 'k6/http'
import { check } from 'k6'

export default function () {
  let response = http.get('http://localhost:3000/api/health')
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
}
```

## 🎯 **Next Steps**

1. **Add More Unit Tests:** Cover critical business logic
2. **Expand E2E Tests:** Test complete user workflows
3. **Set Up CI/CD:** Automate testing in deployment pipeline
4. **Add Alerting:** Set up notifications for performance issues
5. **Database Testing:** Add database integration tests

## 📚 **Resources**

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [K6 Documentation](https://k6.io/docs/)
- [Testing Library](https://testing-library.com/docs/)

---

**Status:** ✅ **Testing Framework Complete**
**Coverage:** Unit, E2E, Load Testing
**Monitoring:** Performance & Error Tracking
**Next:** Add more test cases and set up CI/CD
