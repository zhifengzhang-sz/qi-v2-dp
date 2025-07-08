#!/usr/bin/env bun

/**
 * Layer 2 DSL Laws
 *
 * Export all laws that govern the behavior of Layer 2 DSL actors
 */

// Core Laws (1-5)
export * from "./combinator";

// Additional Laws (6-13)
export * from "./cardinality-coherence";
export * from "./temporal-consistency";
export * from "./attribution-preservation";
export * from "./market-data-validation";
export * from "./data-freshness";

// Future laws can be added here:
// export * from "./idempotency";
// export * from "./resource-conservation";
// export * from "./aggregation-coherence";
// export * from "./monad";
// export * from "./functor";
// export * from "./applicative";
