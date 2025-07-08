#!/usr/bin/env bun

/**
 * Base Market Data Reader - Unified DSL Foundation
 *
 * Supports both patterns:
 * - Actor Pattern (composition): DSL + associates with clients (≥0)
 * - MCP Actor Pattern (inheritance): IS a client + DSL
 *
 * This abstract class:
 * - Provides unified DSL abstraction for ALL data sources
 * - Manages client associations via composition OR inheritance
 * - Uses qicore Result<T> for functional error handling
 * - Works with MCP, Kafka, Database, Files, APIs, etc.
 */

import type { ResultType as Result } from "@qi/core/base";
import { createQiError, failure, success } from "@qi/core/base";
import type {
  ClientAssociation,
  ClientConfig,
  CryptoMarketAnalytics,
  CryptoOHLCVData,
  CryptoPriceData,
  CurrentPricesOptions,
  DateRangeOHLCVQuery,
  Level1Data,
  Level1Query,
  MarketDataReadingDSL,
} from "../../../dsl";

// Re-export types from DSL for backward compatibility
export type {
  ClientAssociation,
  ClientConfig,
  CryptoPriceData,
  CryptoOHLCVData,
  CryptoMarketAnalytics,
  Level1Data,
  CurrentPricesOptions,
  DateRangeOHLCVQuery,
  Level1Query,
} from "../../../dsl";

// =============================================================================
// BASE MARKET DATA READER - UNIFIED FOUNDATION
// =============================================================================

/**
 * Base Market Data Reader - Unified DSL Foundation
 *
 * Supports both patterns:
 * - Actor Pattern: DSL + associates with clients (≥0)
 * - MCP Actor Pattern: IS a client + DSL
 *
 * This provides the foundation for readers that can work with:
 * - Zero clients (local files, memory)
 * - Single client (MCP, Database, Kafka)
 * - Multiple clients (aggregated data sources)
 */
export abstract class BaseReader implements MarketDataReadingDSL {
  protected clients: Map<string, ClientAssociation> = new Map();
  protected isInitialized = false;
  protected totalQueries = 0;
  protected errorCount = 0;
  protected lastActivity?: Date;

  constructor(protected config: { name: string; debug?: boolean }) {}

  // =============================================================================
  // UNIVERSAL CLIENT MANAGEMENT (≥0)
  // =============================================================================

  /**
   * Add client association (MCP, Kafka, Database, etc.)
   */
  addClient(clientName: string, client: any, config: ClientConfig): void {
    this.clients.set(clientName, {
      client,
      config,
      isConnected: false,
      errorCount: 0,
    });

    if (this.config.debug) {
      console.log(`🔗 Added client: ${clientName} (${config.type})`);
    }
  }

  /**
   * Remove client association
   */
  removeClient(clientName: string): boolean {
    const removed = this.clients.delete(clientName);

    if (this.config.debug && removed) {
      console.log(`🔗 Removed client: ${clientName}`);
    }

    return removed;
  }

  /**
   * Get client association
   */
  getClient(clientName: string): ClientAssociation | undefined {
    return this.clients.get(clientName);
  }

  /**
   * Get all client associations
   */
  getAllClients(): ClientAssociation[] {
    return Array.from(this.clients.values());
  }

  /**
   * Get clients by type
   */
  getClientsByType(type: ClientConfig["type"]): ClientAssociation[] {
    return Array.from(this.clients.values()).filter(
      (association) => association.config.type === type,
    );
  }

  // =============================================================================
  // ACTOR LIFECYCLE - REQUIRED IMPLEMENTATIONS
  // =============================================================================

  abstract initialize(): Promise<Result<void>>;
  abstract cleanup(): Promise<Result<void>>;

  // =============================================================================
  // FINANCIAL MARKET DATA ACQUISITION DSL - IMPLEMENTATION USING WORKFLOW + HANDLERS
  // =============================================================================

  /**
   * DSL Function 1: Get current price for ticker and market
   */
  async getCurrentPrice(coinId: string, vsCurrency = "usd"): Promise<Result<number>> {
    return this.workflow(
      () => this.getCurrentPriceHandler(coinId, vsCurrency),
      "PRICE_FETCH_ERROR",
    );
  }

  /**
   * DSL Function 1 (Multi): Get current prices for multiple tickers
   */
  async getCurrentPrices(
    coinIds: string[],
    options?: CurrentPricesOptions,
  ): Promise<Result<CryptoPriceData[]>> {
    return this.workflow(
      () => this.getCurrentPricesHandler(coinIds, options),
      "PRICES_FETCH_ERROR",
    );
  }

  /**
   * DSL Function 2: Get current OHLCV for ticker and market
   */
  async getCurrentOHLCV(
    coinId: string,
    interval: "hourly" | "daily" = "daily",
  ): Promise<Result<CryptoOHLCVData>> {
    return this.workflow(() => this.getCurrentOHLCVHandler(coinId, interval), "OHLCV_FETCH_ERROR");
  }

  /**
   * DSL Function 4: Get latest OHLCV data for multiple coins
   */
  async getLatestOHLCV(coinIds: string[], timeframe?: string): Promise<Result<CryptoOHLCVData[]>> {
    return this.workflow(
      () => this.getLatestOHLCVHandler(coinIds, timeframe),
      "LATEST_OHLCV_FETCH_ERROR",
    );
  }

  /**
   * DSL Function 5: Get price history
   */
  async getPriceHistory(
    coinId: string,
    days: number,
    vsCurrency?: string,
  ): Promise<Result<CryptoPriceData[]>> {
    return this.workflow(
      () => this.getPriceHistoryHandler(coinId, days, vsCurrency),
      "PRICE_HISTORY_FETCH_ERROR",
    );
  }

  /**
   * DSL Function 4: Get OHLCV from date_start to date_end
   */
  async getOHLCVByDateRange(query: DateRangeOHLCVQuery): Promise<Result<CryptoOHLCVData[]>> {
    return this.workflow(() => this.getOHLCVByDateRangeHandler(query), "OHLCV_RANGE_FETCH_ERROR");
  }

  /**
   * DSL Function 5: Get all available tickers for market
   */
  async getAvailableTickers(limit = 100): Promise<Result<CryptoPriceData[]>> {
    return this.workflow(() => this.getAvailableTickersHandler(limit), "TICKERS_FETCH_ERROR");
  }

  /**
   * Get Level 1 data (best bid/ask approximation)
   */
  async getLevel1Data(query: Level1Query): Promise<Result<Level1Data>> {
    return this.workflow(() => this.getLevel1DataHandler(query), "LEVEL1_FETCH_ERROR");
  }

  /**
   * Get global market analytics
   */
  async getMarketAnalytics(): Promise<Result<CryptoMarketAnalytics>> {
    return this.workflow(() => this.getMarketAnalyticsHandler(), "ANALYTICS_FETCH_ERROR");
  }

  // =============================================================================
  // ABSTRACT HANDLER METHODS - CONCRETE CLASSES MUST IMPLEMENT
  // =============================================================================

  protected abstract getCurrentPriceHandler(coinId: string, vsCurrency: string): Promise<number>;
  protected abstract getCurrentPricesHandler(
    coinIds: string[],
    options?: CurrentPricesOptions,
  ): Promise<CryptoPriceData[]>;
  protected abstract getCurrentOHLCVHandler(
    coinId: string,
    interval: "hourly" | "daily",
  ): Promise<CryptoOHLCVData>;
  protected abstract getLatestOHLCVHandler(
    coinIds: string[],
    timeframe?: string,
  ): Promise<CryptoOHLCVData[]>;
  protected abstract getPriceHistoryHandler(
    coinId: string,
    days: number,
    vsCurrency?: string,
  ): Promise<CryptoPriceData[]>;
  protected abstract getOHLCVByDateRangeHandler(
    query: DateRangeOHLCVQuery,
  ): Promise<CryptoOHLCVData[]>;
  protected abstract getAvailableTickersHandler(limit: number): Promise<CryptoPriceData[]>;
  protected abstract getLevel1DataHandler(query: Level1Query): Promise<Level1Data>;
  protected abstract getMarketAnalyticsHandler(): Promise<CryptoMarketAnalytics>;

  // =============================================================================
  // ABSTRACT RESPONSE HANDLERS - CONCRETE CLASSES MUST IMPLEMENT
  // These methods handle: API call + data extraction + transformation in one step
  // =============================================================================

  // =============================================================================
  // ACTOR STATUS - REQUIRED IMPLEMENTATION
  // =============================================================================

  abstract getStatus(): object;

  // =============================================================================
  // UNIFIED MARKET DATA DSL ABSTRACTION
  // =============================================================================

  /**
   * Simplified DSL workflow: API call → response handler → result
   */
  protected async workflow<TResult>(
    responseHandlerFn: () => Promise<TResult>,
    errorCode: string,
  ): Promise<Result<TResult>> {
    try {
      this.updateActivity();

      const client = this.getActiveClient();
      if (!client) {
        return failure(
          createQiError("NO_CLIENT", "No client available", "BUSINESS", {
            errorCode,
          }),
        );
      }

      const result = await responseHandlerFn();
      return success(result);
    } catch (error) {
      this.incrementErrors();
      return failure(
        createQiError(
          errorCode,
          `${errorCode}: ${error instanceof Error ? error.message : String(error)}`,
          "SYSTEM",
          { errorCode, error },
        ),
      );
    }
  }

  protected getActiveClient(): any {
    // For MCP Actor pattern: if this class IS a client, use 'this'
    if (this.isInheritancePattern()) {
      return this;
    }

    // For Actor pattern: use associated clients
    const dataSources = this.getClientsByType("data-source").filter((assoc) => assoc.isConnected);
    if (dataSources.length > 0) {
      return dataSources[0].client;
    }

    const anyConnected = this.getAllClients().find((assoc) => assoc.isConnected);
    return anyConnected?.client;
  }

  /**
   * Universal batch operation factory
   */
  protected createMarketDataBatchDSL<TArgs, TResponse, TResult>(
    batchAdapterFn: (client: any, argsArray: TArgs[]) => Promise<TResponse[]>,
    transformerFn: (responses: TResponse[], originalArgs?: TArgs[]) => TResult,
    errorCode: string,
    dataValidator?: (responses: TResponse[]) => boolean,
    clientSelector?: (clients: ClientAssociation[]) => any,
  ) {
    return async (argsArray: TArgs[]): Promise<Result<TResult>> => {
      try {
        this.updateActivity();

        const client = this.selectClient(clientSelector);
        if (!client) {
          return failure(
            createQiError(
              "NO_CLIENT_AVAILABLE",
              "No suitable client available for batch operation",
              "BUSINESS",
              { operation: errorCode, batchSize: argsArray.length },
            ),
          );
        }

        const responses = await batchAdapterFn(client, argsArray);

        const isValid = dataValidator
          ? dataValidator(responses)
          : responses && responses.length > 0;
        if (!isValid) {
          return failure(
            createQiError(
              "INVALID_BATCH_RESPONSE",
              "No valid data returned from batch operation",
              "BUSINESS",
              { operation: errorCode, batchSize: argsArray.length },
            ),
          );
        }

        const result = transformerFn(responses, argsArray);
        return success(result);
      } catch (error) {
        this.incrementErrors();
        return failure(
          createQiError(
            errorCode,
            `Batch ${errorCode.replace(/_/g, " ").toLowerCase()}: ${error instanceof Error ? error.message : String(error)}`,
            "SYSTEM",
            { operation: errorCode, batchSize: argsArray.length, error },
          ),
        );
      }
    };
  }

  /**
   * Select appropriate client for operation
   * Supports both Actor and MCP Actor patterns
   */
  private selectClient(clientSelector?: (clients: ClientAssociation[]) => any): any {
    if (clientSelector) {
      return clientSelector(this.getAllClients());
    }

    // For MCP Actor pattern: if this class IS a client (has MCP methods), use 'this'
    if (this.isInheritancePattern()) {
      return this;
    }

    // For Actor pattern: use associated clients
    // Default selection: prefer data-source clients, then any connected client
    const dataSources = this.getClientsByType("data-source").filter((assoc) => assoc.isConnected);

    if (dataSources.length > 0) {
      return dataSources[0].client;
    }

    // Fallback to any connected client
    const anyConnected = this.getAllClients().find((assoc) => assoc.isConnected);

    return anyConnected?.client;
  }

  /**
   * Check if this is inheritance pattern (MCP Actor) vs composition pattern (Actor)
   */
  private isInheritancePattern(): boolean {
    // If this class has MCP client methods, it's inheritance pattern
    return (
      typeof (this as any).callTool === "function" ||
      typeof (this as any).listTools === "function" ||
      typeof (this as any).connect === "function"
    );
  }

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

  protected resolveTickerToCoinId(ticker: string): string {
    // Default implementation - subclasses can override
    return ticker.toLowerCase();
  }

  protected calculateOHLCVTimeRange(count: number, interval: string) {
    const now = Date.now();
    const intervalMs = interval === "daily" ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
    const startTime = Math.floor((now - count * intervalMs) / 1000);
    const endTime = Math.floor(now / 1000);

    return { startTime, endTime };
  }

  protected convertDateRangeToTimestamps(query: DateRangeOHLCVQuery) {
    return {
      startTimestamp: Math.floor(query.dateStart.getTime() / 1000),
      endTimestamp: Math.floor(query.dateEnd.getTime() / 1000),
      interval: query.interval === "1d" ? "daily" : "hourly",
    };
  }
}

// =============================================================================
// ACTOR STATUS INTERFACE
// =============================================================================

export interface ActorStatus {
  isInitialized: boolean;
  mcpClientCount: number;
  connectedClients: number;
  lastActivity?: Date;
  totalQueries: number;
  errorCount: number;
  mcpClients: Array<{
    name: string;
    type: string;
    isConnected: boolean;
    errorCount: number;
  }>;
}

// Note: Types are exported via interface declarations above
