# Two-Phase Testing Architecture

## Overview

QiCore implements a **two-phase testing setup** that separates one-time data collection from per-test service validation, ensuring reliable testing with real external services.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    QiCore Testing Architecture                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Phase 1: One-Time Data Collection                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • Collect real data from external APIs                 │   │
│  │ • Store as fixtures for test validation                │   │
│  │ • Rate limiting with exponential backoff               │   │
│  │ • Run manually or during CI setup                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                   │
│                            ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Test Data Fixtures                            │   │
│  │  lib/tests/data/fixtures/                               │   │
│  │  ├── coingecko/bitcoin-market-data.json                 │   │
│  │  ├── market-data/global-analytics.json                 │   │
│  │  └── timescaledb/price-records.json                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                   │
│                            ▼                                   │
│  Phase 2: Per-Test Service Validation                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • Validate external services are available             │   │
│  │ • Auto-create missing infrastructure                   │   │
│  │ • Fail fast if required services down                  │   │
│  │ • Run before every test execution                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                   │
│                            ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Test Execution                             │   │
│  │  • Unit Tests (useRemoteServer: false)                 │   │
│  │  • Integration Tests (useRemoteServer: true)           │   │
│  │  • Real data validation with live services             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Phase 1: One-Time Data Collection

### Purpose
Collect real data from external APIs and store as fixtures for test validation. This phase handles rate limiting and ensures we have current, real data for testing.

### Implementation
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
        
        if (errorMsg.includes("429")) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Rate limited, waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
    return null;
  }

  async collectBitcoinData(): Promise<void> {
    console.log("📊 Collecting real Bitcoin market data...");
    
    const client = await this.connectWithRetry();
    if (!client) throw new Error("Failed to connect to CoinGecko API");

    try {
      const response = await client.callTool({
        name: "get_coins_markets",
        arguments: {
          ids: "bitcoin",
          vs_currency: "usd",
          order: "market_cap_desc",
          per_page: 1,
          page: 1,
          sparkline: false,
        },
      });

      await this.saveFixture("coingecko/bitcoin-market-data.json", response);
      console.log("✅ Bitcoin market data collected");
      
    } finally {
      await client.close();
    }
  }
}
```

### Data Collection Process
```bash
$ bun run test:setup:phase1

📊 Phase 1: Collecting real data from external APIs...
🌐 Connecting to CoinGecko MCP API...
📊 Collecting real Bitcoin market data...
✅ Bitcoin market data collected
📊 Collecting multi-coin market data...
✅ Multi-coin data collected
📊 Collecting global market analytics...
✅ Global analytics collected
🎉 Phase 1 complete - Real data fixtures ready
```

### Generated Fixtures
```
lib/tests/data/fixtures/
├── coingecko/
│   ├── bitcoin-market-data.json          # Real BTC price data
│   ├── multi-coin-data.json             # Real multi-coin data
│   └── available-tools.json              # MCP server capabilities
├── market-data/
│   ├── global-analytics.json            # Market cap, dominance data
│   └── bitcoin-ohlcv-hourly.json        # OHLCV candles
├── redpanda/
│   └── price-messages.json              # Kafka message samples
└── timescaledb/
    └── price-records.json               # Database record samples
```

## Phase 2: Per-Test Service Validation

### Purpose
Validate that all required external services are available before running tests. Create missing infrastructure automatically. Fail fast if critical services are down.

### Implementation
```typescript
// lib/tests/data/setup/phase2/validate-services.ts
export class Phase2ServiceValidator {
  async validateAll(): Promise<ValidationResult> {
    console.log("🔍 Phase 2: Validating services for test execution...");
    
    // Validate each required service
    await this.validateCoinGeckoAPI();
    await this.validateRedpandaCluster();
    await this.validateTimescaleDB();
    await this.validateRedpandaMCPServer();
    
    const requiredServices = this.services.filter(s => s.required);
    const requiredServicesUp = requiredServices.filter(s => s.available).length;
    
    const result: ValidationResult = {
      success: requiredServicesUp === requiredServices.length,
      timestamp: new Date(),
      services: this.services,
      requiredServicesUp,
      totalRequiredServices: requiredServices.length,
    };
    
    if (result.success) {
      console.log("✅ All required services available");
      console.log("🚀 Tests can proceed with real service integration");
    } else {
      console.error("❌ Required services unavailable");
      console.error("🚫 Tests cannot proceed - fix service issues first");
      
      const failedServices = this.services.filter(s => s.required && !s.available);
      for (const service of failedServices) {
        console.error(`   - ${service.name}: ${service.error}`);
      }
    }
    
    return result;
  }
}
```

### Service Validation Process
```bash
$ bun run test:setup:phase2

🔍 Phase 2: Validating services for test execution...
🌐 Validating CoinGecko MCP API...
✅ CoinGecko API available (2950ms)
🔄 Validating Redpanda cluster...
✅ Redpanda cluster available (42ms)
🗄️ Validating TimescaleDB...
✅ TimescaleDB available (18ms)
🔌 Validating Redpanda MCP Server...
⚠️ Redpanda MCP Server unavailable: rpk not installed (optional)
✅ Phase 2: All 3 required services are available
🚀 Tests can proceed with real service integration
```

### Auto-Infrastructure Setup

#### TimescaleDB Auto-Creation
```typescript
// lib/tests/data/setup/phase2/setup-timescaledb.ts
export async function setupTimescaleDB(): Promise<SetupResult> {
  try {
    const client = new Client({
      host: "localhost",
      port: 5432,
      database: "postgres", // Connect to postgres to create test DB
      user: "postgres",
      password: "password",
    });

    await client.connect();
    
    // Create test database
    await client.query("CREATE DATABASE crypto_data_test");
    console.log("✅ Test database created");
    
    await client.end();

    // Connect to test database to set up TimescaleDB
    const testClient = new Client({
      host: "localhost",
      port: 5432,
      database: "crypto_data_test",
      user: "postgres",
      password: "password",
    });

    await testClient.connect();
    
    // Enable TimescaleDB extension
    await testClient.query("CREATE EXTENSION IF NOT EXISTS timescaledb;");
    
    // Create crypto_prices table
    await testClient.query(`
      CREATE TABLE IF NOT EXISTS crypto_prices (
        id SERIAL PRIMARY KEY,
        coin_id VARCHAR(50) NOT NULL,
        price DECIMAL(20, 8) NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL,
        source VARCHAR(50) NOT NULL
      );
    `);
    
    // Create hypertable for time-series optimization
    await testClient.query(`
      SELECT create_hypertable('crypto_prices', 'timestamp', if_not_exists => TRUE);
    `);
    
    await testClient.end();
    console.log("✅ TimescaleDB setup complete");
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}
```

## Integration with Test Execution

### Package.json Scripts
```json
{
  "scripts": {
    "test:setup:phase1": "bun run lib/tests/data/setup/phase1/collect-real-data.ts",
    "test:setup:phase2": "bun run lib/tests/data/setup/phase2/validate-services.ts",
    "test:unit": "vitest run --config vitest.config.unit.ts",
    "test:integration:v1": "bun run test:setup:phase2 && vitest run --config vitest.config.integration.v1.ts",
    "test:full": "bun run test:unit && bun run test:integration:v1"
  }
}
```

### Vitest Global Setup
```typescript
// lib/tests/integration/setup/global-setup.ts
export default async function globalSetup() {
  console.log("🔌 Setting up external services for integration testing...");
  
  // Run Phase 2 validation
  const validator = new Phase2ServiceValidator();
  const result = await validator.validateAll();
  
  if (!result.success) {
    console.error("❌ Integration test setup failed");
    console.error("🔧 Run 'bun run test:setup:phase2' to diagnose issues");
    process.exit(1);
  }
  
  console.log("🎉 All external services are ready for integration testing!");
}
```

## Benefits of Two-Phase Architecture

### 1. Separation of Concerns
- **Phase 1**: Handle rate limiting, data collection complexity once
- **Phase 2**: Fast service validation per test run
- **Test Execution**: Focus on business logic validation

### 2. Rate Limiting Resilience
- Exponential backoff during data collection
- Cached fixtures reduce API calls during testing
- Production-grade error handling

### 3. Infrastructure Automation
- Auto-create missing databases
- Set up required extensions and tables
- Graceful degradation for optional services

### 4. Fast Feedback Loops
- Phase 2 validation runs in seconds
- Unit tests bypass external services entirely
- Integration tests get immediate "go/no-go" signal

### 5. Honest Production Signals
- Tests fail when external services are down
- Real data catches API contract changes
- Infrastructure issues surface immediately

## Workflow Examples

### Development Workflow
```bash
# One-time setup (or when data gets stale)
bun run test:setup:phase1

# Daily development
bun run test:unit                    # Fast local testing
bun run test:integration:v1          # Full integration with Phase 2 validation
```

### CI/CD Pipeline
```bash
# In CI environment
bun run test:setup:phase1            # Collect fresh data
bun run test:unit                    # Validate core logic
bun run test:integration:v1          # Validate external integrations
```

### Production Readiness Check
```bash
# Before deployment
bun run test:setup:phase2            # Validate all services
echo $?                             # 0 = ready, 1 = not ready
```

## Troubleshooting

### Phase 1 Issues
```bash
❌ CoinGecko API unavailable: SSE error: Non-200 status code (429)
```
**Solution**: Wait for rate limit to reset, or increase retry delays

### Phase 2 Issues
```bash
❌ TimescaleDB unavailable: database "crypto_data_test" does not exist
```
**Solution**: Auto-setup will create database, or run setup manually

### Integration Test Issues
```bash
❌ External MCP server failed: No client available
```
**Solution**: Check Phase 2 validation, ensure `useRemoteServer: true` is correct

---

*This two-phase architecture ensures reliable testing with real external services while handling the complexities of rate limiting and infrastructure setup.*