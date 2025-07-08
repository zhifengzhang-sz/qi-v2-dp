# No-Mocking Testing Philosophy

## Core Principle

**"No mocking allowed in test source code"** - All tests must use real data or actual API responses to provide honest production readiness signals.

## Why No Mocking?

### Problems with Traditional Mocking

1. **False Confidence**: Mocked tests pass while production fails
2. **Stale Assumptions**: Mocks don't evolve with real API changes
3. **Hidden Dependencies**: External service changes break production silently
4. **Integration Gaps**: Unit tests with mocks miss real-world interaction issues

### QiCore's Solution

Instead of mocking, we use:

- **Real API Responses**: Stored as fixtures from actual external services
- **Live Service Validation**: Tests verify external services are actually available
- **Auto-Infrastructure Setup**: Missing databases/services created on demand
- **Rate Limiting Resilience**: Production-grade retry logic with exponential backoff

## Implementation Strategy

### Phase 1: One-Time Data Collection
```typescript
// lib/tests/data/setup/phase1/collect-real-data.ts
export class RealDataCollector {
  async collectFromCoinGecko(): Promise<void> {
    // Connect to actual CoinGecko MCP API
    const client = await this.connectWithRetry();
    
    // Fetch real Bitcoin data
    const bitcoinData = await client.callTool({
      name: "get_coins_markets",
      arguments: { ids: "bitcoin", vs_currency: "usd" }
    });
    
    // Store as fixture for tests
    await this.saveFixture("bitcoin-market-data.json", bitcoinData);
  }
}
```

### Phase 2: Per-Test Service Validation
```typescript
// lib/tests/data/setup/phase2/validate-services.ts
export class ServiceValidator {
  async validateAll(): Promise<ValidationResult> {
    // Fail fast if external services unavailable
    await this.validateCoinGeckoAPI();
    await this.validateTimescaleDB();
    await this.validateRedpandaCluster();
    
    // Only proceed if ALL required services available
    return { success: allServicesUp, services: this.services };
  }
}
```

### Test Data Loading
```typescript
// lib/tests/data/fixtures/data-loader.ts
export class TestDataLoader {
  async loadUnifiedPriceData(): Promise<CryptoPriceData[]> {
    // Load real data from fixtures, no mocking
    const bitcoinData = await this.loadBitcoinMarketData();
    return bitcoinData.map(btc => ({
      coinId: btc.id,
      usdPrice: btc.current_price,
      source: "coingecko-real", // Always real data
      attribution: "CoinGecko MCP API"
    }));
  }
}
```

## Test Architecture

### Unit Tests: Local Mode
```typescript
// useRemoteServer: false - No external dependencies
const reader = createCoinGeckoMarketDataReader({ 
  useRemoteServer: false // Fast local testing
});

// Still uses real data from fixtures
const expectedPrice = await testDataLoader.getCurrentBitcoinPrice();
```

### Integration Tests: Live Services
```typescript
// useRemoteServer: true - Full external integration
const reader = createCoinGeckoMarketDataReader({ 
  useRemoteServer: true // Live API validation
});

// Phase 2 validation ensures services are available
// Tests fail if external services down
```

## Rate Limiting & Resilience

### Exponential Backoff Implementation
```typescript
private async connectWithRetry(maxRetries = 3): Promise<Client | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.connectToMCP();
    } catch (error) {
      if (error.includes("429")) { // Rate limited
        const delay = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error; // Non-rate-limit errors fail immediately
      }
    }
  }
  return null;
}
```

### Production-Grade Error Handling
```typescript
// Tests handle real-world constraints
if (response.status === 429) {
  console.log("⏳ Rate limited, implementing backoff...");
  // Exponential backoff, not test failure
}

if (!serviceAvailable) {
  console.error("❌ External service unavailable");
  process.exit(1); // Honest failure signal
}
```

## Benefits Achieved

### 1. Honest Production Signals
- Tests fail when external APIs are down (as production would)
- Rate limiting is discovered and handled in testing
- Real data format changes caught early

### 2. Continuous Validation
- External service health monitored via test runs
- API contract changes detected immediately
- Infrastructure issues surface before deployment

### 3. Real-World Resilience
- Rate limiting logic tested with actual limits
- Network timeouts handled with real latency
- Service degradation scenarios validated

## Examples from QiCore v1.0

### Bitcoin Price Validation
```bash
✅ Bitcoin price: $108,785 (expected: $108,798) - 0.01% variance
✅ Market Cap: $3.44T (expected: ~$2.50T) - 50% tolerance for volatility
✅ Retrieved 2 cryptocurrency prices (validated against fixtures)
```

### Service Health Monitoring
```bash
🔍 Phase 2: Validating services for test execution...
🌐 Validating CoinGecko MCP API...
✅ CoinGecko API available (2950ms)
🗄️ Validating TimescaleDB...
✅ TimescaleDB available (18ms)
```

### Rate Limiting Resilience
```bash
⏳ Rate limited (attempt 1/3), waiting 2000ms...
⏳ Rate limited (attempt 2/3), waiting 4000ms...
✅ CoinGecko API available (8453ms) - After backoff
```

## Implementation Guidelines

### DO
- ✅ Use real API responses stored as fixtures
- ✅ Validate external services before testing
- ✅ Implement production-grade retry logic
- ✅ Fail fast when infrastructure unavailable
- ✅ Use `useRemoteServer: false` for fast unit tests

### DON'T
- ❌ Mock external API responses in test code
- ❌ Assume external services are always available
- ❌ Ignore rate limiting in test design
- ❌ Hide infrastructure dependencies
- ❌ Create tests that pass when production would fail

## Migration from Mocking

### Before (Mocked)
```typescript
// Bad: Mocked test that provides false confidence
const mockResponse = { current_price: 50000 }; // Fake data
jest.mock('@coinapi/client', () => ({ getPrice: () => mockResponse }));

const price = await reader.getCurrentPrice("bitcoin");
expect(price).toBe(50000); // Test passes, production might fail
```

### After (Real Data)
```typescript
// Good: Real data test that provides honest signals
const expectedPrice = await testDataLoader.getCurrentBitcoinPrice(); // Real data
const result = await reader.getCurrentPrice("bitcoin"); // Real API call

if (isSuccess(result)) {
  const price = getData(result);
  const variance = Math.abs(price - expectedPrice) / expectedPrice;
  expect(variance).toBeLessThan(0.05); // 5% tolerance for real-time changes
} else {
  // Honest failure - external service issues surface immediately
  throw new Error(`External MCP server failed: ${getError(result)?.message}`);
}
```

---

*This philosophy ensures QiCore tests provide honest production readiness signals and catch real-world issues before deployment.*