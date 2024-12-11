/**
 * @fileoverview
 * @module enums.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-11
 * @modified 2024-12-11
 */

// data/models/base/enums.ts

/**
 * Standardized time intervals for market data queries
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

/**
 * Maps TimeInterval to CryptoCompare TimeUnit and interval value
 * @param interval TimeInterval to convert
 * @returns [unit, value] tuple for CryptoCompare API
 */
export function mapTimeInterval(interval: TimeInterval): [string, number] {
  switch (interval) {
    case "1m":
      return ["MINUTE", 1];
    case "5m":
      return ["MINUTE", 5];
    case "15m":
      return ["MINUTE", 15];
    case "30m":
      return ["MINUTE", 30];
    case "1h":
      return ["HOUR", 1];
    case "4h":
      return ["HOUR", 4];
    case "1d":
      return ["DAY", 1];
    case "1w":
      return ["DAY", 7];
    case "1M":
      return ["DAY", 30];
    default:
      throw new Error(`Unsupported time interval: ${interval}`);
  }
}

/**
 * Maps CryptoCompare TimeUnit and value back to TimeInterval
 * @param unit CryptoCompare TimeUnit
 * @param value Interval value
 * @returns Corresponding TimeInterval
 */
export function mapTimeUnit(unit: string, value: number): TimeInterval {
  const key = `${unit}_${value}`;
  switch (key) {
    case "MINUTE_1":
      return "1m";
    case "MINUTE_5":
      return "5m";
    case "MINUTE_15":
      return "15m";
    case "MINUTE_30":
      return "30m";
    case "HOUR_1":
      return "1h";
    case "HOUR_4":
      return "4h";
    case "DAY_1":
      return "1d";
    case "DAY_7":
      return "1w";
    case "DAY_30":
      return "1M";
    default:
      throw new Error(`Unsupported time unit combination: ${unit}_${value}`);
  }
}
