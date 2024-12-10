<blockquote>

`refactor.md` is the context we need to work on, and `issue.md` is the background material. the `qi/core` base information is also attached. This is the first chat planned in the `refactor.md`

Note: `docs/qi/core/qi.core.base.md` is attached.
</blockquote>

---

Let's start with refactoring the base types by separating the concerns. I'll first analyze what should go where:

1. Keep in `data/models/base/types.ts`:
- `BaseMarketData` interface - this is core to our domain model
- `TimeInterval` import - this is about data structure
- `OHLCV` import - this is about data structure

2. Move to `data/access/`:
- `MarketDataQuery` - this is about data retrieval
- `ProviderConfig` - this is about provider configuration
- `IMarketDataProvider` - this is the provider interface

Let me propose the new structure:



```typescript
/**
 * @fileoverview Base market data type definitions
 * @module @qi/core/data/models/base/types
 *
 * @description
 * Core type definitions for market data structures. These types represent
 * the fundamental data models used throughout the system and by external
 * consumers. The module focuses purely on data structure definitions,
 * separating concerns from data access and provider implementations.
 *
 * @example Import Types
 * ```typescript
 * import { BaseMarketData } from '@qi/core/data/models/base/types';
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-12-07
 * @modified 2024-12-10
 */

import { TimeInterval } from "./enums.js";
import { OHLCV } from "./ohlcv.js";

/**
 * Base interface for all market data.
 * Provides common fields that all market data types must implement.
 *
 * @interface BaseMarketData
 *
 * @property {string} exchange - Exchange identifier (e.g., "binance", "kraken")
 * @property {string} symbol - Trading pair symbol (e.g., "BTC-USD", "ETH-USDT")
 * @property {number} timestamp - Unix timestamp in milliseconds
 *
 * @example
 * ```typescript
 * const marketData: BaseMarketData = {
 *   exchange: "kraken",
 *   symbol: "BTC-USD",
 *   timestamp: Date.now()
 * };
 * ```
 */
export interface BaseMarketData {
  exchange: string;
  symbol: string;
  timestamp: number;
}

```



```typescript
/**
 * @fileoverview Market data access type definitions
 * @module @qi/core/data/access/types
 *
 * @description
 * Type definitions for market data access patterns, including query parameters
 * and provider interfaces. These types handle the data access layer concerns,
 * separated from the core data models.
 *
 * @example Import Types
 * ```typescript
 * import {
 *   MarketDataQuery,
 *   IMarketDataProvider
 * } from '@qi/core/data/access/types';
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-12-10
 */

import { TimeInterval } from "../models/base/enums.js";
import { OHLCV } from "../models/base/ohlcv.js";

/**
 * Market data query parameters.
 * Used to request historical market data from providers.
 *
 * @interface MarketDataQuery
 *
 * @property {string} exchange - Exchange to query
 * @property {string} symbol - Symbol to query (e.g., "BTC-USD")
 * @property {TimeInterval} interval - Time interval for the data
 * @property {number} [start] - Optional start timestamp in milliseconds
 * @property {number} [end] - Optional end timestamp in milliseconds
 * @property {number} [limit] - Optional maximum number of results
 *
 * @example
 * ```typescript
 * const query: MarketDataQuery = {
 *   exchange: "kraken",
 *   symbol: "BTC-USD",
 *   interval: "15m",
 *   start: Date.now() - 24 * 60 * 60 * 1000, // 24 hours ago
 *   end: Date.now(),
 *   limit: 100
 * };
 * ```
 */
export interface MarketDataQuery {
  exchange: string;
  symbol: string;
  interval: TimeInterval;
  start?: number;
  end?: number;
  limit?: number;
}

/**
 * Provider configuration options.
 * Defines the configuration required for a market data provider.
 *
 * @interface ProviderConfig
 *
 * @property {string} type - Provider identifier (e.g., "cryptocompare", "twelvedata")
 * @property {string} version - Provider API version
 * @property {string} [baseUrl] - Optional base URL override for API endpoints
 * @property {string} apiKey - API authentication key
 * @property {Object} rateLimit - Rate limiting configuration
 * @property {number} rateLimit.requestsPerSecond - Maximum requests per second
 * @property {number} [rateLimit.requestsPerHour] - Optional maximum requests per hour
 *
 * @example
 * ```typescript
 * const config: ProviderConfig = {
 *   type: "cryptocompare",
 *   version: "1.0",
 *   apiKey: "your-api-key",
 *   baseUrl: "https://custom.api.endpoint",
 *   rateLimit: {
 *     requestsPerSecond: 10,
 *     requestsPerHour: 10000
 *   }
 * };
 * ```
 */
export interface ProviderConfig {
  type: string;
  version: string;
  baseUrl?: string;
  apiKey: string;
  rateLimit: {
    requestsPerSecond: number;
    requestsPerHour?: number;
  };
}

/**
 * Market data provider interface.
 * Defines the required methods that all market data providers must implement.
 *
 * @interface IMarketDataProvider
 *
 * @example
 * ```typescript
 * class CryptoCompareProvider implements IMarketDataProvider {
 *   async getOHLCV(query: MarketDataQuery): Promise<OHLCV[]> {
 *     // Implementation
 *   }
 *
 *   supportsExchange(exchange: string): boolean {
 *     // Implementation
 *   }
 *
 *   async getSupportedExchanges(): Promise<string[]> {
 *     // Implementation
 *   }
 *
 *   async getSupportedSymbols(exchange: string): Promise<string[]> {
 *     // Implementation
 *   }
 * }
 * ```
 */
export interface IMarketDataProvider {
  /**
   * Get historical OHLCV data based on query parameters.
   *
   * @param {MarketDataQuery} query - Query parameters for historical data
   * @returns {Promise<OHLCV[]>} Array of OHLCV data points
   * @throws {MarketDataError} If the query fails or returns invalid data
   */
  getOHLCV(query: MarketDataQuery): Promise<OHLCV[]>;

  /**
   * Check if provider supports a given exchange.
   *
   * @param {string} exchange - Exchange identifier to check
   * @returns {boolean} True if the exchange is supported
   */
  supportsExchange(exchange: string): boolean;

  /**
   * Get list of all supported exchanges.
   *
   * @returns {Promise<string[]>} Array of supported exchange identifiers
   */
  getSupportedExchanges(): Promise<string[]>;

  /**
   * Get supported trading pairs for a specific exchange.
   *
   * @param {string} exchange - Exchange to get symbols for
   * @returns {Promise<string[]>} Array of supported trading pair symbols
   * @throws {MarketDataError} If the exchange is not supported
   */
  getSupportedSymbols(exchange: string): Promise<string[]>;
}

```

Key changes made:

1. Separated concerns:
   - Core data model types remain in `models/base/types.ts`
   - Access-related types moved to `access/types.ts`

2. Improved organization:
   - Base data structures are now focused solely on data representation
   - Provider and query interfaces are grouped with other access patterns

3. Updated imports and paths:
   - Adjusted relative paths for imports
   - Maintained existing type relationships

4. Maintained documentation:
   - Preserved comprehensive JSDoc comments
   - Updated module descriptions to reflect new responsibilities
   - Kept examples for clarity

Would you like me to:
1. Show where to create these files in the project structure?
2. Add any additional types to either module?
3. Create index files for these directories?

---

