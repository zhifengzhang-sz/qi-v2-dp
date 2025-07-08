#!/usr/bin/env bun

/**
 * Law 8: Attribution Preservation Law
 *
 * All market data must maintain source attribution throughout the pipeline
 * Combinations cannot lose or corrupt attribution information
 * Attribution must be traceable from source to sink
 */

/**
 * Attribution Preservation Law Type
 */
export type AttributionPreservationLaw<TData> = TData extends {
  source: string;
  exchangeId: string;
  lastUpdated: string;
}
  ? {
      readonly sourcePreserved: true;
      readonly attributionMaintained: true;
      readonly traceability: "FULL";
      readonly compliant: true;
    }
  : {
      readonly violation: "MISSING_ATTRIBUTION";
      readonly compliant: false;
    };

/**
 * Required attribution fields for market data
 */
export interface MarketDataAttribution {
  source: string;
  exchangeId: string;
  lastUpdated: string;
  dataProvider?: string;
  apiVersion?: string;
}

/**
 * Validate that market data has proper attribution
 */
export function validateAttribution(data: any): { valid: boolean; missing?: string[] } {
  const missing: string[] = [];

  if (!data?.source) missing.push("source");
  if (!data?.exchangeId) missing.push("exchangeId");
  if (!data?.lastUpdated) missing.push("lastUpdated");

  return {
    valid: missing.length === 0,
    missing: missing.length > 0 ? missing : undefined,
  };
}

/**
 * Ensure attribution is preserved during data transformation
 */
export function preserveAttribution<TSource, TTarget>(
  sourceData: TSource & Partial<MarketDataAttribution>,
  targetData: TTarget,
): TTarget & MarketDataAttribution {
  const attribution: MarketDataAttribution = {
    source: sourceData.source || "unknown",
    exchangeId: sourceData.exchangeId || "unknown",
    lastUpdated: sourceData.lastUpdated || new Date().toISOString(),
    dataProvider: sourceData.dataProvider,
    apiVersion: sourceData.apiVersion,
  };

  return { ...targetData, ...attribution };
}

/**
 * Create attribution metadata for new data
 */
export function createAttribution(
  source: string,
  exchangeId: string,
  dataProvider?: string,
  apiVersion?: string,
): MarketDataAttribution {
  return {
    source,
    exchangeId,
    lastUpdated: new Date().toISOString(),
    dataProvider,
    apiVersion,
  };
}

/**
 * Validate attribution chain through pipeline
 */
export function validateAttributionChain(dataItems: Array<Partial<MarketDataAttribution>>): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  for (const [index, item] of dataItems.entries()) {
    const validation = validateAttribution(item);
    if (!validation.valid) {
      issues.push(`Item ${index}: missing ${validation.missing?.join(", ")}`);
    }
  }

  // Check for consistent source attribution
  const sources = new Set(dataItems.map((item) => item.source).filter(Boolean));
  if (sources.size > 1) {
    issues.push(`Inconsistent sources: ${Array.from(sources).join(", ")}`);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
