#!/usr/bin/env node

/**
 * Comprehensive QA Test Script for Soleva Platform
 * Tests all critical functionality including guest mode, admin panel, and API endpoints
 */

const http = require('http');
const https = require('https');

const tests = [];
let passed = 0;
let failed = 0;

function addTest(name, testFn) {
  tests.push({ name, testFn });
}

function runTest(test) {
  return new Promise((resolve) => {
    console.log(`🧪 Testing: ${test.name}`);
    try {
      const result = test.testFn();
      if (result instanceof Promise) {
        result.then(() => {
          console.log(`✅ PASSED: ${test.name}`);
          passed++;
          resolve();
        }).catch((error) => {
          console.log(`❌ FAILED: ${test.name} - ${error.message}`);
          failed++;
          resolve();
        });
      } else {
        console.log(`✅ PASSED: ${test.name}`);
        passed++;
        resolve();
      }
    } catch (error) {
      console.log(`❌ FAILED: ${test.name} - ${error.message}`);
      failed++;
      resolve();
    }
  });
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Test 1: Frontend Accessibility
addTest('Frontend is accessible', async () => {
  const response = await makeRequest('http://localhost:5173');
  if (response.status !== 200) {
    throw new Error(`Frontend returned status ${response.status}`);
  }
});

// Test 2: Backend Health Check
addTest('Backend health check', async () => {
  const response = await makeRequest('http://localhost:3001/health');
  if (response.status !== 200) {
    throw new Error(`Backend health check failed with status ${response.status}`);
  }
  if (!response.data.status || response.data.status !== 'healthy') {
    throw new Error('Backend is not healthy');
  }
});

// Test 3: Admin Panel Accessibility
addTest('Admin panel is accessible', async () => {
  const response = await makeRequest('http://localhost:3002');
  if (response.status !== 200) {
    throw new Error(`Admin panel returned status ${response.status}`);
  }
});

// Test 4: Products API (Guest Access)
addTest('Products API accessible to guests', async () => {
  const response = await makeRequest('http://localhost:3001/api/v1/products');
  if (response.status !== 200) {
    throw new Error(`Products API returned status ${response.status}`);
  }
  if (!response.data.success) {
    throw new Error('Products API returned unsuccessful response');
  }
});

// Test 5: Admin Dashboard API
addTest('Admin dashboard API', async () => {
  const response = await makeRequest('http://localhost:3001/api/v1/admin/dashboard/stats');
  if (response.status !== 200) {
    throw new Error(`Admin dashboard API returned status ${response.status}`);
  }
  if (!response.data.success) {
    throw new Error('Admin dashboard API returned unsuccessful response');
  }
});

// Test 6: CORS Headers
addTest('CORS headers present', async () => {
  const response = await makeRequest('http://localhost:3001/api/v1/products', {
    headers: { 'Origin': 'http://localhost:5173' }
  });
  if (!response.headers['access-control-allow-origin']) {
    throw new Error('CORS headers not present');
  }
});

// Test 7: Security Headers
addTest('Security headers present', async () => {
  const response = await makeRequest('http://localhost:3001/health');
  const requiredHeaders = [
    'x-content-type-options',
    'x-frame-options',
    'strict-transport-security'
  ];
  
  for (const header of requiredHeaders) {
    if (!response.headers[header]) {
      throw new Error(`Missing security header: ${header}`);
    }
  }
});

// Test 8: Database Connection
addTest('Database connection', async () => {
  const response = await makeRequest('http://localhost:3001/health');
  if (response.data.services.database !== 'connected') {
    throw new Error('Database not connected');
  }
});

// Test 9: Redis Connection
addTest('Redis connection', async () => {
  const response = await makeRequest('http://localhost:3001/health');
  if (response.data.services.redis !== 'ready') {
    throw new Error('Redis not ready');
  }
});

// Test 10: Frontend Build
addTest('Frontend build successful', () => {
  const fs = require('fs');
  const path = require('path');
  const distPath = path.join(__dirname, 'dist', 'index.html');
  if (!fs.existsSync(distPath)) {
    throw new Error('Frontend build not found');
  }
});

// Test 11: Admin Panel Build
addTest('Admin panel build successful', () => {
  const fs = require('fs');
  const path = require('path');
  const distPath = path.join(__dirname, 'admin', 'dist', 'index.html');
  if (!fs.existsSync(distPath)) {
    throw new Error('Admin panel build not found');
  }
});

// Test 12: SSL Configuration
addTest('SSL configuration present', () => {
  const fs = require('fs');
  const path = require('path');
  const sslConfigPath = path.join(__dirname, 'docker', 'nginx', 'solevaeg-ssl.conf');
  if (!fs.existsSync(sslConfigPath)) {
    throw new Error('SSL configuration not found');
  }
  
  const sslConfig = fs.readFileSync(sslConfigPath, 'utf8');
  if (!sslConfig.includes('ssl_certificate') || !sslConfig.includes('HSTS')) {
    throw new Error('SSL configuration incomplete');
  }
});

// Test 13: Guest Mode Functionality
addTest('Guest mode functionality', () => {
  const fs = require('fs');
  const path = require('path');
  
  // Check CartSummary.tsx - should not require auth for checkout
  const cartSummaryPath = path.join(__dirname, 'src', 'pages', 'cart', 'CartSummary.tsx');
  const cartSummaryContent = fs.readFileSync(cartSummaryPath, 'utf8');
  if (cartSummaryContent.includes('requireAuth(handleCheckout')) {
    throw new Error('CartSummary still requires authentication for checkout');
  }
  
  // Check FavoriteButton.tsx - should not require auth
  const favoriteButtonPath = path.join(__dirname, 'src', 'components', 'FavoriteButton.tsx');
  const favoriteButtonContent = fs.readFileSync(favoriteButtonPath, 'utf8');
  if (favoriteButtonContent.includes('requireAuth(handleToggleFavorite')) {
    throw new Error('FavoriteButton still requires authentication');
  }
  
  // Check ProductPage.tsx - should not require auth for add to cart
  const productPagePath = path.join(__dirname, 'src', 'pages', 'ProductPage.tsx');
  const productPageContent = fs.readFileSync(productPagePath, 'utf8');
  if (productPageContent.includes('requireAuth(handleAddToCart')) {
    throw new Error('ProductPage still requires authentication for add to cart');
  }
});

async function runAllTests() {
  console.log('🚀 Starting Comprehensive QA Tests for Soleva Platform\n');
  
  for (const test of tests) {
    await runTest(test);
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! The Soleva platform is ready for production.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.');
    process.exit(1);
  }
}

runAllTests().catch(console.error);
