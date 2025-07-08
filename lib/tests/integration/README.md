# Integration Tests

## Overview

Integration tests verify how different components work together **with real external services**.

**Key Principle:** External service setup is part of the test. If external services are not available, the entire integration test suite fails immediately.

## Architecture

### **External Service Setup as Prerequisite**
All integration tests require external services to be available:
- **CoinGecko MCP Server**: Real cryptocurrency data API
- **Redpanda Clusters**: Message streaming infrastructure  
- **TimescaleDB**: Time-series database connections

### **No Graceful Fallbacks**
If any external service is unavailable:
1. ❌ Global setup fails immediately
2. 🚫 No integration tests execute  
3. 💥 Test suite exits with error code

This ensures integration tests actually test real integration.

## Running Integration Tests

### **Integration Tests** (Requires External Services)
```bash
# MUST have external services available or tests fail
bun run test:integration
```

**Behavior:**
- 🔌 **Setup Phase**: Validates all external services are reachable
- ✅ **Test Phase**: Runs real integration tests with live services
- 🚫 **Failure Mode**: If setup fails, no tests run (exit code 1)

## External Service Requirements

### **CoinGecko MCP Server**
- **URL**: `https://mcp.api.coingecko.com/sse`
- **Protocol**: Server-Sent Events (SSE)
- **Health Check**: Must respond to MCP tool listing
- **Purpose**: Live cryptocurrency data integration

### **Additional Services** (Future)
- **Redpanda**: Message streaming integration
- **TimescaleDB**: Time-series data storage integration

## Test Categories

### **External API Tests** (`external-apis/`)
Test real external MCP server integration:
- **CoinGecko MCP Server**: `https://mcp.api.coingecko.com/sse`
- **Live Data**: Bitcoin prices, market analytics, OHLCV data
- **Error Handling**: Network failures, rate limiting, service downtime

### **MCP Server Tests** (`mcp-servers/`)  
Test launching and managing MCP servers:
- **Redpanda MCP Launcher**: Process management, configuration
- **Service Health**: Status monitoring, graceful shutdown
- **Error Recovery**: Process failures, restart logic

## Best Practices

### ✅ **DO**
- Use `skipIfNoExternal` for tests requiring external services
- Test graceful degradation when external services fail
- Verify error handling for network issues
- Use realistic timeouts (30s+ for external services)

### ❌ **DON'T**  
- Assume external services are always available
- Hard-code specific API responses (they change)
- Skip external integration testing completely
- Use unit test timeouts for integration tests

## CI/CD Strategy

### **Pull Request Validation**
```bash
bun run test:integration  # Graceful fallback mode
```

### **Staging Deployment**
```bash
bun run test:integration:external  # Full external validation
```

### **Production Release**
```bash
bun run test:integration:external  # Must pass with real services
```

## Example Test Structure

```typescript
describe("CoinGecko External Integration", () => {
  const skipIfNoExternal = process.env.INTEGRATION_EXTERNAL === "true" ? it : it.skip;
  
  // Always runs - tests internal integration
  it("should initialize CoinGecko reader", async () => {
    const reader = createCoinGeckoMarketDataReader({...});
    const result = await reader.initialize();
    expect(isSuccess(result)).toBe(true);
  });
  
  // Only runs when INTEGRATION_EXTERNAL=true
  skipIfNoExternal("should fetch real Bitcoin price", async () => {
    const result = await reader.getCurrentPrice("bitcoin");
    expect(isSuccess(result)).toBe(true);
    
    if (isSuccess(result)) {
      const price = getData(result);
      expect(price).toBeGreaterThan(0);
    }
  });
});
```

This approach ensures:
- 🚀 **Fast CI/CD**: Internal integration always tested
- 🔒 **Quality Gates**: External services tested before production  
- 🛡️ **Resilience**: Graceful handling of service unavailability
- 📊 **Clear Intent**: Different test types for different purposes