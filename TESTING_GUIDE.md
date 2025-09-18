# 🧪 Soleva Admin Panel - Comprehensive Testing Guide

## 📋 Testing Overview

This guide provides comprehensive testing procedures for the Soleva Admin Panel, covering unit tests, integration tests, end-to-end tests, and performance tests.

## 🔧 Test Environment Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL database
- Redis (for caching and sessions)
- Test data fixtures

### Environment Configuration
```bash
# Test environment variables
NODE_ENV=test
DATABASE_URL=postgresql://user:password@localhost:5432/soleva_test
REDIS_URL=redis://localhost:6379/1
JWT_SECRET=test-jwt-secret
```

## 🧪 Unit Tests

### Backend API Tests

#### Authentication Tests
```javascript
// tests/backend/auth.test.js
describe('Authentication', () => {
  test('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@soleva.com',
        password: 'password123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });

  test('should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@soleva.com',
        password: 'wrongpassword'
      });
    
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test('should require authentication for protected routes', async () => {
    const response = await request(app)
      .get('/api/admin/dashboard/stats');
    
    expect(response.status).toBe(401);
  });
});
```

#### Product Management Tests
```javascript
// tests/backend/products.test.js
describe('Product Management', () => {
  let authToken;

  beforeEach(async () => {
    // Login and get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@soleva.com', password: 'password123' });
    authToken = loginResponse.body.data.token;
  });

  test('should create a new product', async () => {
    const productData = {
      name: { en: 'Test Product', ar: 'منتج تجريبي' },
      description: { en: 'Test description', ar: 'وصف تجريبي' },
      basePrice: 99.99,
      categoryId: 'category-1',
      brandId: 'brand-1'
    };

    const response = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send(productData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name.en).toBe('Test Product');
  });

  test('should update product', async () => {
    const updateData = {
      name: { en: 'Updated Product', ar: 'منتج محدث' },
      basePrice: 149.99
    };

    const response = await request(app)
      .put('/api/admin/products/product-1')
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.data.name.en).toBe('Updated Product');
  });

  test('should delete product', async () => {
    const response = await request(app)
      .delete('/api/admin/products/product-1')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

#### Order Management Tests
```javascript
// tests/backend/orders.test.js
describe('Order Management', () => {
  test('should fetch orders with pagination', async () => {
    const response = await request(app)
      .get('/api/admin/orders?page=1&limit=10')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.orders).toHaveLength(10);
    expect(response.body.data.pagination.page).toBe(1);
  });

  test('should update order status', async () => {
    const response = await request(app)
      .put('/api/admin/orders/order-1/status')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'CONFIRMED' });

    expect(response.status).toBe(200);
    expect(response.body.data.orderStatus).toBe('CONFIRMED');
  });
});
```

### Frontend Component Tests

#### Dashboard Component Tests
```javascript
// tests/frontend/Dashboard.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../src/pages/Dashboard';

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Mock API responses
    global.fetch = jest.fn();
  });

  test('should render dashboard with KPIs', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          totalOrders: 150,
          totalRevenue: 25000,
          totalCustomers: 500,
          lowStockItems: 5
        }
      })
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('$25,000')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
    });
  });

  test('should display loading state', () => {
    global.fetch.mockImplementation(() => new Promise(() => {}));

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

#### Product Management Tests
```javascript
// tests/frontend/Products.test.jsx
describe('Product Management', () => {
  test('should render product list', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          products: [
            {
              id: '1',
              name: { en: 'Test Product' },
              basePrice: 99.99,
              stockQuantity: 10
            }
          ],
          pagination: { total: 1, page: 1, limit: 10 }
        }
      })
    });

    render(
      <BrowserRouter>
        <Products />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
    });
  });

  test('should open add product modal', async () => {
    render(
      <BrowserRouter>
        <Products />
      </BrowserRouter>
    );

    const addButton = screen.getByText('Add Product');
    fireEvent.click(addButton);

    expect(screen.getByText('Add New Product')).toBeInTheDocument();
  });
});
```

## 🔗 Integration Tests

### API Integration Tests
```javascript
// tests/integration/api.test.js
describe('API Integration', () => {
  test('should handle complete product workflow', async () => {
    // 1. Create product
    const createResponse = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: { en: 'Integration Test Product' },
        basePrice: 199.99,
        categoryId: 'category-1'
      });

    expect(createResponse.status).toBe(201);
    const productId = createResponse.body.data.id;

    // 2. Update product
    const updateResponse = await request(app)
      .put(`/api/admin/products/${productId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ basePrice: 249.99 });

    expect(updateResponse.status).toBe(200);

    // 3. Verify update in database
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    expect(product.basePrice).toBe(249.99);

    // 4. Delete product
    const deleteResponse = await request(app)
      .delete(`/api/admin/products/${productId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(deleteResponse.status).toBe(200);
  });
});
```

### Database Integration Tests
```javascript
// tests/integration/database.test.js
describe('Database Integration', () => {
  test('should handle order creation with inventory update', async () => {
    const orderData = {
      userId: 'user-1',
      items: [
        {
          productId: 'product-1',
          quantity: 2,
          unitPrice: 99.99
        }
      ],
      totalAmount: 199.98
    };

    // Create order
    const order = await prisma.order.create({
      data: {
        ...orderData,
        orderNumber: 'ORD-001',
        subtotal: 199.98,
        addressId: 'address-1'
      }
    });

    // Verify inventory is updated
    const product = await prisma.product.findUnique({
      where: { id: 'product-1' }
    });

    expect(product.stockQuantity).toBe(8); // Assuming initial stock was 10
  });
});
```

## 🎯 End-to-End Tests

### User Authentication Flow
```javascript
// tests/e2e/auth.spec.js
describe('Authentication Flow', () => {
  test('should complete login and access dashboard', async () => {
    await page.goto('http://localhost:3000/login');
    
    // Fill login form
    await page.fill('[data-testid="email-input"]', 'admin@soleva.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Verify dashboard elements
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-orders"]')).toBeVisible();
  });
});
```

### Product Management Flow
```javascript
// tests/e2e/products.spec.js
describe('Product Management Flow', () => {
  test('should create, edit, and delete product', async () => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="email-input"]', 'admin@soleva.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to products
    await page.click('[data-testid="products-menu"]');
    await page.waitForURL('http://localhost:3000/products');
    
    // Create new product
    await page.click('[data-testid="add-product-button"]');
    await page.fill('[data-testid="product-name-en"]', 'E2E Test Product');
    await page.fill('[data-testid="product-price"]', '199.99');
    await page.selectOption('[data-testid="category-select"]', 'category-1');
    await page.click('[data-testid="save-product-button"]');
    
    // Verify product was created
    await expect(page.locator('text=E2E Test Product')).toBeVisible();
    
    // Edit product
    await page.click('[data-testid="edit-product-button"]');
    await page.fill('[data-testid="product-name-en"]', 'Updated E2E Product');
    await page.click('[data-testid="save-product-button"]');
    
    // Verify product was updated
    await expect(page.locator('text=Updated E2E Product')).toBeVisible();
    
    // Delete product
    await page.click('[data-testid="delete-product-button"]');
    await page.click('[data-testid="confirm-delete"]');
    
    // Verify product was deleted
    await expect(page.locator('text=Updated E2E Product')).not.toBeVisible();
  });
});
```

### Order Management Flow
```javascript
// tests/e2e/orders.spec.js
describe('Order Management Flow', () => {
  test('should view and update order status', async () => {
    // Login and navigate to orders
    await page.goto('http://localhost:3000/orders');
    
    // View order details
    await page.click('[data-testid="view-order-button"]');
    await expect(page.locator('[data-testid="order-details"]')).toBeVisible();
    
    // Update order status
    await page.selectOption('[data-testid="status-select"]', 'CONFIRMED');
    await page.click('[data-testid="update-status-button"]');
    
    // Verify status was updated
    await expect(page.locator('text=CONFIRMED')).toBeVisible();
  });
});
```

## ⚡ Performance Tests

### Load Testing
```javascript
// tests/performance/load.test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
};

export default function() {
  // Test dashboard endpoint
  let response = http.get('http://localhost:3001/api/admin/dashboard/stats', {
    headers: { 'Authorization': 'Bearer ' + __ENV.AUTH_TOKEN }
  });
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  sleep(1);
}
```

### Database Performance Tests
```javascript
// tests/performance/database.test.js
describe('Database Performance', () => {
  test('should handle concurrent product queries', async () => {
    const promises = Array(100).fill().map(async () => {
      return await prisma.product.findMany({
        include: {
          category: true,
          brand: true,
          variants: true
        }
      });
    });
    
    const startTime = Date.now();
    await Promise.all(promises);
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
  });
});
```

## 🔒 Security Tests

### Authentication Security Tests
```javascript
// tests/security/auth.test.js
describe('Authentication Security', () => {
  test('should prevent brute force attacks', async () => {
    const promises = Array(10).fill().map(async () => {
      return await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@soleva.com',
          password: 'wrongpassword'
        });
    });
    
    const responses = await Promise.all(promises);
    
    // Should eventually return 429 (Too Many Requests)
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  test('should validate JWT tokens', async () => {
    const response = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', 'Bearer invalid-token');
    
    expect(response.status).toBe(401);
  });
});
```

### Input Validation Tests
```javascript
// tests/security/validation.test.js
describe('Input Validation', () => {
  test('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE products; --";
    
    const response = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: { en: maliciousInput },
        basePrice: 99.99
      });
    
    // Should not crash the application
    expect(response.status).not.toBe(500);
    
    // Verify products table still exists
    const products = await prisma.product.findMany();
    expect(Array.isArray(products)).toBe(true);
  });

  test('should prevent XSS attacks', async () => {
    const xssPayload = '<script>alert("XSS")</script>';
    
    const response = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: { en: xssPayload },
        basePrice: 99.99
      });
    
    // Should sanitize the input
    expect(response.body.data.name.en).not.toContain('<script>');
  });
});
```

## 📊 Test Coverage

### Coverage Targets
- **Backend API**: > 90% code coverage
- **Frontend Components**: > 85% code coverage
- **Database Operations**: > 95% code coverage
- **Authentication**: 100% code coverage

### Coverage Reports
```bash
# Generate coverage reports
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

## 🚀 Test Automation

### CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run unit tests
        run: npm run test:unit
        
      - name: Run integration tests
        run: npm run test:integration
        
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Generate coverage report
        run: npm run test:coverage
        
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v1
```

## 📝 Test Data Management

### Test Fixtures
```javascript
// tests/fixtures/products.js
export const testProducts = [
  {
    id: 'product-1',
    name: { en: 'Test Product 1', ar: 'منتج تجريبي 1' },
    basePrice: 99.99,
    categoryId: 'category-1',
    brandId: 'brand-1'
  },
  {
    id: 'product-2',
    name: { en: 'Test Product 2', ar: 'منتج تجريبي 2' },
    basePrice: 149.99,
    categoryId: 'category-2',
    brandId: 'brand-2'
  }
];

// tests/fixtures/users.js
export const testUsers = [
  {
    id: 'user-1',
    email: 'admin@soleva.com',
    password: 'password123',
    role: 'ADMIN'
  },
  {
    id: 'user-2',
    email: 'manager@soleva.com',
    password: 'password123',
    role: 'MANAGER'
  }
];
```

### Database Seeding
```javascript
// tests/setup/seed.js
import { PrismaClient } from '@prisma/client';
import { testProducts, testUsers } from '../fixtures';

const prisma = new PrismaClient();

export async function seedTestData() {
  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  
  // Seed test data
  await prisma.user.createMany({ data: testUsers });
  await prisma.category.createMany({ data: testCategories });
  await prisma.product.createMany({ data: testProducts });
}

export async function cleanupTestData() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}
```

## 🎯 Test Execution

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:performance

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests in parallel
npm run test:parallel
```

### Test Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "playwright test",
    "test:performance": "k6 run tests/performance/load.test.js",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:parallel": "jest --maxWorkers=4"
  }
}
```

---

## 📋 Testing Checklist

- [ ] **Unit Tests**: All components and functions tested
- [ ] **Integration Tests**: API and database integration tested
- [ ] **E2E Tests**: Complete user workflows tested
- [ ] **Performance Tests**: Load and stress testing completed
- [ ] **Security Tests**: Authentication and input validation tested
- [ ] **Coverage Reports**: Code coverage targets met
- [ ] **CI/CD Integration**: Automated testing in pipeline
- [ ] **Test Data Management**: Fixtures and seeding implemented
- [ ] **Documentation**: Test procedures documented
- [ ] **Maintenance**: Tests updated with new features

---

*This comprehensive testing guide ensures the Soleva Admin Panel is thoroughly tested and ready for production deployment.*
