#!/usr/bin/env bun

/**
 * Redpanda Market Data Reader - Clean Handler Implementation
 *
 * This Reader:
 * - Extends BaseReader for unified DSL foundation
 * - Implements only the handler functions for Redpanda-specific logic
 * - BaseReader handles all DSL interface + workflow complexity
 * - Reads from Redpanda topics using real RedpandaClient
 */

import { type ResultType as Result, createQiError, failure, success } from "@qi/core/base";
import type {
  CryptoMarketAnalytics,
  CryptoOHLCVData,
  CryptoPriceData,
  CurrentPricesOptions,
  DateRangeOHLCVQuery,
  Level1Data,
  Level1Query,
} from "@qi/dp/dsl";
import { RedpandaClient } from "../../../base/streaming/redpanda/redpanda-client";
import type { ConsumerMessage } from "../../../base/streaming/redpanda/types";
import { BaseReader } from "../../abstract/readers/BaseReader";

// =============================================================================
// REDPANDA READER CONFIGURATION
// =============================================================================

export interface RedpandaReaderConfig {
  brokers: string[];
  clientId?: string;
  groupId: string;
  topics?: {
    prices?: string;
    ohlcv?: string;
    analytics?: string;
    level1?: string;
  };
  autoCommit?: boolean;
  sessionTimeout?: number;
  debug?: boolean;
}

// =============================================================================
// REDPANDA MARKET DATA READER - CLEAN HANDLER IMPLEMENTATION
// =============================================================================

export class RedpandaMarketDataReader extends BaseReader {
  protected config: RedpandaReaderConfig & { name: string };
  private redpandaClient: RedpandaClient;
  private isConnected = false;
  private messageBuffer: Map<string, any[]> = new Map();

  constructor(config: RedpandaReaderConfig & { name: string }) {
    super({
      name: config.name || "redpanda-market-data-reader",
      debug: config.debug,
    });

    const defaultConfig = {
      brokers: ["localhost:19092"],
      clientId: "market-data-reader",
      topics: {
        prices: "crypto-prices",
        ohlcv: "crypto-ohlcv",
        analytics: "market-analytics",
        level1: "level1-data",
      },
      autoCommit: true,
      sessionTimeout: 30000,
      debug: false,
    };

    this.config = {
      ...defaultConfig,
      ...config,
      topics: {
        ...defaultConfig.topics,
        ...config.topics,
      },
    };

    // Initialize RedpandaClient with config
    this.redpandaClient = new RedpandaClient({
      brokers: this.config.brokers,
      clientId: this.config.clientId,
      groupId: this.config.groupId,
      enableAutoCommit: this.config.autoCommit,
      sessionTimeout: this.config.sessionTimeout,
    });
  }

  // =============================================================================
  // READER LIFECYCLE
  // =============================================================================

  async initialize(): Promise<Result<void>> {
    if (this.isInitialized) {
      return success(undefined);
    }

    try {
      if (this.config.debug) {
        console.log("🚀 Initializing Redpanda Reader...");
      }

      // Connect to Redpanda using real client
      await this.redpandaClient.connect();
      this.isConnected = true;

      // Register client with BaseReader's client management
      this.addClient("redpanda-kafka", this.redpandaClient, {
        name: "redpanda-kafka",
        type: "data-source",
      });

      // Mark client as connected
      const clientAssoc = this.getClient("redpanda-kafka");
      if (clientAssoc) {
        clientAssoc.isConnected = true;
      }

      this.isInitialized = true;

      if (this.config.debug) {
        console.log("✅ Connected to Redpanda cluster");
      }

      return success(undefined);
    } catch (error: unknown) {
      const qiError = createQiError(
        "READER_INIT_FAILED",
        `Redpanda Reader initialization failed: ${error instanceof Error ? error.message : String(error)}`,
        "SYSTEM",
        { error, config: this.config },
      );

      this.errorCount++;
      return failure(qiError);
    }
  }

  async cleanup(): Promise<Result<void>> {
    try {
      if (this.config.debug) {
        console.log("🛑 Cleaning up Redpanda Reader...");
      }

      if (this.isConnected) {
        await this.redpandaClient.disconnect();
        this.isConnected = false;
      }

      this.messageBuffer.clear();
      this.isInitialized = false;
      return success(undefined);
    } catch (error: unknown) {
      const qiError = createQiError(
        "READER_CLEANUP_FAILED",
        `Redpanda Reader cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
        "SYSTEM",
        { error },
      );

      this.errorCount++;
      return failure(qiError);
    }
  }

  // =============================================================================
  // HANDLER IMPLEMENTATIONS - REDPANDA-SPECIFIC DATA CONSUMPTION
  // =============================================================================

  protected async getCurrentPriceHandler(coinId: string, vsCurrency: string): Promise<number> {
    // Read latest price messages for the coin from prices topic
    const topic = this.config.topics?.prices || "crypto-prices";

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for price data for ${coinId}`));
      }, 10000);

      this.redpandaClient
        .consumeMessages([topic], this.config.groupId, async (message: ConsumerMessage) => {
          try {
            const data = this.parseMessage(message) as CryptoPriceData;
            if (data.coinId === coinId) {
              clearTimeout(timeout);
              resolve(data.usdPrice);
            }
          } catch (error) {
            // Skip invalid messages
          }
        })
        .catch(reject);
    });
  }

  protected async getCurrentPricesHandler(
    coinIds: string[],
    options?: CurrentPricesOptions,
  ): Promise<CryptoPriceData[]> {
    const topic = this.config.topics?.prices || "crypto-prices";
    const results: CryptoPriceData[] = [];
    const foundCoins = new Set<string>();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        resolve(results); // Return what we found
      }, 15000);

      this.redpandaClient
        .consumeMessages([topic], this.config.groupId, async (message: ConsumerMessage) => {
          try {
            const data = this.parseMessage(message) as CryptoPriceData;
            if (coinIds.includes(data.coinId) && !foundCoins.has(data.coinId)) {
              results.push(data);
              foundCoins.add(data.coinId);

              if (foundCoins.size >= coinIds.length) {
                clearTimeout(timeout);
                resolve(results);
              }
            }
          } catch (error) {
            // Skip invalid messages
          }
        })
        .catch(reject);
    });
  }

  protected async getCurrentOHLCVHandler(
    coinId: string,
    interval: "hourly" | "daily",
  ): Promise<CryptoOHLCVData> {
    const topic = this.config.topics?.ohlcv || "crypto-ohlcv";

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for OHLCV data for ${coinId}`));
      }, 10000);

      this.redpandaClient
        .consumeMessages([topic], this.config.groupId, async (message: ConsumerMessage) => {
          try {
            const data = this.parseMessage(message) as CryptoOHLCVData;
            if (data.coinId === coinId) {
              clearTimeout(timeout);
              resolve(data);
            }
          } catch (error) {
            // Skip invalid messages
          }
        })
        .catch(reject);
    });
  }

  protected async getLatestOHLCVHandler(
    coinIds: string[],
    timeframe?: string,
  ): Promise<CryptoOHLCVData[]> {
    const topic = this.config.topics?.ohlcv || "crypto-ohlcv";
    const results: CryptoOHLCVData[] = [];
    const targetCount = 10; // Default count per coin
    const targetItems = coinIds.length * targetCount;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        resolve(results.slice(-targetItems)); // Return latest items
      }, 15000);

      this.redpandaClient
        .consumeMessages([topic], this.config.groupId, async (message: ConsumerMessage) => {
          try {
            const data = this.parseMessage(message) as CryptoOHLCVData;
            if (coinIds.includes(data.coinId)) {
              results.push(data);
              // Keep only latest items in memory
              if (results.length > targetItems * 2) {
                results.splice(0, results.length - targetItems);
              }

              if (results.length >= targetItems) {
                clearTimeout(timeout);
                resolve(results.slice(-targetItems));
              }
            }
          } catch (error) {
            // Skip invalid messages
          }
        })
        .catch(reject);
    });
  }

  protected async getPriceHistoryHandler(
    coinId: string,
    days: number,
    vsCurrency?: string,
  ): Promise<CryptoPriceData[]> {
    const topic = this.config.topics?.prices || "crypto-prices";
    const results: CryptoPriceData[] = [];

    // Calculate date range from days
    const dateEnd = new Date();
    const dateStart = new Date(dateEnd.getTime() - days * 24 * 60 * 60 * 1000);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        resolve(results);
      }, 20000);

      this.redpandaClient
        .consumeMessages([topic], this.config.groupId, async (message: ConsumerMessage) => {
          try {
            const data = this.parseMessage(message) as CryptoPriceData;
            const messageTime = new Date(message.timestamp);

            if (data.coinId === coinId && messageTime >= dateStart && messageTime <= dateEnd) {
              results.push({
                ...data,
                lastUpdated: messageTime,
              });
            }
          } catch (error) {
            // Skip invalid messages
          }
        })
        .catch(reject);
    });
  }

  protected async getOHLCVByDateRangeHandler(
    query: DateRangeOHLCVQuery,
  ): Promise<CryptoOHLCVData[]> {
    const topic = this.config.topics?.ohlcv || "crypto-ohlcv";
    const results: CryptoOHLCVData[] = [];

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        resolve(results);
      }, 20000);

      this.redpandaClient
        .consumeMessages([topic], this.config.groupId, async (message: ConsumerMessage) => {
          try {
            const data = this.parseMessage(message) as CryptoOHLCVData;
            const messageTime = new Date(message.timestamp);

            if (
              data.coinId === query.ticker &&
              messageTime >= query.dateStart &&
              messageTime <= query.dateEnd
            ) {
              results.push(data);
            }
          } catch (error) {
            // Skip invalid messages
          }
        })
        .catch(reject);
    });
  }

  protected async getAvailableTickersHandler(limit: number): Promise<CryptoPriceData[]> {
    const topic = this.config.topics?.prices || "crypto-prices";
    const tickers = new Set<CryptoPriceData>();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        resolve(Array.from(tickers).slice(0, limit));
      }, 15000);

      this.redpandaClient
        .consumeMessages([topic], this.config.groupId, async (message: ConsumerMessage) => {
          try {
            const data = this.parseMessage(message) as CryptoPriceData;
            tickers.add(data);

            if (tickers.size >= limit) {
              clearTimeout(timeout);
              resolve(Array.from(tickers).slice(0, limit));
            }
          } catch (error) {
            // Skip invalid messages
          }
        })
        .catch(reject);
    });
  }

  protected async getLevel1DataHandler(query: Level1Query): Promise<Level1Data> {
    const topic = this.config.topics?.level1 || "level1-data";

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for Level1 data for ${query.ticker}`));
      }, 10000);

      this.redpandaClient
        .consumeMessages([topic], this.config.groupId, async (message: ConsumerMessage) => {
          try {
            const data = this.parseMessage(message) as Level1Data;
            if (data.ticker === query.ticker) {
              clearTimeout(timeout);
              resolve(data);
            }
          } catch (error) {
            // Skip invalid messages
          }
        })
        .catch(reject);
    });
  }

  protected async getMarketAnalyticsHandler(): Promise<CryptoMarketAnalytics> {
    const topic = this.config.topics?.analytics || "market-analytics";

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timeout waiting for market analytics"));
      }, 10000);

      this.redpandaClient
        .consumeMessages([topic], this.config.groupId, async (message: ConsumerMessage) => {
          try {
            const data = this.parseMessage(message) as CryptoMarketAnalytics;
            clearTimeout(timeout);
            resolve(data);
          } catch (error) {
            // Skip invalid messages
          }
        })
        .catch(reject);
    });
  }

  // =============================================================================
  // TRANSFORM IMPLEMENTATIONS - REDPANDA-SPECIFIC DATA TRANSFORMATION
  // =============================================================================

  protected transformCurrentPrice(data: any): number {
    return data.usdPrice || data.current_price || 0;
  }

  protected transformCurrentPrices(data: any): CryptoPriceData[] {
    return Array.isArray(data) ? data : [data];
  }

  protected transformCurrentOHLCV(coinId: string, data: any): CryptoOHLCVData {
    return {
      ...data,
      coinId,
      source: "redpanda-stream",
      attribution: "Data from Redpanda stream",
    };
  }

  protected transformLatestOHLCV(coinId: string, data: any): CryptoOHLCVData[] {
    const dataArray = Array.isArray(data) ? data : [data];
    return dataArray.map((item) => ({
      ...item,
      coinId,
      source: "redpanda-stream",
      attribution: "Data from Redpanda stream",
    }));
  }

  protected transformPriceHistory(data: any): Array<{ date: Date; price: number }> {
    return Array.isArray(data) ? data : [data];
  }

  protected transformOHLCVByDateRange(ticker: string, data: any): CryptoOHLCVData[] {
    const dataArray = Array.isArray(data) ? data : [data];
    return dataArray.map((item) => ({
      ...item,
      coinId: ticker,
      source: "redpanda-stream",
      attribution: "Data from Redpanda stream",
    }));
  }

  protected transformAvailableTickers(data: any, limit: number): CryptoPriceData[] {
    const dataArray = Array.isArray(data) ? data : [data];
    return dataArray.slice(0, limit);
  }

  protected transformLevel1Data(query: Level1Query, data: any): Level1Data {
    return {
      ...data,
      ticker: query.ticker,
      source: "redpanda-stream",
      attribution: "Data from Redpanda stream",
    };
  }

  protected transformMarketAnalytics(data: any): CryptoMarketAnalytics {
    return {
      ...data,
      source: "redpanda-stream",
      attribution: "Data from Redpanda stream",
    };
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private parseMessage(message: ConsumerMessage): any {
    if (typeof message.value === "string") {
      try {
        return JSON.parse(message.value);
      } catch (error) {
        throw new Error(`Failed to parse message: ${error}`);
      }
    }
    return message.value;
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isConnected: this.isConnected,
      hasRedpandaClient: !!this.redpandaClient,
      brokers: this.config.brokers,
      groupId: this.config.groupId,
      topics: this.config.topics,
      lastActivity: this.lastActivity,
      totalQueries: this.totalQueries,
      errorCount: this.errorCount,
      bufferSize: this.messageBuffer.size,
    };
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createRedpandaMarketDataReader(
  config: RedpandaReaderConfig & { name: string },
): RedpandaMarketDataReader {
  return new RedpandaMarketDataReader(config);
}
