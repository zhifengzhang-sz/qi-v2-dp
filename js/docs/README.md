# Qi Platform Documentation

Welcome to the Qi Platform documentation. This guide covers development, testing, and documentation processes across all platform modules.

## Project Structure

```
qi/
├── core/               # Core shared functionality
│   ├── src/           # Source code
│   ├── tests/         # Tests
│   ├── docs/          # Module documentation
│   └── package.json
├── api/               # REST API service
│   ├── src/
│   ├── tests/
│   ├── docs/
│   └── package.json
├── producer/          # Data producer service
│   ├── src/
│   ├── tests/
│   ├── docs/
│   └── package.json
├── consumer/          # Data consumer service
│   ├── src/
│   ├── tests/
│   ├── docs/
│   └── package.json
├── docs/              # Platform documentation
└── package.json       # Root package.json
```

## Development Setup

1. **Clone Repository**
```bash
git clone https://github.com/yourusername/qi.git
cd qi
```

2. **Install Dependencies**
```bash
# Install root dependencies
npm install

# Install module dependencies
npm run bootstrap
```

3. **Environment Setup**

Create environment files:
```bash
# Development
cp .env.example .env

# Testing
cp .env.example .env.test
```

4. **Database Setup**
```bash
# Development database
createdb qi_dev

# Test database
createdb qi_test
```

## Documentation System

### API Documentation

Generate API documentation:
```bash
# Generate core documentation
cd core && npm run docs:build

# Generate API service documentation
cd api && npm run docs:build

# Serve documentation locally
npm run docs:serve
```

Access documentation:
- Development: http://localhost:3000
- Production: https://docs.qi-platform.com

### Code Documentation

Each module follows JSDoc standards:

```typescript
/**
 * @module db/models/market
 * @description Market model for cryptocurrency exchanges
 */

/**
 * @class Market
 * @extends Model
 * @description Sequelize model for markets
 * 
 * @example
 * const market = await Market.create({
 *   name: 'Binance',
 *   isActive: true
 * });
 */
```

### Module Documentation

Each module should include:
1. README.md
2. API documentation
3. Setup instructions
4. Testing guide

## Testing Infrastructure

### Module Testing

Each module has its own test suite:

```bash
# Run core tests
cd core && npm test

# Run API tests
cd api && npm test

# Run producer tests
cd producer && npm test

# Run consumer tests
cd consumer && npm test
```

### Test Types

#### 1. Unit Tests

Location: `<module>/tests/unit/`

Example unit test:
```typescript
// core/tests/unit/utils.test.ts
describe('utils/hash', () => {
  it('should generate consistent hashes', () => {
    const input = 'test';
    expect(hash(input)).toBe(hash(input));
  });
});
```

#### 2. Integration Tests

Location: `<module>/tests/integration/`

Example integration test:
```typescript
// core/tests/integration/database.test.ts
describe('Market Model', () => {
  it('should enforce unique names', async () => {
    await Market.create({ name: 'Test' });
    await expect(
      Market.create({ name: 'Test' })
    ).rejects.toThrow();
  });
});
```

#### 3. End-to-End Tests

Location: `e2e/`

Example E2E test:
```typescript
// e2e/tests/market-data.test.ts
describe('Market Data Flow', () => {
  it('should process market updates', async () => {
    // Producer publishes update
    await producer.publish({
      market: 'Binance',
      symbol: 'BTC-USD',
      price: 50000
    });

    // Consumer processes update
    await waitForProcessing();

    // Verify database
    const trade = await Trade.findLatest();
    expect(trade.price).toBe(50000);
  });
});
```

### Test Configuration

Each module has its own Jest configuration:

```javascript
// <module>/jest.config.js
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/jest.setup.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Test Environment

Each module needs its own `.env.test`:

```env
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qi_test
DB_USER=postgres
DB_PASSWORD=postgres
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Module Dependencies

### Core Module

The core module provides shared functionality:

```typescript
// Other modules import from core
import { Market } from '@qi/core/db/models';
import { logger } from '@qi/core/utils';
```

### API Module

REST API service:

```typescript
// Uses core functionality
import { Market } from '@qi/core/db/models';

// Implements REST endpoints
app.get('/markets', async (req, res) => {
  const markets = await Market.findAll();
  res.json(markets);
});
```

### Producer Module

Data collection service:

```typescript
// Uses core models
import { Instrument } from '@qi/core/db/models';

// Implements data collection
export class BinanceCollector {
  async collectTrades(instrument: Instrument) {
    // Collection logic
  }
}
```

### Consumer Module

Data processing service:

```typescript
// Uses core models
import { Trade } from '@qi/core/db/models';

// Implements data processing
export class TradeProcessor {
  async processTrade(data: TradeData) {
    // Processing logic
  }
}
```

## Documentation Workflow

1. **Local Development**
```bash
# Watch documentation changes
npm run docs:watch

# Serve documentation
npm run docs:serve
```

2. **Review Process**
- Update documentation files
- Generate documentation
- Review locally
- Submit pull request

3. **Continuous Integration**
- Documentation is built
- Links are verified
- Coverage is checked

4. **Deployment**
- Merged changes trigger build
- Documentation is deployed
- Version is tagged

## Test Workflow

1. **Local Development**
```bash
# Run tests in watch mode
npm run test:watch

# Check coverage
npm test -- --coverage
```

2. **Pre-commit**
- Linting runs
- Tests run
- Coverage checked

3. **Continuous Integration**
- All module tests run
- Integration tests run
- E2E tests run

4. **Deployment Gates**
- All tests must pass
- Coverage must meet thresholds
- No security vulnerabilities

## Contributing

1. **Documentation**
- Follow JSDoc standards
- Update README files
- Add examples
- Include tests

2. **Testing**
- Write unit tests
- Add integration tests
- Update E2E tests
- Verify coverage

3. **Code Review**
- Documentation complete
- Tests added
- Coverage maintained
- Standards followed

## Further Reading

- [Core Module Documentation](core/README.md)
- [API Service Documentation](api/README.md)
- [Producer Documentation](producer/README.md)
- [Consumer Documentation](consumer/README.md)
- [Testing Guide](docs/testing.md)
- [Contributing Guide](docs/contributing.md)