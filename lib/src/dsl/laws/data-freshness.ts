#!/usr/bin/env bun

/**
 * Law 12: Data Freshness Law
 *
 * Current data operations should provide freshness guarantees
 * Historical data has fixed freshness (doesn't change)
 * Real-time operations must indicate data staleness
 */

/**
 * Data Freshness Law Type
 */
export type DataFreshnessLaw<TOperation> = TOperation extends
  | "getCurrentPrice"
  | "getCurrentPrices"
  | "getCurrentOHLCV"
  | "getLatestOHLCV"
  ? {
      readonly freshnessGuarantee: "CURRENT";
      readonly maxStaleness: "DEFINED";
      readonly realTimeIndicator: "REQUIRED";
    }
  : TOperation extends "getPriceHistory" | "getOHLCVByDateRange"
    ? {
        readonly freshnessGuarantee: "HISTORICAL";
        readonly immutable: true;
        readonly versionStable: true;
      }
    : "OPERATION_FRESHNESS_UNKNOWN";

/**
 * Freshness validation result
 */
export interface FreshnessResult {
  valid: boolean;
  staleness?: number; // in minutes
  reason?: string;
  category: "CURRENT" | "HISTORICAL" | "UNKNOWN";
}

/**
 * Validate data freshness based on operation type
 */
export function checkDataFreshness(
  operationName: string,
  data: any,
  maxStaleMinutes = 60,
): FreshnessResult {
  const isCurrentOperation =
    operationName.includes("getCurrent") ||
    operationName.includes("getLatest") ||
    operationName.includes("current");

  if (!isCurrentOperation) {
    // Historical data doesn't have freshness requirements
    return { valid: true, category: "HISTORICAL" };
  }

  const now = new Date();
  const dataTime = new Date(data?.lastUpdated || data?.timestamp);

  if (Number.isNaN(dataTime.getTime())) {
    return {
      valid: false,
      reason: "Missing or invalid timestamp",
      category: "CURRENT",
    };
  }

  const stalenessMinutes = (now.getTime() - dataTime.getTime()) / (1000 * 60);

  if (stalenessMinutes > maxStaleMinutes) {
    return {
      valid: false,
      staleness: stalenessMinutes,
      reason: `Data is ${stalenessMinutes.toFixed(1)} minutes old, max allowed is ${maxStaleMinutes}`,
      category: "CURRENT",
    };
  }

  return {
    valid: true,
    staleness: stalenessMinutes,
    category: "CURRENT",
  };
}

/**
 * Check if data is considered real-time
 */
export function isRealTimeData(data: any, maxLatencySeconds = 30): boolean {
  const now = new Date();
  const dataTime = new Date(data?.lastUpdated || data?.timestamp);

  if (Number.isNaN(dataTime.getTime())) {
    return false;
  }

  const latencySeconds = (now.getTime() - dataTime.getTime()) / 1000;
  return latencySeconds <= maxLatencySeconds;
}

/**
 * Get data age in different units
 */
export function getDataAge(data: any): {
  seconds: number;
  minutes: number;
  hours: number;
  isStale: boolean;
} {
  const now = new Date();
  const dataTime = new Date(data?.lastUpdated || data?.timestamp);

  if (Number.isNaN(dataTime.getTime())) {
    return {
      seconds: Number.POSITIVE_INFINITY,
      minutes: Number.POSITIVE_INFINITY,
      hours: Number.POSITIVE_INFINITY,
      isStale: true,
    };
  }

  const ageMs = now.getTime() - dataTime.getTime();
  const seconds = ageMs / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;

  return {
    seconds,
    minutes,
    hours,
    isStale: minutes > 60, // Consider stale after 1 hour
  };
}

/**
 * Validate freshness for different operation types
 */
export function validateOperationFreshness(
  operationType: "current" | "historical" | "realtime",
  data: any,
  requirements?: {
    maxStaleMinutes?: number;
    maxLatencySeconds?: number;
  },
): FreshnessResult {
  const { maxStaleMinutes = 60, maxLatencySeconds = 30 } = requirements || {};

  switch (operationType) {
    case "current": {
      return checkDataFreshness("getCurrentPrice", data, maxStaleMinutes);
    }
    case "realtime": {
      const isRealTime = isRealTimeData(data, maxLatencySeconds);
      return {
        valid: isRealTime,
        category: "CURRENT",
        reason: isRealTime ? undefined : `Data exceeds real-time latency of ${maxLatencySeconds}s`,
      };
    }
    case "historical": {
      return { valid: true, category: "HISTORICAL" };
    }
    default: {
      return {
        valid: false,
        category: "UNKNOWN",
        reason: "Unknown operation type",
      };
    }
  }
}

/**
 * Create freshness metadata
 */
export function createFreshnessMetadata(data: any) {
  const age = getDataAge(data);
  const isRealTime = isRealTimeData(data);

  return {
    timestamp: data?.lastUpdated || data?.timestamp,
    ageSeconds: age.seconds,
    ageMinutes: age.minutes,
    isStale: age.isStale,
    isRealTime,
    quality: age.isStale ? "STALE" : isRealTime ? "REAL_TIME" : "CURRENT",
  };
}
