# QiCore Test Strategy

## Overview

The QiCore test suite is organized into three distinct categories, each serving different purposes and running in different environments.

## Test Categories

### 🏃‍♂️ Unit Tests (`lib/tests/unit/`)
**Purpose**: Fast, isolated tests with minimal external dependencies

**Characteristics**:
- **Speed**: < 5 seconds per test
- **Dependencies**: Mock system dependencies only, not business logic
- **Environment**: Node.js only, no external services
- **When to run**: Every commit, CI/CD pipeline

**What to test**:
- DSL interface compliance
- Configuration management
- Data type validation
- Utility functions
- Error handling logic

**Example**:
```typescript
// ✅ Good unit test
describe("CryptoPriceData validation", () => {
  it("should validate required fields", () => {
    const validator = new PriceDataValidator();
    const result = validator.validate({ coinId: "bitcoin", usdPrice: 50000 });
    expect(result.isValid).toBe(true);
  });
});
```

### 🔌 Integration Tests (`lib/tests/integration/`)
**Purpose**: Test real external service integration

**Characteristics**:
- **Speed**: 10-30 seconds per test
- **Dependencies**: Real external APIs, MCP servers, databases
- **Environment**: External services (CoinGecko, TimescaleDB, Redpanda)
- **When to run**: Push to main, staging deployment

**What to test**:
- Real CoinGecko API integration
- MCP server communication
- Database operations
- External service error handling

**Example**:
```typescript
// ✅ Good integration test
describe("CoinGecko MCP Integration", () => {
  it("should get real Bitcoin price via MCP", async () => {
    const reader = createCoinGeckoMarketDataReader({ useRemoteServer: true });
    const result = await reader.getCurrentPrice("bitcoin");
    
    if (isSuccess(result)) {
      expect(getData(result)).toBeGreaterThan(0);
    } else {
      // Allow graceful failure if external service unavailable
      console.warn("External service unavailable");
    }
  });
});
```

### 🌐 System Tests (`lib/tests/system/`)
**Purpose**: End-to-end workflow testing

**Characteristics**:
- **Speed**: 30-60 seconds per test
- **Dependencies**: Full infrastructure stack
- **Environment**: Complete deployed system
- **When to run**: Release deployment, nightly builds

**What to test**:
- Complete data pipelines
- Multi-service workflows
- Performance characteristics
- Real user scenarios

**Example**:
```typescript
// ✅ Good system test
describe("Complete Crypto Data Pipeline", () => {
  it("should fetch, transform, and store real data", async () => {
    const source = createCoinGeckoMarketDataReader({ useRemoteServer: true });
    const target = createTimescaleMarketDataWriter({ useRealDatabase: true });
    
    const priceData = await source.getCurrentPrice("bitcoin");
    if (isSuccess(priceData)) {
      const storeResult = await target.publishPrice(getData(priceData));
      expect(isSuccess(storeResult)).toBe(true);
    }
  });
});
```

## Running Tests

### Local Development
```bash
# Fast unit tests (always run these)
bun run test:unit

# Integration tests (when testing external services)  
bun run test:integration

# System tests (full end-to-end validation)
bun run test:system

# All tests
bun run test:full
```

### CI/CD Pipeline

#### **Fast CI (Every Commit)**
```bash
bun run test:ci  # Only unit tests (< 30 seconds)
```

#### **Staging Validation**
```bash
bun run test:staging  # Unit + Integration tests (< 5 minutes)
```

#### **Production Validation**
```bash
bun run test:full  # All tests (< 15 minutes)
```

## Test Configuration Files

### `vitest.config.unit.ts`
- **Timeout**: 5 seconds
- **Files**: `lib/tests/unit/**/*.test.ts`
- **Environment**: Node.js only
- **Use for**: CI/CD fast feedback

### `vitest.config.integration.ts`
- **Timeout**: 30 seconds
- **Files**: `lib/tests/integration/**/*.test.ts`
- **Environment**: External services
- **Retry**: 1 (for network flakiness)

### `vitest.config.system.ts`
- **Timeout**: 60 seconds
- **Files**: `lib/tests/system/**/*.test.ts`
- **Environment**: Full infrastructure
- **Retry**: 2 (for end-to-end flakiness)
- **Threads**: false (sequential execution)

## Mocking Strategy

### ✅ **DO Mock**
- **System dependencies**: File system, network, child processes
- **Configuration**: Environment variables, config files
- **External libraries**: Third-party SDKs for unit tests only

```typescript
// ✅ Good mocking
vi.mock("node:fs");
vi.mock("child_process"); 
vi.mock("../config");
```

### ❌ **DON'T Mock**
- **Business logic**: DSL methods, data transformations
- **Your own code**: Actor implementations, service classes  
- **External APIs**: CoinGecko, MCP servers (use real ones in integration tests)

```typescript
// ❌ Bad mocking
vi.mock("../src/actors/sources/coingecko/MarketDataReader");
vi.mock("@modelcontextprotocol/sdk/client"); // In integration tests
```

## Test Data Strategy

### ✅ **Use Real Data**
- **Integration tests**: Real API responses from CoinGecko, TimescaleDB
- **System tests**: Live cryptocurrency data
- **Performance tests**: Realistic data volumes

### ✅ **Generate Valid Test Data**
- **Unit tests**: Minimal valid objects that follow schema
- **Load tests**: Generated data following real patterns

### ❌ **Avoid Fake Data**
- **No hardcoded prices**: Bitcoin = $50,000 (outdated quickly)
- **No mock API responses**: Use real external services
- **No static fixtures**: Generate dynamic test data

## Continuous Integration Strategy

### **Pull Request Validation**
1. **Unit Tests** (< 30 seconds)
2. **Type Checking**
3. **Linting**

### **Main Branch Validation**  
1. **Unit Tests**
2. **Integration Tests** (if external services available)
3. **Deployment to staging**

### **Release Validation**
1. **Full Test Suite** (unit + integration + system)
2. **Performance benchmarks**
3. **Production deployment**

### **Nightly Validation**
1. **Full Test Suite** with all external dependencies
2. **Long-running stress tests**
3. **Data pipeline validation**

## Error Handling in Tests

### **External Service Failures**
```typescript
describe("CoinGecko Integration", () => {
  it("should handle service unavailability gracefully", async () => {
    try {
      const result = await reader.getCurrentPrice("bitcoin");
      if (isSuccess(result)) {
        expect(getData(result)).toBeGreaterThan(0);
      } else {
        // Log but don't fail - external service may be down
        console.warn("External service returned error:", getError(result));
      }
    } catch (error) {
      // Network errors are acceptable in integration tests
      console.warn("Network error during test:", error);
    }
  });
});
```

### **Rate Limiting**
```typescript
// Add delays between API calls in integration tests
beforeEach(async () => {
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
});
```

This testing strategy ensures fast feedback for developers while maintaining confidence in real-world functionality through comprehensive integration and system testing.