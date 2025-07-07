// lib/publishers/crypto-data-publisher.ts
import { RedpandaClient } from "../redpanda/redpanda-client";
export class CryptoDataPublisher {
  client;
  config;
  isRunning = false;
  publishQueue = [];
  batchTimer;
  constructor(config) {
    this.config = config;
    this.client = new RedpandaClient({
      clientId: config.clientId,
      brokers: config.brokers,
    });
  }
  async start() {
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
  async stop() {
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
  async initializeTopics() {
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
  startBatchProcessor() {
    if (!this.config.batchConfig) {
      return;
    }
    this.batchTimer = setInterval(async () => {
      if (this.publishQueue.length > 0) {
        await this.flushQueue();
      }
    }, this.config.batchConfig.maxBatchDelay);
  }
  async flushQueue() {
    if (this.publishQueue.length === 0) {
      return;
    }
    const messages = this.publishQueue.splice(0);
    try {
      await this.client.produceBatch(messages);
    } catch (error) {
      console.error("❌ Failed to publish batch:", error);
      // Re-queue messages for retry
      this.publishQueue.unshift(...messages);
    }
  }
  // Price Publishing
  async publishPrice(price) {
    const message = {
      topic: "crypto-prices",
      key: price.coin_id,
      value: price,
      timestamp: price.timestamp,
    };
    return this.publishMessage(message);
  }
  async publishPrices(prices) {
    const messages = prices.map((price) => ({
      topic: "crypto-prices",
      key: price.coin_id,
      value: price,
      timestamp: price.timestamp,
    }));
    return this.publishBatch(messages);
  }
  // OHLCV Publishing
  async publishOHLCV(ohlcv) {
    const message = {
      topic: "crypto-ohlcv",
      key: ohlcv.coin_id,
      value: ohlcv,
      timestamp: ohlcv.timestamp,
    };
    return this.publishMessage(message);
  }
  async publishOHLCVBatch(ohlcvData) {
    const messages = ohlcvData.map((ohlcv) => ({
      topic: "crypto-ohlcv",
      key: ohlcv.coin_id,
      value: ohlcv,
      timestamp: ohlcv.timestamp,
    }));
    return this.publishBatch(messages);
  }
  // Analytics Publishing
  async publishAnalytics(analytics) {
    const message = {
      topic: "crypto-analytics",
      key: "market-analytics",
      value: analytics,
      timestamp: analytics.timestamp,
    };
    return this.publishMessage(message);
  }
  // Trending Data Publishing
  async publishTrending(trending) {
    const message = {
      topic: "crypto-trending",
      key: "trending-data",
      value: trending,
      timestamp: trending.timestamp,
    };
    return this.publishMessage(message);
  }
  // Core Publishing Methods
  async publishMessage(message) {
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
    } catch (error) {
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
  async publishBatch(messages) {
    try {
      const results = await this.client.produceBatch(messages);
      return results.map((result) => ({
        ...result,
        success: true,
      }));
    } catch (error) {
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
  async getTopicMetadata(topic) {
    return this.client.getTopicMetadata(topic);
  }
  async listTopics() {
    return this.client.listTopics();
  }
  getStatus() {
    return {
      isRunning: this.isRunning,
      queueSize: this.publishQueue.length,
    };
  }
}
