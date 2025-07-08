# TimescaleDB Compression Policies Setup

## Problem
Currently getting warnings:
```
Warning: Could not add compression policy for crypto_prices: columnstore not enabled on hypertable "crypto_prices"
```

## Root Cause
TimescaleDB compression requires:
1. **Columnar compression enabled** in TimescaleDB configuration
2. **Appropriate compression settings** for financial time-series data
3. **Proper chunk intervals** for optimal compression

## Proposed Solution

### Option 1: Enable Compression in Docker (Recommended)
Update `services/docker-compose.yml`:

```yaml
timescaledb:
  image: timescale/timescaledb:latest-pg16
  environment:
    POSTGRES_DB: cryptodb
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: password
    # Enable compression features
    TIMESCALEDB_TELEMETRY: off
    # Configure shared_preload_libraries for compression
  command: >
    postgres 
    -c shared_preload_libraries=timescaledb
    -c timescaledb.enable_optimizations=on
    -c timescaledb.enable_transparent_decompression=on
    -c max_worker_processes=16
```

### Option 2: Update Schema Generator for Smart Compression
Modify `lib/src/generators/schema-generator.ts`:

```typescript
export function generateTimescaleSchema(): string {
  return `-- TimescaleDB Schema Generated from DSL Types
-- Source: lib/src/abstract/dsl/MarketDataTypes.ts

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Configure compression settings
ALTER SYSTEM SET timescaledb.enable_optimizations = 'on';
ALTER SYSTEM SET timescaledb.enable_transparent_decompression = 'on';
SELECT pg_reload_conf();

-- [Tables and hypertables...]

-- Enable compression with appropriate settings for financial data
SELECT add_compression_policy('crypto_prices', INTERVAL '7 days', 
  orderby_desc => 'time', 
  orderby_asc => 'coin_id'
);

-- Retention policies for data lifecycle management
SELECT add_retention_policy('crypto_prices', INTERVAL '2 years');
`;
}
```

### Option 3: Conditional Compression in DrizzleClient
Update `lib/src/base/database/drizzle-client.ts`:

```typescript
private async setupCompressionPolicies(): Promise<void> {
  // Check if compression is available
  const compressionCheck = await this.db.execute(sql.raw(`
    SELECT current_setting('timescaledb.enable_optimizations') as enabled;
  `));
  
  if (compressionCheck[0]?.enabled !== 'on') {
    console.log('ℹ️ TimescaleDB compression not enabled, skipping compression policies');
    return;
  }

  // Apply compression policies with financial data optimization
  const policies = [
    { 
      table: "crypto_prices", 
      interval: "7 days",
      orderBy: "time DESC, coin_id ASC" 
    },
    // ... other policies
  ];

  for (const policy of policies) {
    try {
      await this.db.execute(sql.raw(`
        SELECT add_compression_policy('${policy.table}', 
          INTERVAL '${policy.interval}',
          orderby => '${policy.orderBy}'
        );
      `));
    } catch (error: any) {
      if (!error.message?.includes('already exists')) {
        console.warn(`⚠️ Compression policy for ${policy.table}:`, error.message);
      }
    }
  }
}
```

## Recommendation
**Use Option 1 + Option 3**: Update Docker configuration for proper TimescaleDB setup, plus add intelligent compression checking in the DrizzleClient.

This provides:
- ✅ Proper TimescaleDB configuration for production
- ✅ Graceful fallback when compression unavailable  
- ✅ Optimized compression for financial time-series data
- ✅ Clear logging about compression status