// Base Module

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

// types.ts
/**
 * @interface BaseMarketData
 * @description Base interface for all market data models
 * 
 * @property {string} exchange - Exchange identifier
 * @property {string} symbol - Trading pair symbol
 * @property {number} timestamp - Unix timestamp in milliseconds
 * 
 * @since 1.0.0
 */
interface BaseMarketData {}

// ohlcv.ts
/**
 * @interface OHLCV
 * @extends {BaseMarketData}
 * @description OHLCV (Open, High, Low, Close, Volume) candlestick data
 * 
 * @property {number} open - Opening price
 * @property {number} high - Highest price
 * @property {number} low - Lowest price
 * @property {number} close - Closing price
 * @property {number} volume - Trading volume in base currency
 * @property {number} [quoteVolume] - Trading volume in quote currency
 * @property {number} [trades] - Number of trades
 * 
 * @since 1.0.0
 */
interface OHLCV {}

// tick.ts
/**
 * @interface Tick
 * @extends {BaseMarketData}
 * @description Real-time market tick data
 * 
 * @property {number} price - Trade price
 * @property {number} quantity - Trade quantity
 * @property {'buy'|'sell'|'unknown'} side - Trade direction
 * 
 * @since 1.0.0
 */
interface Tick {}

// Sources Module (CryptoCompare)

/**
 * @fileoverview CryptoCompare API integration types and models
 * @module @qi/core/data/models/sources/cryptocompare
 * 
 * @description
 * Type definitions and domain models for CryptoCompare market data API integration.
 * Handles conversion between API responses and normalized domain models.
 * 
 * @example Import Models
 * ```typescript
 * import { CryptoCompareOHLCV, CryptoCompareTick } from '@qi/core/data/models/sources/cryptocompare';
 * ```
 * 
 * @author Zhifeng Zhang
 * @created 2024-12-07
 * @modified 2024-12-10
 * @version 1.0.0
 * @license MIT
 */

// types.ts
/**
 * @typedef {('MINUTE'|'HOUR'|'DAY')} TimeUnit
 * @description Time unit for OHLCV data intervals
 * @since 1.0.0
 */

/**
 * @typedef {('buy'|'sell'|'unknown')} TradeSide
 * @description Trade direction indicator
 * @since 1.0.0
 */

/**
 * @interface TradeBreakdown
 * @description Trade count statistics by direction
 * 
 * @property {number} buy - Number of buy trades
 * @property {number} sell - Number of sell trades
 * @property {number} unknown - Number of unknown direction trades
 * 
 * @since 1.0.0
 */
interface TradeBreakdown {}

// response.ts
/**
 * @interface CryptoCompareResponse<T>
 * @template T - Type of the response data payload
 * @description Generic wrapper for all API responses
 * 
 * @property {string} Response - Response status indicator
 * @property {string} [Message] - Optional status message
 * @property {T} Data - Response payload
 * @property {CryptoCompareResponseError} [Err] - Error information if present
 * 
 * @since 1.0.0
 */
interface CryptoCompareResponse<T> {}

// ohlcv.ts
/**
 * @class CryptoCompareOHLCV
 * @implements {OHLCV}
 * @description Domain model for CryptoCompare OHLCV data
 * 
 * @property {string} exchange - Exchange identifier
 * @property {string} symbol - Trading pair symbol
 * @property {number} timestamp - Unix timestamp in milliseconds
 * 
 * @method getTradeBreakdown - Returns trade statistics by direction
 * @method getVolumeBreakdown - Returns volume statistics by direction
 * @method getRawData - Returns the original API response data
 * 
 * @since 1.0.0
 */
class CryptoCompareOHLCV {}

// tick.ts
/**
 * @class CryptoCompareTick
 * @implements {Tick}
 * @description Domain model for CryptoCompare tick data
 * 
 * @property {string} exchange - Exchange identifier
 * @property {string} symbol - Trading pair symbol
 * @property {number} timestamp - Unix timestamp in milliseconds
 * 
 * @method getTimestampNs - Returns nanosecond precision timestamp
 * @method getQuoteQuantity - Returns trade quantity in quote currency
 * @method getSequence - Returns trade sequence number
 * @method getProcessedTrade - Returns normalized trade information
 * @method getRawData - Returns the original API response data
 * 
 * @since 1.0.0
 */
class CryptoCompareTick {}