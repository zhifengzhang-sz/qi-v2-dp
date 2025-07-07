# Development Commands for Implemented Files

This document contains the specific commands for checking the files implemented in this session.

## Files Implemented
- `src/publishers/targets/redpanda/MarketDataWriter.ts` - RedpandaMarketDataWriter with real RedpandaClient infrastructure
- `src/consumers/sources/redpanda/MarketDataReader.ts` - RedpandaMarketDataReader (updated imports)
- `src/publishers/sources/coingecko/MarketDataReader.ts` - Renamed from CoinGeckoReader.ts

## TypeScript Check

Due to TypeScript path alias requirements (`@qi/core/base`), use the project's shell script workarounds:

```bash
# From lib/ directory - Check all implemented files
./scripts/check-file.sh src/publishers/targets/redpanda/MarketDataWriter.ts src/consumers/sources/redpanda/MarketDataReader.ts src/publishers/sources/coingecko/MarketDataReader.ts

# From lib/ directory - Check individual files (if npm scripts still work)
bun run lib:typecheck:file src/publishers/targets/redpanda/MarketDataWriter.ts
bun run lib:typecheck:file src/consumers/sources/redpanda/MarketDataReader.ts
bun run lib:typecheck:file src/publishers/sources/coingecko/MarketDataReader.ts

# From root directory - Check individual files
./lib/scripts/check-single-file.sh lib/src/publishers/targets/redpanda/MarketDataWriter.ts
./lib/scripts/check-single-file.sh lib/src/consumers/sources/redpanda/MarketDataReader.ts
./lib/scripts/check-single-file.sh lib/src/publishers/sources/coingecko/MarketDataReader.ts
```

**Note:** Direct `bun tsc --noEmit` doesn't work due to path alias configuration (`@qi/core/base` imports).

## Biome Lint and Format

```bash
# Check all implemented files
bun run biome check src/publishers/targets/redpanda/MarketDataWriter.ts src/consumers/sources/redpanda/MarketDataReader.ts src/publishers/sources/coingecko/MarketDataReader.ts

# Fix issues in all implemented files
bun run biome check --fix src/publishers/targets/redpanda/MarketDataWriter.ts src/consumers/sources/redpanda/MarketDataReader.ts src/publishers/sources/coingecko/MarketDataReader.ts

# Check individual files
bun run biome check src/publishers/targets/redpanda/MarketDataWriter.ts
bun run biome check src/consumers/sources/redpanda/MarketDataReader.ts
bun run biome check src/publishers/sources/coingecko/MarketDataReader.ts

# Fix individual files
bun run biome check --fix src/publishers/targets/redpanda/MarketDataWriter.ts
bun run biome check --fix src/consumers/sources/redpanda/MarketDataReader.ts
bun run biome check --fix src/publishers/sources/coingecko/MarketDataReader.ts
```

## Unit Tests

Note: No specific unit tests exist for the implemented files. The files were implemented as core library components without accompanying test files.

```bash
# Run general project tests (not specific to implemented files)
bun test

# If unit tests existed for the implemented files, they would be run with:
# bun test src/publishers/targets/redpanda/MarketDataWriter.test.ts
# bun test src/consumers/sources/redpanda/MarketDataReader.test.ts  
# bun test src/publishers/sources/coingecko/MarketDataReader.test.ts
```

## Status Summary

✅ **TypeScript Check**: All files pass without errors
✅ **Biome Clean**: All files are properly formatted and linted
❌ **Unit Tests**: No specific unit tests exist for the implemented files

## Key Implementation Details

1. **MarketDataWriter**: Updated to use real RedpandaClient infrastructure instead of mock handlers
2. **MarketDataReader**: Updated import paths to use correct qicore base imports
3. **CoinGecko Reader**: Renamed to MarketDataReader.ts for consistency and updated class name to CoinGeckoMarketDataReader

All implementations follow the TRUE Actor pattern and use functional error handling with Result<T> types.