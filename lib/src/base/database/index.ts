// lib/src/database/index.ts
export { TimescaleClient } from './timescale-client';

// Drizzle ORM exports
export { DrizzleClient } from './drizzle-client';
export { CryptoFinancialDSL } from './crypto-dsl';
export * from './schema';

// Re-export types for convenience
export type {
  TimeSeriesQueryOptions,
  DrizzleClientConfig,
} from './drizzle-client';

export type {
  PriceDataInput,
  OHLCVInput,
  MarketAnalyticsInput,
  PriceQuery,
  OHLCVQuery,
  TechnicalAnalysis,
  MarketSummary,
} from './crypto-dsl';