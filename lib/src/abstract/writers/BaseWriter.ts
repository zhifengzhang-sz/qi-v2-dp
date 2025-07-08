#!/usr/bin/env bun

/**
 * Base Market Data Writer - Unified DSL Foundation
 *
 * Supports both patterns:
 * - Actor Pattern (composition): DSL + associates with clients (≥0)
 * - MCP Actor Pattern (inheritance): IS a client + DSL
 *
 * This abstract class:
 * - Provides unified publishing DSL abstraction for ALL targets
 * - Manages client associations via composition OR inheritance
 * - Uses qicore Result<T> for functional error handling
 * - Works with MCP, Kafka, Database, Files, APIs, etc.
 */

import type { ResultType as Result } from "@qi/core/base";
import { createQiError, failure, success } from "@qi/core/base";
import type {
  BatchPublishOptions,
  BatchPublishResult,
  ClientAssociation,
  ClientConfig,
  CryptoMarketAnalytics,
  CryptoOHLCVData,
  CryptoPriceData,
  Level1Data,
  MarketDataWritingDSL,
  PublishOptions,
  PublishResult,
} from "../dsl";

// Re-export types from DSL for backward compatibility
export type {
  BatchPublishOptions,
  BatchPublishResult,
  ClientAssociation,
  ClientConfig,
  CryptoPriceData,
  CryptoOHLCVData,
  CryptoMarketAnalytics,
  Level1Data,
  PublishOptions,
  PublishResult,
} from "../dsl";

// =============================================================================
// BASE MARKET DATA WRITER - UNIFIED FOUNDATION
// =============================================================================

/**
 * Base Market Data Writer - Unified DSL Foundation
 *
 * Supports both patterns:
 * - Actor Pattern: DSL + associates with clients (≥0)
 * - MCP Actor Pattern: IS a client + DSL
 *
 * This provides the foundation for writers that can work with:
 * - Zero clients (local files, memory)
 * - Single client (MCP, Kafka, Database)
 * - Multiple clients (multi-destination publishing)
 */
export abstract class BaseWriter implements MarketDataWritingDSL {
  protected clients: Map<string, ClientAssociation> = new Map();
  protected isInitialized = false;
  protected totalPublishes = 0;
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
  // MARKET DATA PUBLISHING DSL - IMPLEMENTATION USING WORKFLOW + HANDLERS
  // =============================================================================

  /**
   * DSL Function 1: Publish single price data
   */
  async publishPrice(
    data: CryptoPriceData,
    options?: PublishOptions,
  ): Promise<Result<PublishResult>> {
    return this.workflow(() => this.publishPriceHandler(data, options), "PRICE_PUBLISH_ERROR");
  }

  /**
   * DSL Function 1 (Batch): Publish multiple price data
   */
  async publishPrices(
    data: CryptoPriceData[],
    options?: BatchPublishOptions,
  ): Promise<Result<BatchPublishResult>> {
    return this.workflow(() => this.publishPricesHandler(data, options), "PRICES_PUBLISH_ERROR");
  }

  /**
   * DSL Function 2: Publish single OHLCV data
   */
  async publishOHLCV(
    data: CryptoOHLCVData,
    options?: PublishOptions,
  ): Promise<Result<PublishResult>> {
    return this.workflow(() => this.publishOHLCVHandler(data, options), "OHLCV_PUBLISH_ERROR");
  }

  /**
   * DSL Function 2 (Batch): Publish multiple OHLCV data
   */
  async publishOHLCVBatch(
    data: CryptoOHLCVData[],
    options?: BatchPublishOptions,
  ): Promise<Result<BatchPublishResult>> {
    return this.workflow(
      () => this.publishOHLCVBatchHandler(data, options),
      "OHLCV_BATCH_PUBLISH_ERROR",
    );
  }

  /**
   * DSL Function 3: Publish market analytics
   */
  async publishAnalytics(
    data: CryptoMarketAnalytics,
    options?: PublishOptions,
  ): Promise<Result<PublishResult>> {
    return this.workflow(
      () => this.publishAnalyticsHandler(data, options),
      "ANALYTICS_PUBLISH_ERROR",
    );
  }

  /**
   * DSL Function 4: Publish Level 1 data
   */
  async publishLevel1(data: Level1Data, options?: PublishOptions): Promise<Result<PublishResult>> {
    return this.workflow(() => this.publishLevel1Handler(data, options), "LEVEL1_PUBLISH_ERROR");
  }

  /**
   * DSL Function 5: Flush pending messages
   */
  async flush(timeoutMs?: number): Promise<Result<void>> {
    return this.workflow(() => this.flushHandler(timeoutMs), "FLUSH_ERROR");
  }

  /**
   * DSL Function 6: Create topic/destination
   */
  async createDestination(name: string, config?: Record<string, any>): Promise<Result<void>> {
    return this.workflow(
      () => this.createDestinationHandler(name, config),
      "CREATE_DESTINATION_ERROR",
    );
  }

  /**
   * DSL Function 7: Get publishing metrics
   */
  async getPublishingMetrics(): Promise<
    Result<{
      totalMessages: number;
      successRate: number;
      averageLatency: number;
      errorRate: number;
    }>
  > {
    return this.workflow(() => this.getPublishingMetricsHandler(), "METRICS_FETCH_ERROR");
  }

  // =============================================================================
  // ABSTRACT HANDLER METHODS - CONCRETE CLASSES MUST IMPLEMENT
  // =============================================================================

  protected abstract publishPriceHandler(
    data: CryptoPriceData,
    options?: PublishOptions,
  ): Promise<PublishResult>;
  protected abstract publishPricesHandler(
    data: CryptoPriceData[],
    options?: BatchPublishOptions,
  ): Promise<BatchPublishResult>;
  protected abstract publishOHLCVHandler(
    data: CryptoOHLCVData,
    options?: PublishOptions,
  ): Promise<PublishResult>;
  protected abstract publishOHLCVBatchHandler(
    data: CryptoOHLCVData[],
    options?: BatchPublishOptions,
  ): Promise<BatchPublishResult>;
  protected abstract publishAnalyticsHandler(
    data: CryptoMarketAnalytics,
    options?: PublishOptions,
  ): Promise<PublishResult>;
  protected abstract publishLevel1Handler(
    data: Level1Data,
    options?: PublishOptions,
  ): Promise<PublishResult>;
  protected abstract flushHandler(timeoutMs?: number): Promise<void>;
  protected abstract createDestinationHandler(
    name: string,
    config?: Record<string, any>,
  ): Promise<void>;
  protected abstract getPublishingMetricsHandler(): Promise<{
    totalMessages: number;
    successRate: number;
    averageLatency: number;
    errorRate: number;
  }>;

  // =============================================================================
  // ACTOR STATUS - REQUIRED IMPLEMENTATION
  // =============================================================================

  abstract getStatus(): object;

  // =============================================================================
  // UNIFIED MARKET DATA DSL ABSTRACTION
  // =============================================================================

  /**
   * Simplified DSL workflow: Handler call → result
   */
  protected async workflow<TResult>(
    handlerFn: () => Promise<TResult>,
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

      const result = await handlerFn();
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
    const dataTargets = this.getClientsByType("data-target").filter((assoc) => assoc.isConnected);
    if (dataTargets.length > 0) {
      return dataTargets[0].client;
    }

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
    this.totalPublishes++;
    this.lastActivity = new Date();
  }

  protected incrementErrors(): void {
    this.errorCount++;
  }
}

// =============================================================================
// WRITER STATUS INTERFACE
// =============================================================================

export interface WriterStatus {
  isInitialized: boolean;
  mcpClientCount: number;
  connectedClients: number;
  lastActivity?: Date;
  totalPublishes: number;
  errorCount: number;
  mcpClients: Array<{
    name: string;
    type: string;
    isConnected: boolean;
    errorCount: number;
  }>;
}
