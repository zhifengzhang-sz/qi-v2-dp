# Rate Limiting & API Resilience

## Overview

QiCore implements production-grade rate limiting and API resilience patterns to handle real-world external service constraints. The testing system treats rate limiting as a normal operational condition, not a test failure.

## Rate Limiting Strategy

### Core Principles
1. **Exponential Backoff**: Progressively longer delays between retries
2. **Error Classification**: Distinguish rate limits from other errors
3. **Graceful Degradation**: Continue operation when possible
4. **Honest Signals**: Surface real infrastructure issues

### Implementation Pattern
```typescript
private async connectWithRetry(maxRetries = 3): Promise<Client | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.connectToExternalService();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      if (this.isRateLimitError(errorMsg)) {
        const delay = this.calculateBackoffDelay(attempt);
        await this.waitWithLogging(delay, attempt, maxRetries);
      } else {
        // Non-rate-limit errors fail immediately
        throw error;
      }
    }
  }
  return null; // Failed after all retries
}
```

## CoinGecko API Rate Limiting

### Rate Limit Detection
```typescript
private isRateLimitError(errorMsg: string): boolean {
  return errorMsg.includes("429") || 
         errorMsg.includes("Non-200 status code (429)") ||
         errorMsg.includes("Rate limit exceeded");
}
```

### Backoff Calculation
```typescript
private calculateBackoffDelay(attempt: number): number {
  // Exponential backoff: 2s, 4s, 8s
  return Math.pow(2, attempt) * 2000;
}
```

### Implementation in Phase 1 Data Collection
```typescript
// lib/tests/data/setup/phase1/collect-real-data.ts
export class Phase1DataCollector {
  private async connectWithRetry(maxRetries = 3): Promise<Client | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const client = new Client({
          name: "phase1-data-collector",
          version: "1.0.0",
        }, { capabilities: {} });

        const transport = new SSEClientTransport(
          new URL("https://mcp.api.coingecko.com/sse")
        );
        
        await client.connect(transport);
        return client;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        
        if (errorMsg.includes("429") || errorMsg.includes("Non-200 status code (429)")) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.log(`⏳ Rate limited (attempt ${attempt}/${maxRetries}), waiting ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error(`❌ Connection error: ${errorMsg}`);
          throw error;
        }
      }
    }
    
    console.error("❌ Failed to connect after all retries");
    return null;
  }

  private async callToolWithRetry(client: Client, toolCall: any): Promise<any> {
    const maxRetries = 2;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await client.callTool(toolCall);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        
        if (errorMsg.includes("429") && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s
          console.log(`⏳ API call rate limited, waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
  }
}
```

### Implementation in Phase 2 Service Validation
```typescript
// lib/tests/data/setup/phase2/validate-services.ts
export class Phase2ServiceValidator {
  private async connectToMCPWithRetry(maxRetries = 3): Promise<Client | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const client = new Client({
          name: "phase2-validator",
          version: "1.0.0",
        }, { capabilities: {} });

        const transport = new SSEClientTransport(
          new URL("https://mcp.api.coingecko.com/sse")
        );
        
        await client.connect(transport);
        return client;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        
        if (errorMsg.includes("429") || errorMsg.includes("Non-200 status code (429)")) {
          const delay = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
          console.log(`⏳ Rate limited (attempt ${attempt}/${maxRetries}), waiting ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Non-rate-limit error, don't retry
          throw error;
        }
      }
    }
    
    return null;
  }

  private async callMCPToolWithRetry(client: Client, toolCall: any): Promise<any> {
    const maxRetries = 2;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await client.callTool(toolCall);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        
        if (errorMsg.includes("429") && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s
          console.log(`⏳ API call rate limited, waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
  }
}
```

### Implementation in CoinGecko Actor
```typescript
// lib/src/actors/sources/coingecko/MarketDataReader.ts
export class CoinGeckoMarketDataReader extends BaseReader {
  private async connectToMCPWithRetry(maxRetries = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (this.config.debug) {
          console.log(`🚀 Connecting to external CoinGecko MCP server (attempt ${attempt}/${maxRetries})...`);
        }

        const transport = new SSEClientTransport(new URL("https://mcp.api.coingecko.com/sse"));
        await this.mcpClient!.connect(transport);
        this.mcpClientInitialized = true;
        return true;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        
        if (errorMsg.includes("429") || errorMsg.includes("Non-200 status code (429)")) {
          const delay = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
          if (this.config.debug) {
            console.log(`⏳ Rate limited (attempt ${attempt}/${maxRetries}), waiting ${delay}ms...`);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Non-rate-limit error, don't retry
          if (this.config.debug) {
            console.log(`❌ MCP connection error: ${errorMsg}`);
          }
          break;
        }
      }
    }
    
    return false;
  }
}
```

## Rate Limiting in Action

### Successful Retry Sequence
```bash
🌐 Validating CoinGecko MCP API...
⏳ Rate limited (attempt 1/3), waiting 2000ms...
⏳ Rate limited (attempt 2/3), waiting 4000ms...
✅ CoinGecko API available (8453ms)
```

### Phase 1 Data Collection with Rate Limiting
```bash
📊 Phase 1: Collecting real data from external APIs...
🌐 Connecting to CoinGecko MCP API...
📊 Collecting real Bitcoin market data...
⏳ Rate limited, waiting 1000ms before retry...
✅ Bitcoin market data collected
📊 Collecting multi-coin market data...
⏳ API call rate limited, waiting 2000ms before retry...
✅ Multi-coin data collected
```

### Integration Test with Rate Limiting
```bash
📊 Using real Bitcoin price from fixtures: $108798
🚀 Connecting to external CoinGecko MCP server (attempt 1/3)...
⏳ Rate limited (attempt 1/3), waiting 2000ms...
🚀 Connecting to external CoinGecko MCP server (attempt 2/3)...
✅ Connected to external CoinGecko MCP server
✅ Bitcoin price: $108785.00 (expected: $108798)
```

## Error Classification

### Rate Limit Errors (Retry with Backoff)
- `SSE error: Non-200 status code (429)`
- `Rate limit exceeded`
- `Too Many Requests`

### Connection Errors (Retry with Backoff)
- `ECONNRESET`
- `ENOTFOUND` (temporary DNS issues)
- `ETIMEDOUT` (temporary network issues)

### Authentication Errors (Don't Retry)
- `401 Unauthorized`
- `403 Forbidden`
- `Invalid API key`

### Service Errors (Don't Retry)
- `500 Internal Server Error`
- `502 Bad Gateway`
- `Service temporarily unavailable`

## Configuration Parameters

### Retry Configuration
```typescript
interface RetryConfig {
  maxRetries: number;          // Default: 3
  baseDelay: number;          // Default: 1000ms
  maxDelay: number;           // Default: 8000ms
  backoffFactor: number;      // Default: 2 (exponential)
  retryableErrors: string[];  // Rate limit error patterns
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 8000,
  backoffFactor: 2,
  retryableErrors: ["429", "Rate limit", "ECONNRESET", "ETIMEDOUT"]
};
```

### Environment Variables
```bash
# Override retry behavior
export TEST_API_MAX_RETRIES=5
export TEST_API_BASE_DELAY=2000
export TEST_API_MAX_DELAY=16000

# Enable detailed rate limiting logs
export TEST_API_DEBUG_RATE_LIMITING=true
```

## Best Practices

### 1. Progressive Delays
```typescript
// Good: Exponential backoff
const delay = Math.pow(2, attempt) * baseDelay; // 1s, 2s, 4s, 8s

// Bad: Fixed delay
const delay = 1000; // Always 1s - may hit rate limits repeatedly
```

### 2. Error Message Parsing
```typescript
// Good: Specific error detection
if (errorMsg.includes("429") || errorMsg.includes("Rate limit")) {
  // Handle rate limiting
}

// Bad: Catch-all retry
try {
  await apiCall();
} catch (error) {
  // Retry everything - may retry non-recoverable errors
}
```

### 3. Logging and Observability
```typescript
// Good: Detailed logging with context
console.log(`⏳ Rate limited (attempt ${attempt}/${maxRetries}), waiting ${delay}ms...`);
console.log(`✅ API available after ${totalTime}ms (${retryCount} retries)`);

// Bad: Silent retries
// await delay(backoffTime); // No visibility into retry behavior
```

### 4. Circuit Breaker Pattern
```typescript
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold = 5;
  private readonly resetTimeout = 60000; // 1 minute

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error("Circuit breaker is open");
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private isOpen(): boolean {
    return this.failureCount >= this.failureThreshold &&
           (Date.now() - this.lastFailureTime) < this.resetTimeout;
  }
}
```

## Testing Rate Limiting

### Unit Tests for Retry Logic
```typescript
describe("Rate Limiting", () => {
  it("should retry on 429 errors with exponential backoff", async () => {
    const mockClient = {
      connect: jest.fn()
        .mockRejectedValueOnce(new Error("SSE error: Non-200 status code (429)"))
        .mockRejectedValueOnce(new Error("SSE error: Non-200 status code (429)"))
        .mockResolvedValueOnce(undefined)
    };

    const start = Date.now();
    const result = await connectWithRetry(mockClient);
    const duration = Date.now() - start;

    expect(result).toBe(true);
    expect(mockClient.connect).toHaveBeenCalledTimes(3);
    expect(duration).toBeGreaterThan(3000); // 1s + 2s delays
  });

  it("should not retry on non-rate-limit errors", async () => {
    const mockClient = {
      connect: jest.fn().mockRejectedValue(new Error("401 Unauthorized"))
    };

    await expect(connectWithRetry(mockClient)).rejects.toThrow("401 Unauthorized");
    expect(mockClient.connect).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Tests with Real Rate Limiting
```typescript
describe("Real API Rate Limiting", () => {
  it("should handle actual CoinGecko rate limits gracefully", async () => {
    // This test may hit real rate limits - ensure retry logic works
    const reader = createCoinGeckoMarketDataReader({
      useRemoteServer: true,
      debug: true
    });

    const result = await reader.initialize();
    
    // Should succeed even if rate limited during test
    expect(isSuccess(result)).toBe(true);
  }, 30000); // Allow time for retries
});
```

## Monitoring & Observability

### Metrics to Track
- API call success rate
- Retry attempt distribution
- Average retry delay
- Circuit breaker state transitions
- Rate limit hit frequency

### Logging Format
```typescript
interface RetryLogEntry {
  timestamp: string;
  service: string;
  operation: string;
  attempt: number;
  maxRetries: number;
  delay: number;
  errorType: string;
  success: boolean;
}

// Example log output
{
  "timestamp": "2025-07-08T12:19:45.123Z",
  "service": "coingecko-mcp",
  "operation": "get_coins_markets",
  "attempt": 2,
  "maxRetries": 3,
  "delay": 4000,
  "errorType": "rate_limit_429",
  "success": false
}
```

---

*This rate limiting system ensures QiCore can handle real-world API constraints while providing reliable testing and production operation.*