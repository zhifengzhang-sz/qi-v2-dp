# Running Tests

## Quick Start

```bash
# Run all tests (recommended)
bun run test:unit && bun run test:integration:v1

# Run only unit tests (fast)
bun run test:unit

# Run only integration tests (requires external services)
bun run test:integration:v1
```

## Test Commands Reference

### Unit Tests
```bash
# Run all unit tests
bun run test:unit

# Run unit tests with watch mode
bun run test:watch

# Run specific unit test file
bun test lib/tests/unit/base/BaseReader.test.ts

# Run unit tests with coverage
bun run test:unit --coverage
```

### Integration Tests
```bash
# Run v1.0 integration tests (recommended)
bun run test:integration:v1

# Run full integration test suite
bun run test:integration

# Run sequential integration tests
bun run test:integration:sequential
```

### Setup Commands
```bash
# Phase 1: Collect real data from APIs (one-time or when data stale)
bun run test:setup:phase1

# Phase 2: Validate services (runs automatically with integration tests)
bun run test:setup:phase2

# Setup TimescaleDB manually (usually auto-created)
bun run test:setup:timescaledb
```

### Service Management
```bash
# Start all required services
bun run services:start

# Check service status
bun run services:status

# View service logs
bun run services:logs

# Stop all services
bun run services:stop
```

## Test Execution Flow

### 1. Development Workflow
```bash
# Daily development cycle
bun run test:unit                    # ✅ Fast feedback (< 1s)
# Make changes...
bun run test:unit                    # ✅ Validate changes
# Ready for integration
bun run test:integration:v1          # ✅ Full validation (10-15s)
```

### 2. CI/CD Workflow
```bash
# Continuous Integration Pipeline
bun run test:setup:phase1            # Collect fresh data
bun run test:unit                    # Core logic validation
bun run test:integration:v1          # External service validation
```

### 3. Production Readiness Check
```bash
# Before deployment
bun run test:setup:phase2            # Validate infrastructure
if [ $? -eq 0 ]; then
  echo "✅ Production ready"
  bun run test:integration:v1
else
  echo "❌ Infrastructure issues"
  exit 1
fi
```

## Test Categories Explained

### Unit Tests (`test:unit`)
- **Speed**: < 1 second
- **Dependencies**: None (uses `useRemoteServer: false`)
- **Purpose**: Validate core business logic and architecture
- **Data**: Real data from fixtures, no external calls

```bash
$ bun run test:unit
 ✓ |unit| lib/tests/unit/base/BaseReader.test.ts (8)
 ✓ |unit| lib/tests/unit/dsl/MarketDataReadingDSL.test.ts (12)
 ✓ |unit| lib/tests/unit/basic-architecture.test.ts (9)

Test Files  5 passed (5)
Tests  60 passed (60)
Duration  327ms
```

### Integration Tests (`test:integration:v1`)
- **Speed**: 10-15 seconds
- **Dependencies**: External services required
- **Purpose**: Validate external API integration and data flow
- **Data**: Live API calls with real-time validation

```bash
$ bun run test:integration:v1
🔍 Phase 2: Validating services for test execution...
✅ CoinGecko API available (2950ms)
✅ TimescaleDB available (18ms)

 ✓ |integration-v1| CoinGeckoMarketDataReader (15)
 ✓ |integration-v1| OfficialRedpandaMCPLauncher (14)

Test Files  2 passed (2)
Tests  29 passed (29)
Duration  15.02s
```

## Configuration Files

### Unit Test Config (`vitest.config.unit.ts`)
```typescript
export default defineConfig({
  test: {
    name: "unit",
    include: ["./lib/tests/unit/**/*.test.ts"],
    exclude: ["./lib/tests/integration/**"],
    // No external dependencies
    globals: true,
    environment: "node",
  },
});
```

### Integration Test Config (`vitest.config.integration.v1.ts`)
```typescript
export default defineConfig({
  test: {
    name: "integration-v1",
    include: [
      "./lib/tests/integration/external-apis/CoinGeckoMarketDataReader.test.ts",
      "./lib/tests/integration/mcp-servers/redpanda-mcp-launcher.test.ts",
    ],
    globalSetup: ["./lib/tests/integration/setup/global-setup.ts"],
    timeout: 60000,
  },
});
```

## Expected Test Output

### Successful Unit Test Run
```bash
$ bun run test:unit

 RUN  v3.2.4 /home/zzhang/dev/qi/github/qi-v2-dp-ts-actor

 ✓ |unit| lib/tests/unit/dsl/MarketDataReadingDSL.test.ts (12)
 ✓ |unit| lib/tests/unit/dsl/MarketDataWritingDSL.test.ts (12)
 ✓ |unit| lib/tests/unit/basic-architecture.test.ts (9)
 ✓ |unit| lib/tests/unit/base/BaseReader.test.ts (15)
 ✓ |unit| lib/tests/unit/base/redpanda-config.test.ts (9)

 Test Files  5 passed (5)
      Tests  60 passed (60)
   Start at  20:18:45
   Duration  327ms

JSON report written to ./test-results/unit-results.json
```

### Successful Integration Test Run
```bash
$ bun run test:integration:v1

🔍 Phase 2: Validating services for test execution...
🌐 Validating CoinGecko MCP API...
✅ CoinGecko API available (2950ms)
🔄 Validating Redpanda cluster...
✅ Redpanda cluster available (42ms)
🗄️ Validating TimescaleDB...
✅ TimescaleDB available (18ms)
✅ Phase 2: All 3 required services are available
🚀 Tests can proceed with real service integration

🔌 Setting up external services for integration testing...
✅ CoinGecko MCP Server - Available (4726ms)
🎉 All external services are ready for integration testing!

📊 Using real Bitcoin price from fixtures: $108798

 ✓ |integration-v1| CoinGeckoMarketDataReader > Initialization (1)
 ✓ |integration-v1| CoinGeckoMarketDataReader > MCP Client Integration (2)
 ✓ |integration-v1| CoinGeckoMarketDataReader > DSL Interface Implementation (4)
   ✅ Bitcoin price: $108785.00 (expected: $108798)
   ✅ Retrieved 2 cryptocurrency prices (validated against fixtures)
   ✅ Market Cap: $3.44T (expected: ~$2.50T)
   ✅ OHLCV - O: $109222, H: $109574, L: $107591, C: $108301

 Test Files  2 passed (2)
      Tests  29 passed (29)
   Duration  15.02s
```

## Troubleshooting Test Runs

### Common Issues & Solutions

#### Rate Limiting (HTTP 429)
```bash
❌ CoinGecko API unavailable: SSE error: Non-200 status code (429)
```
**Solution**: Wait 30-60 seconds and retry, or run Phase 1 setup with fresh data

#### Missing Services
```bash
❌ TimescaleDB unavailable: connection refused
```
**Solution**: Start services with `bun run services:start`

#### Stale Test Data
```bash
⚠️ Bitcoin price data is 2.5 hours old - may need refresh
```
**Solution**: Run `bun run test:setup:phase1` to collect fresh data

#### Test Timeouts
```bash
Test timed out in 5000ms
```
**Solution**: Check if `useRemoteServer` flag is correctly set for the test type

### Debug Commands
```bash
# Check service status
bun run services:status

# View detailed service logs
bun run services:logs

# Test individual service connections
bun run test:setup:phase2

# Collect fresh API data
bun run test:setup:phase1

# Run single test file with verbose output
bun test lib/tests/unit/base/BaseReader.test.ts --reporter=verbose
```

### Performance Expectations

| Test Type | Duration | External Deps | Purpose |
|-----------|----------|---------------|---------|
| Unit Tests | < 1s | None | Core logic validation |
| Integration v1 | 10-15s | CoinGecko, DB | External service validation |
| Phase 1 Setup | 30-60s | All APIs | Data collection |
| Phase 2 Setup | 3-5s | All Services | Service validation |

## Environment Variables

### Optional Configuration
```bash
# Override default database settings
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=password

# Override Redpanda settings
export REDPANDA_BROKERS=localhost:19092

# Test data collection settings
export TEST_DATA_COLLECTION_TIMEOUT=30000
export TEST_API_RATE_LIMIT_DELAY=2000
```

### Docker Environment
```bash
# Start services with Docker Compose
docker compose up -d postgres redpanda

# Run tests in containerized environment
docker compose exec app bun run test:unit
docker compose exec app bun run test:integration:v1
```

---

*For more detailed troubleshooting, see [Troubleshooting Guide](./troubleshooting.md)*