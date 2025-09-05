# ClimaHealth AI Backend - Testing Guide

## Table of Contents
1. [Testing Strategy](#testing-strategy)
2. [Setup Testing Environment](#setup-testing-environment)
3. [Unit Tests](#unit-tests)
4. [Integration Tests](#integration-tests)
5. [API Testing](#api-testing)
6. [Performance Testing](#performance-testing)
7. [Security Testing](#security-testing)

## Testing Strategy

### Testing Pyramid
```
    /\
   /  \     E2E Tests (Few)
  /____\    
 /      \   Integration Tests (Some)
/__________\ Unit Tests (Many)
```

### Test Types
- **Unit Tests**: Test individual functions and modules
- **Integration Tests**: Test component interactions
- **API Tests**: Test HTTP endpoints and responses
- **Performance Tests**: Test system under load
- **Security Tests**: Test authentication and authorization

## Setup Testing Environment

### 1. Install Testing Dependencies

```bash
npm install --save-dev jest supertest mongodb-memory-server
```

### 2. Jest Configuration

Create `jest.config.js`:
```javascript
export default {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/**',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
```

### 3. Test Setup File

Create `tests/setup.js`:
```javascript
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Mock external APIs
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: {} }))
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
```

### 4. Package.json Scripts

Add to `package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:api": "jest --testPathPattern=api"
  }
}
```

## Unit Tests

### 1. Testing Utilities

Create `tests/unit/utils/validation.test.js`:
```javascript
import { validate, signupSchema, symptomLogSchema } from '../../../src/utils/validation.js';

describe('Validation Utils', () => {
  describe('signupSchema', () => {
    test('should validate correct signup data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        location: {
          city: 'New York',
          country: 'US',
          lat: 40.7128,
          lon: -74.0060
        }
      };

      const { error } = signupSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject invalid email', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'SecurePass123!'
      };

      const { error } = signupSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('valid email');
    });

    test('should reject weak password', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'weak'
      };

      const { error } = signupSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Password must contain');
    });
  });

  describe('symptomLogSchema', () => {
    test('should validate correct symptom data', () => {
      const validData = {
        symptoms: {
          wheezing: 5,
          cough: 3,
          attack: false
        },
        notes: 'Feeling better today'
      };

      const { error } = symptomLogSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject out-of-range symptom levels', () => {
      const invalidData = {
        symptoms: {
          wheezing: 15,
          cough: 3,
          attack: false
        }
      };

      const { error } = symptomLogSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('between 0 and 10');
    });
  });
});
```

### 2. Testing Models

Create `tests/unit/models/User.test.js`:
```javascript
import User from '../../../src/models/User.js';

describe('User Model', () => {
  test('should create user with valid data', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashedpassword123'
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe(userData.name);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.role).toBe('patient'); // default value
  });

  test('should not save user without required fields', async () => {
    const user = new User({});
    
    await expect(user.save()).rejects.toThrow();
  });

  test('should not save user with duplicate email', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashedpassword123'
    };

    await User.create(userData);
    
    const duplicateUser = new User(userData);
    await expect(duplicateUser.save()).rejects.toThrow();
  });

  test('should validate email format', async () => {
    const userData = {
      name: 'John Doe',
      email: 'invalid-email',
      passwordHash: 'hashedpassword123'
    };

    const user = new User(userData);
    await expect(user.save()).rejects.toThrow();
  });

  test('should calculate isLocked virtual correctly', () => {
    const user = new User({
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashedpassword123',
      lockUntil: new Date(Date.now() + 3600000) // 1 hour from now
    });

    expect(user.isLocked).toBe(true);

    user.lockUntil = new Date(Date.now() - 3600000); // 1 hour ago
    expect(user.isLocked).toBe(false);
  });
});
```

### 3. Testing Services

Create `tests/unit/services/climate.service.test.js`:
```javascript
import axios from 'axios';
import { fetchCurrentConditions } from '../../../src/services/climate.service.js';
import ClimateData from '../../../src/models/ClimateData.js';

jest.mock('axios');
const mockedAxios = axios;

describe('Climate Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch and save climate data', async () => {
    const mockWeatherData = {
      data: {
        main: { temp: 25, humidity: 60 },
        weather: [{ main: 'Clear' }]
      }
    };

    const mockAqiData = {
      data: {
        data: { aqi: 50 }
      }
    };

    mockedAxios.get
      .mockResolvedValueOnce(mockWeatherData)
      .mockResolvedValueOnce(mockAqiData);

    const result = await fetchCurrentConditions({
      lat: 40.7128,
      lon: -74.0060,
      city: 'New York',
      country: 'US'
    });

    expect(result).toBeDefined();
    expect(result.temperature).toBe(25);
    expect(result.humidity).toBe(60);
    expect(result.AQI).toBe(50);
    expect(result.riskLevel).toBeDefined();
  });

  test('should handle API failures gracefully', async () => {
    mockedAxios.get.mockRejectedValue(new Error('API Error'));

    const result = await fetchCurrentConditions({
      lat: 40.7128,
      lon: -74.0060,
      city: 'New York',
      country: 'US'
    });

    expect(result).toBeDefined();
    expect(result.temperature).toBeNull();
    expect(result.AQI).toBeNull();
  });
});
```

## Integration Tests

### 1. Database Integration

Create `tests/integration/database.test.js`:
```javascript
import mongoose from 'mongoose';
import User from '../../src/models/User.js';
import SymptomLog from '../../src/models/SymptomLog.js';

describe('Database Integration', () => {
  test('should create user and symptom log relationship', async () => {
    // Create user
    const user = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashedpassword123'
    });

    // Create symptom log
    const symptomLog = await SymptomLog.create({
      userId: user._id,
      symptoms: {
        wheezing: 5,
        cough: 3,
        attack: false
      },
      notes: 'Test log'
    });

    // Populate user reference
    await symptomLog.populate('userId');

    expect(symptomLog.userId.name).toBe('John Doe');
    expect(symptomLog.userId.email).toBe('john@example.com');
  });

  test('should auto-calculate symptom severity', async () => {
    const user = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashedpassword123'
    });

    const severeLog = await SymptomLog.create({
      userId: user._id,
      symptoms: {
        wheezing: 9,
        cough: 8,
        attack: true
      }
    });

    expect(severeLog.severity).toBe('severe');
    expect(severeLog.followUpRequired).toBe(true);

    const mildLog = await SymptomLog.create({
      userId: user._id,
      symptoms: {
        wheezing: 2,
        cough: 1,
        attack: false
      }
    });

    expect(mildLog.severity).toBe('mild');
    expect(mildLog.followUpRequired).toBe(false);
  });
});
```

## API Testing

### 1. Authentication API Tests

Create `tests/api/auth.test.js`:
```javascript
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';

describe('Authentication API', () => {
  describe('POST /api/auth/signup', () => {
    test('should register new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        location: {
          city: 'New York',
          country: 'US'
        }
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    test('should reject duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!'
      };

      // Create first user
      await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already registered');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'SecurePass123!'
        });
    });

    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'SecurePass123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined();
    });

    test('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid email or password');
    });
  });
});
```

### 2. Symptom API Tests

Create `tests/api/symptoms.test.js`:
```javascript
import request from 'supertest';
import app from '../../src/app.js';

describe('Symptoms API', () => {
  let authToken;
  let userId;

  beforeEach(async () => {
    // Create and login user
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!'
      });

    authToken = signupResponse.body.data.token;
    userId = signupResponse.body.data.user.id;
  });

  describe('POST /api/symptoms/log', () => {
    test('should create symptom log successfully', async () => {
      const symptomData = {
        symptoms: {
          wheezing: 5,
          cough: 3,
          attack: false,
          triggers: ['pollen']
        },
        notes: 'Feeling okay today'
      };

      const response = await request(app)
        .post('/api/symptoms/log')
        .set('Authorization', `Bearer ${authToken}`)
        .send(symptomData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.symptoms.wheezing).toBe(5);
      expect(response.body.data.severity).toBeDefined();
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/symptoms/log')
        .send({
          symptoms: { wheezing: 5, cough: 3, attack: false }
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should validate symptom data', async () => {
      const response = await request(app)
        .post('/api/symptoms/log')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          symptoms: { wheezing: 15, cough: 3, attack: false }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/symptoms/history', () => {
    beforeEach(async () => {
      // Create some test logs
      await request(app)
        .post('/api/symptoms/log')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          symptoms: { wheezing: 5, cough: 3, attack: false }
        });

      await request(app)
        .post('/api/symptoms/log')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          symptoms: { wheezing: 8, cough: 7, attack: true }
        });
    });

    test('should get symptom history', async () => {
      const response = await request(app)
        .get('/api/symptoms/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.logs).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    test('should filter by severity', async () => {
      const response = await request(app)
        .get('/api/symptoms/history?severity=severe')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.logs).toHaveLength(1);
      expect(response.body.data.logs[0].severity).toBe('severe');
    });
  });
});
```

## Running Tests

### Execute Test Suites

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js

# Run tests in watch mode
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only API tests
npm run test:api
```

### Coverage Reports

After running `npm run test:coverage`, check:
- `coverage/lcov-report/index.html` - HTML coverage report
- `coverage/lcov.info` - LCOV format for CI/CD
- Console output for summary

### Continuous Integration

Example GitHub Actions workflow (`.github/workflows/test.yml`):
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16, 18, 20]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - run: npm ci
    - run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
```
