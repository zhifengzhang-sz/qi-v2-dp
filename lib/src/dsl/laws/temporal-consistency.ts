#!/usr/bin/env bun

/**
 * Law 7: Temporal Consistency Law
 *
 * Market data operations must respect temporal ordering and constraints
 * Historical data cannot be newer than current data
 * Date range operations must have valid start/end relationships
 */

/**
 * Temporal Consistency Law Type
 */
export type TemporalConsistencyLaw = {
  readonly historicalDataRule: "PAST_ONLY";
  readonly currentDataRule: "LATEST_AVAILABLE";
  readonly dateRangeRule: "START_BEFORE_END";
  readonly freshnessRule: "DECREASING_WITH_TIME";
};

/**
 * Validate temporal consistency for market data operations
 */
export function validateTemporalConsistency(
  startDate?: Date,
  endDate?: Date,
  dataTimestamp?: Date,
): { valid: boolean; violation?: string } {
  const now = new Date();

  // Historical data cannot be in the future
  if (dataTimestamp && dataTimestamp > now) {
    return { valid: false, violation: "FUTURE_HISTORICAL_DATA" };
  }

  // Date range must have start before end
  if (startDate && endDate && startDate >= endDate) {
    return { valid: false, violation: "INVALID_DATE_RANGE" };
  }

  // End date cannot be in the future for historical queries
  if (endDate && endDate > now) {
    return { valid: false, violation: "FUTURE_END_DATE" };
  }

  return { valid: true };
}

/**
 * Check if data timestamp is reasonable for historical data
 */
export function isValidHistoricalTimestamp(timestamp: Date): boolean {
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  // Historical data should be between 1 year ago and now
  return timestamp >= oneYearAgo && timestamp <= now;
}

/**
 * Validate date range for market data queries
 */
export function validateDateRange(
  startDate: Date,
  endDate: Date,
): { valid: boolean; issue?: string } {
  if (startDate >= endDate) {
    return { valid: false, issue: "Start date must be before end date" };
  }

  const now = new Date();
  if (endDate > now) {
    return { valid: false, issue: "End date cannot be in the future" };
  }

  const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
  if (endDate.getTime() - startDate.getTime() > maxRange) {
    return { valid: false, issue: "Date range cannot exceed 1 year" };
  }

  return { valid: true };
}
