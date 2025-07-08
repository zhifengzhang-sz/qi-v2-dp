# Testing Data Architecture

## Directory Structure

```
lib/tests/data/
├── fixtures/           # Static test data (one-time setup)
│   ├── coingecko/     # CoinGecko API responses
│   ├── redpanda/      # Kafka message samples
│   ├── timescaledb/   # Database records
│   └── market-data/   # Market analytics samples
├── real-time/         # Dynamic test data (per-test setup)
│   ├── prices/        # Current price data
│   ├── ohlcv/         # OHLCV data
│   └── analytics/     # Market analytics
└── setup/             # Setup scripts and configurations
    ├── phase1/        # One-time data collection
    ├── phase2/        # Per-test service validation
    └── configs/       # Service configurations
```

## Two-Phase Setup Architecture

### Phase 1: One-Time Setup (Data Collection)
- **When**: Run once manually or in CI/CD setup
- **Purpose**: Collect real data from external APIs for testing
- **Output**: Static fixtures stored in `fixtures/` directory
- **Failure**: Indicates external API issues, setup should retry or manual intervention

### Phase 2: Per-Test Setup (Service Validation)
- **When**: Before every test run
- **Purpose**: Validate services are running and accessible
- **Output**: Dynamic data in `real-time/` directory
- **Failure**: Immediate test termination - no testing without proper setup

## Data Flow Rules

1. **No Mocking in Tests**: All test data comes from files in this directory
2. **Sequential Integration**: Tests run in dependency order:
   - CoinGecko (external) → Writers (populate) → Readers (consume)
3. **Real Data Only**: All fixtures come from actual API responses
4. **Setup Failures = Test Failures**: If setup fails, tests don't run

## Usage

```bash
# Phase 1: One-time data collection (manual/CI)
bun run test:setup:phase1

# Phase 2: Service validation (automatic before tests)
bun run test:setup:phase2

# Full test with setup
bun run test:integration:full
```