#!/usr/bin/env bun

/**
 * TimescaleDB Market Data Publisher - Unified Export
 *
 * This module exports the TimescaleDB writer implementation
 * that extends the unified DSL foundation.
 */

export {
  TimescaleMarketDataWriter,
  createTimescaleMarketDataWriter,
} from "./TimescaleMarketDataWriter";
export type { TimescaleWriterConfig } from "./TimescaleMarketDataWriter";

// Export unified types from DSL abstraction
export type {
  PublishOptions,
  BatchPublishOptions,
  PublishResult,
  BatchPublishResult,
  CryptoPriceData,
  CryptoOHLCVData,
  CryptoMarketAnalytics,
  Level1Data,
} from "../../abstract/dsl";
