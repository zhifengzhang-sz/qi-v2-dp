/**
 * @fileoverview Type guards and validation functions
 */

import { TimeInterval } from "../models/base/enums.js";
import { OHLCV } from "../models/base/ohlcv.js";

export function isValidTimeInterval(
  interval: string
): interval is TimeInterval {
  return ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w", "1M"].includes(
    interval
  );
}

export function isValidOHLCV(data: unknown): data is OHLCV {
  if (typeof data !== "object" || data === null) return false;

  const ohlcv = data as OHLCV;
  return (
    typeof ohlcv.timestamp === "number" &&
    typeof ohlcv.exchange === "string" &&
    typeof ohlcv.symbol === "string" &&
    typeof ohlcv.open === "number" &&
    typeof ohlcv.high === "number" &&
    typeof ohlcv.low === "number" &&
    typeof ohlcv.close === "number" &&
    typeof ohlcv.volume === "number" &&
    ohlcv.high >= ohlcv.low &&
    ohlcv.open >= ohlcv.low &&
    ohlcv.open <= ohlcv.high &&
    ohlcv.close >= ohlcv.low &&
    ohlcv.close <= ohlcv.high
  );
}
