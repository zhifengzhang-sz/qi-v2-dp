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
 * @modified 2024-12-11
 * @version 1.0.0
 * @license MIT
 */

export { BaseMarketData } from "./types.js";
export { TimeInterval } from "./enums.js";
export { OHLCV } from "./ohlcv.js";
export { Tick } from "./tick.js";
