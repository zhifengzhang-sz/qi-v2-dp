#!/usr/bin/env bun

/**
 * QiCore Crypto Data Platform - Library Exports
 *
 * Production-ready cryptocurrency data processing platform
 * with DSL-driven 2-layer actor architecture
 */

// =============================================================================
// CORE FRAMEWORK
// =============================================================================
export * from "./qicore";

// =============================================================================
// LAYER 2: DSL (Domain Specific Language)
// =============================================================================
// Data types and interfaces
export * from "./dsl";

// DSL Laws
export * from "./dsl/laws";

// =============================================================================
// LAYER 2: ACTORS
// =============================================================================
// Abstract base classes
export { BaseReader } from "./actors/abstract/readers/BaseReader";
export { BaseWriter } from "./actors/abstract/writers/BaseWriter";

// Source actors (readers)
export * from "./actors/sources/coingecko";
export * from "./actors/sources/redpanda";
// TODO: Export when fully implemented
// export * from "./actors/sources/timescale-mcp";
// export * from "./actors/sources/redpanda-mcp";

// Target actors (writers)
export * from "./actors/targets/redpanda";
export * from "./actors/targets/timescale";
// TODO: Export when implemented
// export * from "./actors/targets/timescale-mcp";
// export * from "./actors/targets/redpanda-mcp";

// =============================================================================
// LAYER 1: BASE INFRASTRUCTURE
// =============================================================================
// Database infrastructure
export * from "./base/database";

// Streaming infrastructure
export * from "./base/streaming";

// =============================================================================
// GENERATORS
// =============================================================================
export { generateTimescaleSchema } from "./generators/schema-generator";
export {
  generateRedpandaTopicConfig,
  generateJsonSchemas,
  generateTopicMappings,
  generateRedpandaConfigFiles,
} from "./generators/redpanda-schema-generator";

// =============================================================================
// TYPE EXPORTS
// =============================================================================
export type {
  // DSL types
  CryptoPriceData,
  CryptoOHLCVData,
  CryptoMarketAnalytics,
  Level1Data,
  CurrentPricesOptions,
  DateRangeOHLCVQuery,
  Level1Query,
  MarketDataReadingDSL,
  MarketDataWritingDSL,
  PublishOptions,
  PublishResult,
  BatchPublishOptions,
  BatchPublishResult,
  ClientConfig,
  ClientAssociation,
} from "./dsl";

export type {
  // Law types
  TypeCoherenceLaw,
  ErrorPropagationLaw,
  DataFlowLaw,
  TemporalLaw,
  DSLCompatibilityLaw,
  DSLCombinationLaw,
  DSLCombinator,
} from "./dsl/laws";

export type {
  // Result types
  ResultType as Result,
  QiError,
} from "./qicore/base";
