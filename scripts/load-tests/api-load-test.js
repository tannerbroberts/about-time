/**
 * k6 Load Test Script for About Time API
 *
 * Install k6: https://k6.io/docs/getting-started/installation/
 * Run: k6 run api-load-test.js
 *
 * Or with options:
 * k6 run --vus 50 --duration 2m api-load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'], // 95% < 200ms, 99% < 500ms
    http_req_failed: ['rate<0.01'],  // Less than 1% errors
    errors: ['rate<0.01'],
  },
};

// Configuration
const BASE_URL = __ENV.API_URL || 'http://localhost:3001';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'test123456';

let authCookie = '';

// Setup function - runs once per VU
export function setup() {
  // Register a test user
  const registerRes = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    displayName: 'Load Test User',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (registerRes.status === 200 || registerRes.status === 201) {
    // Extract session cookie
    const cookies = registerRes.cookies;
    const sessionCookie = cookies['session_id'];
    if (sessionCookie && sessionCookie[0]) {
      return {
        authCookie: `session_id=${sessionCookie[0].value}`,
      };
    }
  }

  console.error('Failed to setup test user');
  return { authCookie: '' };
}

// Main test function
export default function(data) {
  const authCookie = data.authCookie;

  if (!authCookie) {
    console.error('No auth cookie available');
    return;
  }

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authCookie,
    },
  };

  // Test 1: Health check
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/health`);

    const success = check(res, {
      'health check status is 200': (r) => r.status === 200,
      'health check has status field': (r) => JSON.parse(r.body).status === 'ok',
    });

    errorRate.add(!success);
    if (success) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }

    apiDuration.add(res.timings.duration);
  });

  sleep(1);

  // Test 2: Get user info
  group('Auth - Get Current User', () => {
    const res = http.get(`${BASE_URL}/api/auth/me`, params);

    const success = check(res, {
      'get user status is 200': (r) => r.status === 200,
      'user has email': (r) => {
        try {
          return JSON.parse(r.body).data.email !== undefined;
        } catch {
          return false;
        }
      },
    });

    errorRate.add(!success);
    if (success) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }

    apiDuration.add(res.timings.duration);
  });

  sleep(1);

  // Test 3: List templates
  group('Templates - List', () => {
    const res = http.get(`${BASE_URL}/api/templates`, params);

    const success = check(res, {
      'list templates status is 200': (r) => r.status === 200,
      'templates response has data': (r) => {
        try {
          return JSON.parse(r.body).data !== undefined;
        } catch {
          return false;
        }
      },
    });

    errorRate.add(!success);
    if (success) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }

    apiDuration.add(res.timings.duration);
  });

  sleep(1);

  // Test 4: Create template
  group('Templates - Create', () => {
    const template = {
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      templateType: 'busy',
      intent: 'Load Test Meal',
      estimatedDuration: 600000,
      nutrition: {
        calories: 400,
        proteinG: 25,
        carbsG: 30,
        fatsG: 15,
      },
    };

    const res = http.post(`${BASE_URL}/api/templates`, JSON.stringify({ template }), params);

    const success = check(res, {
      'create template status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    });

    errorRate.add(!success);
    if (success) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }

    apiDuration.add(res.timings.duration);
  });

  sleep(1);

  // Test 5: Get daily goals
  group('Schedule - Get Goals', () => {
    const res = http.get(`${BASE_URL}/api/schedule/goals`, params);

    const success = check(res, {
      'get goals status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    });

    errorRate.add(!success);
    if (success) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }

    apiDuration.add(res.timings.duration);
  });

  sleep(1);
}

// Teardown function - runs once after all VUs complete
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Test user: ${TEST_EMAIL}`);
}
