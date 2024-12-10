# Project Source Code Documentation

## base

### enums.ts

```typescript
/**
 * Time intervals for market data queries.
 * Represents standardized time periods for OHLCV data.
 *
 * @typedef {string} TimeInterval
 *
 * Available intervals:
 * - Minutes: "1m", "5m", "15m", "30m"
 * - Hours: "1h", "4h"
 * - Days/Weeks/Months: "1d", "1w", "1M"
 *
 * @example
 * ```typescript
 * const interval: TimeInterval = "15m";
 * const dailyInterval: TimeInterval = "1d";
 * ```
 */
export type TimeInterval =
  | "1m"
  | "5m"
  | "15m"
  | "30m" // Minutes
  | "1h"
  | "4h" // Hours
  | "1d"
  | "1w"
  | "1M"; // Days/Weeks/Months

```

### index.ts

```typescript
/**
 * @fileoverview Base market data type definitions and interfaces
 * @module @qi/core/data/models/base
 *
 * @description
 * Core market data model types and interfaces used throughout the system for data representation.
 * Provides foundational data structures that all market data implementations must follow.
 *
 * @example Import Types
 * ```typescript
 * import { BaseMarketData, OHLCV, Tick } from '@qi/core/data/models/base';
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-12-07
 * @modified 2024-12-10
 * @version 1.0.0
 * @license MIT
 */

export { BaseMarketData } from "./types.js";
export { TimeInterval } from "./enums.js";
export { OHLCV } from "./ohlcv.js";
export { Tick } from "./tick.js";

```

### ohlcv.ts

```typescript
import { BaseMarketData } from "./types.js";

/**
 * OHLCV (Open, High, Low, Close, Volume) candlestick data.
 * Represents price and volume data for a specific time period.
 *
 * @interface OHLCV
 * @extends {BaseMarketData}
 *
 * @property {number} open - Opening price of the period
 * @property {number} high - Highest price during the period
 * @property {number} low - Lowest price during the period
 * @property {number} close - Closing price of the period
 * @property {number} volume - Trading volume in base currency
 * @property {number} [quoteVolume] - Optional trading volume in quote currency
 * @property {number} [trades] - Optional number of trades in the period
 *
 * @example
 * ```typescript
 * const ohlcv: OHLCV = {
 *   exchange: "kraken",
 *   symbol: "BTC-USD",
 *   timestamp: 1701936000000,
 *   open: 43250.5,
 *   high: 43500.0,
 *   low: 43100.0,
 *   close: 43300.5,
 *   volume: 123.45,
 *   quoteVolume: 5342917.25,
 *   trades: 1250
 * };
 * ```
 */
export interface OHLCV extends BaseMarketData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume?: number;
  trades?: number;
}

```

### tick.ts

```typescript
import { BaseMarketData } from "./types.js";

/**
 * @interface Tick
 * @extends {BaseMarketData}
 * @description Real-time market tick data
 *
 * @property {number} price - Trade price
 * @property {number} quantity - Trade quantity
 * @property {'buy'|'sell'|'unknown'} side - Trade direction
 */
export interface Tick extends BaseMarketData {
  price: number;
  quantity: number;
  side: "buy" | "sell" | "unknown";
}

```

### types.ts

```typescript
/**
 * @fileoverview Base market data type definitions and interfaces
 * @module @qi/core/data/models/base
 *
 * @description
 * Core market data model types and interfaces used throughout the system for data representation.
 * Provides foundational data structures that all market data implementations must follow.
 *
 * @example Import Types
 * ```typescript
 * import { BaseMarketData, OHLCV, Tick } from '@qi/core/data/models/base';
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-12-07
 * @modified 2024-12-10
 */

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

