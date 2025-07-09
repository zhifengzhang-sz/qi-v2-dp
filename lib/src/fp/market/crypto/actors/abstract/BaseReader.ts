#!/usr/bin/env bun

/**
 * Generic Base Reader - No Lifecycle Management
 *
 * Base class for generic actors that manage their own clients directly.
 * Provides DSL workflow and handler contracts.
 * Concrete classes handle their own HTTP clients, database pools, etc.
 */

import {
  type ResultType as Result,
  createQiError,
  failure,
  success,
} from "@qi/core/base";
import type {
  FPActorLifecycle,
  FPMarketDataReader,
  Level1,
  MarketContext,
  OHLCV,
  Price,
} from "@qi/fp/dsl";

// =============================================================================
// GENERIC BASE READER - NO LIFECYCLE MANAGEMENT
// =============================================================================

export abstract class BaseReader implements FPMarketDataReader, FPActorLifecycle {
  protected totalQueries = 0;
  protected errorCount = 0;
  protected lastActivity?: Date;

  constructor(protected config: { name: string; debug?: boolean }) {}

  // =============================================================================
  // DSL WORKFLOW METHODS - IMPLEMENTED IN BASE CLASS
  // =============================================================================

  /**
   * Get price data for a specific market context
   */
  async getPrice(context: MarketContext): Promise<Result<Price>> {
    try {
      this.updateActivity();
      const result = await this.getPriceHandler(context);
      return success(result);
    } catch (error) {
      this.incrementErrors();
      return failure(
        createQiError(
          "GET_PRICE_FAILED",
          `Failed to get price for ${context.symbol.ticker}: ${error}`,
          "BUSINESS",
          { context, error },
        ),
      );
    }
  }

  /**
   * Get OHLCV data for a specific market context and timeframe
   */
  async getOHLCV(context: MarketContext, timeframe: string): Promise<Result<OHLCV>> {
    try {
      this.updateActivity();
      const result = await this.getOHLCVHandler(context, timeframe);
      return success(result);
    } catch (error) {
      this.incrementErrors();
      return failure(
        createQiError(
          "GET_OHLCV_FAILED",
          `Failed to get OHLCV for ${context.symbol.ticker}: ${error}`,
          "BUSINESS",
          { context, timeframe, error },
        ),
      );
    }
  }

  /**
   * Get Level1 data for a specific market context
   */
  async getLevel1(context: MarketContext): Promise<Result<Level1>> {
    try {
      this.updateActivity();
      const result = await this.getLevel1Handler(context);
      return success(result);
    } catch (error) {
      this.incrementErrors();
      return failure(
        createQiError(
          "GET_LEVEL1_FAILED",
          `Failed to get Level1 for ${context.symbol.ticker}: ${error}`,
          "BUSINESS",
          { context, error },
        ),
      );
    }
  }

  // =============================================================================
  // HANDLER CONTRACTS - CONCRETE CLASSES MUST IMPLEMENT
  // =============================================================================

  protected abstract getPriceHandler(context: MarketContext): Promise<Price>;
  protected abstract getOHLCVHandler(context: MarketContext, timeframe: string): Promise<OHLCV>;
  protected abstract getLevel1Handler(context: MarketContext): Promise<Level1>;

  // =============================================================================
  // LIFECYCLE METHODS - CONCRETE CLASSES MUST IMPLEMENT
  // =============================================================================

  // Generic actors manage their own clients, so they must implement lifecycle
  abstract initialize(): Promise<Result<void>>;
  abstract cleanup(): Promise<Result<void>>;
  abstract getStatus(): object;

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  protected updateActivity(): void {
    this.totalQueries++;
    this.lastActivity = new Date();
  }

  protected incrementErrors(): void {
    this.errorCount++;
  }
}
