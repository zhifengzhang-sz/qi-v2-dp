#!/usr/bin/env bun

/**
 * Law 10: Market Data Validation Law
 *
 * All market data must pass domain-specific validation rules
 * Prices must be positive, volumes non-negative, timestamps valid
 * OHLCV data must satisfy mathematical constraints (High >= Low, etc.)
 */

import type { CryptoMarketAnalytics, CryptoOHLCVData, CryptoPriceData } from "../MarketDataTypes";

/**
 * Market Data Validation Law Type
 */
export type MarketDataValidationLaw<TData> = TData extends CryptoPriceData
  ? {
      readonly pricePositive: "REQUIRED";
      readonly volumeNonNegative: "REQUIRED";
      readonly timestampValid: "REQUIRED";
      readonly symbolFormat: "STANDARD";
      readonly exchangeIdRequired: "REQUIRED";
    }
  : TData extends CryptoOHLCVData
    ? {
        readonly ohlcConstraints: "HIGH_GTE_LOW_AND_OPEN_CLOSE";
        readonly volumeNonNegative: "REQUIRED";
        readonly timestampValid: "REQUIRED";
        readonly timeframeConsistent: "REQUIRED";
        readonly exchangeIdRequired: "REQUIRED";
      }
    : TData extends CryptoMarketAnalytics
      ? {
          readonly marketCapPositive: "REQUIRED";
          readonly dominancePercentage: "BETWEEN_0_AND_100";
          readonly countsNonNegative: "REQUIRED";
        }
      : "UNKNOWN_DATA_TYPE";

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  violations: string[];
  warnings?: string[];
}

/**
 * Validate market data according to domain rules
 */
export function validateMarketData(data: any): ValidationResult {
  const violations: string[] = [];
  const warnings: string[] = [];

  // Common validations
  if (data?.usdPrice !== undefined && data.usdPrice <= 0) {
    violations.push("Price must be positive");
  }

  if (data?.volume !== undefined && data.volume < 0) {
    violations.push("Volume cannot be negative");
  }

  if (data?.timestamp && Number.isNaN(new Date(data.timestamp).getTime())) {
    violations.push("Invalid timestamp");
  }

  if (!data?.exchangeId) {
    violations.push("Exchange ID is required");
  }

  // Symbol format validation
  if (data?.symbol && !isValidSymbolFormat(data.symbol)) {
    violations.push("Invalid symbol format");
  }

  // OHLCV specific validations
  if (data?.high !== undefined && data?.low !== undefined && data.high < data.low) {
    violations.push("High price cannot be less than low price");
  }

  if (
    data?.open !== undefined &&
    data?.close !== undefined &&
    data?.high !== undefined &&
    data?.low !== undefined
  ) {
    if (data.open > data.high || data.open < data.low) {
      violations.push("Open price must be between high and low");
    }
    if (data.close > data.high || data.close < data.low) {
      violations.push("Close price must be between high and low");
    }
  }

  // Market analytics validations
  if (data?.marketCapUsd !== undefined && data.marketCapUsd <= 0) {
    violations.push("Market cap must be positive");
  }

  if (data?.dominancePercentage !== undefined) {
    if (data.dominancePercentage < 0 || data.dominancePercentage > 100) {
      violations.push("Dominance percentage must be between 0 and 100");
    }
  }

  // Volume warnings for extremely high values
  if (data?.volume !== undefined && data.volume > 1000000) {
    warnings.push("Unusually high volume detected");
  }

  // Price change warnings
  if (data?.change24h !== undefined && Math.abs(Number.parseFloat(data.change24h)) > 50) {
    warnings.push("Extreme price change detected (>50%)");
  }

  return {
    valid: violations.length === 0,
    violations,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate cryptocurrency symbol format
 */
function isValidSymbolFormat(symbol: string): boolean {
  // Basic crypto symbol format: 3-10 uppercase letters, optionally with dash
  const symbolRegex = /^[A-Z]{2,10}(-[A-Z]{2,10})?$/;
  return symbolRegex.test(symbol);
}

/**
 * Validate OHLCV data mathematical constraints
 */
export function validateOHLCVConstraints(ohlcv: {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}): ValidationResult {
  const violations: string[] = [];

  // High must be >= Low
  if (ohlcv.high < ohlcv.low) {
    violations.push("High must be greater than or equal to low");
  }

  // Open and Close must be between High and Low
  if (ohlcv.open > ohlcv.high || ohlcv.open < ohlcv.low) {
    violations.push("Open must be between high and low");
  }

  if (ohlcv.close > ohlcv.high || ohlcv.close < ohlcv.low) {
    violations.push("Close must be between high and low");
  }

  // Volume must be non-negative
  if (ohlcv.volume < 0) {
    violations.push("Volume cannot be negative");
  }

  // All prices must be positive
  if (ohlcv.open <= 0 || ohlcv.high <= 0 || ohlcv.low <= 0 || ohlcv.close <= 0) {
    violations.push("All prices must be positive");
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Validate price data
 */
export function validatePriceData(price: {
  usdPrice: number;
  volume?: number;
  timestamp: string;
  symbol: string;
  exchangeId: string;
}): ValidationResult {
  const violations: string[] = [];

  if (price.usdPrice <= 0) {
    violations.push("Price must be positive");
  }

  if (price.volume !== undefined && price.volume < 0) {
    violations.push("Volume cannot be negative");
  }

  if (Number.isNaN(new Date(price.timestamp).getTime())) {
    violations.push("Invalid timestamp");
  }

  if (!isValidSymbolFormat(price.symbol)) {
    violations.push("Invalid symbol format");
  }

  if (!price.exchangeId) {
    violations.push("Exchange ID is required");
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
