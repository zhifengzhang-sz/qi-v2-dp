// lib/publishers/crypto-data-publisher.ts
import { RedpandaClient } from "../redpanda/redpanda-client";
import type { MessagePayload } from "../redpanda/types";
import type {
  CryptoOHLCV,
  CryptoPrice,
  MarketAnalytics,
  PublishResult,
  PublisherConfig,
  TrendingData,
} from "./types";

export class CryptoDataPublisher {
  private client: RedpandaClient;
  private config: PublisherConfig;
  private isRunning = false;
  private publishQueue: MessagePayload[] = [];
  private batchTimer?: NodeJS.Timeout;

  constructor(config: PublisherConfig) {
    this.config = config;
    this.client = new RedpandaClient({
      clientId: config.clientId,
      brokers: config.brokers,
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    await this.client.connect();

    // Initialize required topics
    await this.initializeTopics();

    // Start batch processing if configured
    if (this.config.batchConfig) {
      this.startBatchProcessor();
    }

    this.isRunning = true;
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    // Clear batch timer
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    // Publish remaining queued messages
    if (this.publishQueue.length > 0) {
      await this.flushQueue();
    }

    await this.client.disconnect();
    this.isRunning = false;
  }

  private async initializeTopics(): Promise<void> {
    const topics = [
      { name: "crypto-prices", partitions: 3, replicationFactor: 1 },
      { name: "crypto-ohlcv", partitions: 3, replicationFactor: 1 },
      { name: "crypto-analytics", partitions: 2, replicationFactor: 1 },
      { name: "crypto-trending", partitions: 2, replicationFactor: 1 },
    ];

    for (const topic of topics) {
      await this.client.createTopic(topic);
    }
  }

  private startBatchProcessor(): void {
    if (!this.config.batchConfig) {
      return;
    }

    this.batchTimer = setInterval(async () => {
      if (this.publishQueue.length > 0) {
        await this.flushQueue();
      }
    }, this.config.batchConfig.maxBatchDelay);
  }

  private async flushQueue(): Promise<void> {
    if (this.publishQueue.length === 0) {
      return;
    }

    const messages = this.publishQueue.splice(0);

    try {
      await this.client.produceBatch(messages);
    } catch (error: unknown) {
      console.error("❌ Failed to publish batch:", error);
      // Re-queue messages for retry
      this.publishQueue.unshift(...messages);
    }
  }

  // Price Publishing
  async publishPrice(price: CryptoPrice): Promise<PublishResult> {
    const message: MessagePayload = {
      topic: "crypto-prices",
      key: price.coin_id,
      value: price,
      timestamp: price.timestamp,
    };

    return this.publishMessage(message);
  }

  async publishPrices(prices: CryptoPrice[]): Promise<PublishResult[]> {
    const messages = prices.map((price) => ({
      topic: "crypto-prices",
      key: price.coin_id,
      value: price,
      timestamp: price.timestamp,
    }));

    return this.publishBatch(messages);
  }

  // OHLCV Publishing
  async publishOHLCV(ohlcv: CryptoOHLCV): Promise<PublishResult> {
    const message: MessagePayload = {
      topic: "crypto-ohlcv",
      key: ohlcv.coin_id,
      value: ohlcv,
      timestamp: ohlcv.timestamp,
    };

    return this.publishMessage(message);
  }

  async publishOHLCVBatch(ohlcvData: CryptoOHLCV[]): Promise<PublishResult[]> {
    const messages = ohlcvData.map((ohlcv) => ({
      topic: "crypto-ohlcv",
      key: ohlcv.coin_id,
      value: ohlcv,
      timestamp: ohlcv.timestamp,
    }));

    return this.publishBatch(messages);
  }

  // Analytics Publishing
  async publishAnalytics(analytics: MarketAnalytics): Promise<PublishResult> {
    const message: MessagePayload = {
      topic: "crypto-analytics",
      key: "market-analytics",
      value: analytics,
      timestamp: analytics.timestamp,
    };

    return this.publishMessage(message);
  }

  // Trending Data Publishing
  async publishTrending(trending: TrendingData): Promise<PublishResult> {
    const message: MessagePayload = {
      topic: "crypto-trending",
      key: "trending-data",
      value: trending,
      timestamp: trending.timestamp,
    };

    return this.publishMessage(message);
  }

  // Core Publishing Methods
  private async publishMessage(message: MessagePayload): Promise<PublishResult> {
    try {
      if (this.config.batchConfig) {
        // Add to batch queue
        this.publishQueue.push(message);

        // Check if batch is full
        if (this.publishQueue.length >= this.config.batchConfig.maxBatchSize) {
          await this.flushQueue();
        }

        return {
          topic: message.topic,
          partition: -1, // Will be determined when batch is flushed
          offset: "queued",
          timestamp: message.timestamp || Date.now(),
          success: true,
        };
      }
      // Publish immediately
      const result = await this.client.produceMessage(message);
      return {
        ...result,
        success: true,
      };
    } catch (error: unknown) {
      console.error("❌ Failed to publish message:", error);
      return {
        topic: message.topic,
        partition: -1,
        offset: "error",
        timestamp: message.timestamp || Date.now(),
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async publishBatch(messages: MessagePayload[]): Promise<PublishResult[]> {
    try {
      const results = await this.client.produceBatch(messages);
      return results.map((result) => ({
        ...result,
        success: true,
      }));
    } catch (error: unknown) {
      console.error("❌ Failed to publish batch:", error);
      return messages.map((message) => ({
        topic: message.topic,
        partition: -1,
        offset: "error",
        timestamp: message.timestamp || Date.now(),
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  // Utility Methods
  async getTopicMetadata(topic: string) {
    return this.client.getTopicMetadata(topic);
  }

  async listTopics(): Promise<string[]> {
    return this.client.listTopics();
  }

  getStatus(): { isRunning: boolean; queueSize: number } {
    return {
      isRunning: this.isRunning,
      queueSize: this.publishQueue.length,
    };
  }
}
