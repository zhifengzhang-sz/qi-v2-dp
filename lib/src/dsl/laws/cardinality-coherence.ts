#!/usr/bin/env bun

/**
 * Law 6: Cardinality Coherence Law
 *
 * Single item operations should combine with single item operations
 * Batch operations should combine with batch operations
 * Mixed cardinality requires explicit transformation
 */

import type { Result } from "../../qicore/base/result";

/**
 * Cardinality Coherence Law Type
 */
export type CardinalityCoherenceLaw<R, W> = R extends (...args: any[]) => Promise<Result<any[]>> // Batch read
  ? W extends (data: any[], ...args: any[]) => Promise<Result<any>> // Batch write
    ? "BATCH_TO_BATCH"
    : "CARDINALITY_MISMATCH"
  : R extends (...args: any[]) => Promise<Result<any>> // Single read
    ? W extends (data: any, ...args: any[]) => Promise<Result<any>> // Single write
      ? "SINGLE_TO_SINGLE"
      : "CARDINALITY_MISMATCH"
    : "UNKNOWN_CARDINALITY";

/**
 * Validate cardinality coherence between read and write operations
 */
export function validateCardinalityCoherence<R, W>(
  readOp: R,
  writeOp: W,
): { coherent: boolean; type: string; issue?: string } {
  // This is a compile-time check, so we return a runtime approximation
  const readName = (readOp as any).name || "unknown";
  const writeName = (writeOp as any).name || "unknown";

  const isBatchRead = readName.includes("Batch") || readName.includes("Multiple");
  const isBatchWrite = writeName.includes("Batch") || writeName.includes("Multiple");

  if (isBatchRead && isBatchWrite) {
    return { coherent: true, type: "BATCH_TO_BATCH" };
  }

  if (!isBatchRead && !isBatchWrite) {
    return { coherent: true, type: "SINGLE_TO_SINGLE" };
  }

  return {
    coherent: false,
    type: "CARDINALITY_MISMATCH",
    issue: `Mixed cardinality: ${readName} (${isBatchRead ? "batch" : "single"}) with ${writeName} (${isBatchWrite ? "batch" : "single"})`,
  };
}
