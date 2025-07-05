import type { CryptoOHLCV, CryptoPrice, MarketAnalytics, TrendingData } from "../publishers/types";
// lib/consumers/crypto-data-consumer.ts
import { RedpandaClient } from "../redpanda/redpanda-client";
import type { ConsumerMessage } from "../redpanda/types";
import type {
  ConsumerConfig,
  ConsumerHealthCheck,
  ConsumerStats,
  MessageHandler,
  MessageMetadata,
} from "./types";

export class CryptoDataConsumer implements ConsumerHealthCheck {
  private client: RedpandaClient;
  private config: ConsumerConfig;
  private isRunning = false;
  private stats: ConsumerStats;
  private lastError: Error | null = null;
  private processingRateWindow: number[] = [];
  private processingRateInterval?: NodeJS.Timeout;

  // Message handlers
  private priceHandler?: MessageHandler<CryptoPrice>;
  private ohlcvHandler?: MessageHandler<CryptoOHLCV>;
  private analyticsHandler?: MessageHandler<MarketAnalytics>;
  private trendingHandler?: MessageHandler<TrendingData>;

  constructor(config: ConsumerConfig) {
    this.config = config;
    this.client = new RedpandaClient({
      clientId: config.clientId,
      brokers: config.brokers,
    });

    this.stats = {
      messagesProcessed: 0,
      messagesFailedPermanently: 0,
      messagesRetried: 0,
      lastProcessedTimestamp: Date.now(),
      currentLag: 0,
      processingRate: 0,
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    await this.client.connect();
    this.startProcessingRateMonitor();
    this.isRunning = true;

    // Start consuming messages
    await this.client.consumeMessages(
      this.config.topics,
      this.config.groupId,
      this.handleMessage.bind(this),
    );
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    if (this.processingRateInterval) {
      clearInterval(this.processingRateInterval);
    }

    await this.client.disconnect();
    this.isRunning = false;
  }

  // Handler Registration
  onPriceData(handler: MessageHandler<CryptoPrice>): void {
    this.priceHandler = handler;
  }

  onOHLCVData(handler: MessageHandler<CryptoOHLCV>): void {
    this.ohlcvHandler = handler;
  }

  onAnalyticsData(handler: MessageHandler<MarketAnalytics>): void {
    this.analyticsHandler = handler;
  }

  onTrendingData(handler: MessageHandler<TrendingData>): void {
    this.trendingHandler = handler;
  }

  private async handleMessage(message: ConsumerMessage): Promise<void> {
    const metadata: MessageMetadata = {
      topic: message.topic,
      partition: message.partition,
      offset: message.offset,
      timestamp: message.timestamp,
      key: message.key,
      headers: message.headers,
    };

    try {
      // Route message to appropriate handler based on topic
      switch (message.topic) {
        case "crypto-prices":
          if (this.priceHandler) {
            await this.priceHandler(message.value as CryptoPrice, metadata);
          }
          break;

        case "crypto-ohlcv":
          if (this.ohlcvHandler) {
            await this.ohlcvHandler(message.value as CryptoOHLCV, metadata);
          }
          break;

        case "crypto-analytics":
          if (this.analyticsHandler) {
            await this.analyticsHandler(message.value as MarketAnalytics, metadata);
          }
          break;

        case "crypto-trending":
          if (this.trendingHandler) {
            await this.trendingHandler(message.value as TrendingData, metadata);
          }
          break;

        default:
          console.warn(`⚠️ No handler for topic: ${message.topic}`);
      }

      // Update stats
      this.stats.messagesProcessed++;
      this.stats.lastProcessedTimestamp = Date.now();
      this.processingRateWindow.push(Date.now());

      // Clear error on successful processing
      this.lastError = null;
    } catch (error: unknown) {
      console.error(`❌ Error processing message from ${message.topic}:`, error);
      this.lastError = error instanceof Error ? error : new Error(String(error));

      // Implement retry logic
      if (this.config.retryConfig) {
        await this.retryMessage(message, metadata, this.lastError);
      } else {
        this.stats.messagesFailedPermanently++;
      }
    }
  }

  private async retryMessage(
    message: ConsumerMessage,
    _metadata: MessageMetadata,
    _error: Error,
  ): Promise<void> {
    const retryConfig = this.config.retryConfig;
    if (!retryConfig) {
      this.stats.messagesFailedPermanently++;
      return;
    }
    let retryCount = 0;

    while (retryCount < retryConfig.maxRetries) {
      try {
        const delay = Math.min(
          retryConfig.initialRetryTime * 2 ** retryCount,
          retryConfig.maxRetryTime,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));

        // Retry the message processing
        await this.handleMessage(message);

        this.stats.messagesRetried++;
        return;
      } catch (retryError) {
        retryCount++;
        console.warn(
          `⚠️ Retry ${retryCount}/${retryConfig.maxRetries} failed for ${message.topic}:`,
          retryError,
        );
      }
    }

    // All retries exhausted
    this.stats.messagesFailedPermanently++;
    console.error(
      `❌ Message from ${message.topic} failed permanently after ${retryConfig.maxRetries} retries`,
    );
  }

  private startProcessingRateMonitor(): void {
    this.processingRateInterval = setInterval(() => {
      const now = Date.now();
      const oneSecondAgo = now - 1000;

      // Remove old entries
      this.processingRateWindow = this.processingRateWindow.filter(
        (timestamp) => timestamp > oneSecondAgo,
      );

      // Calculate rate
      this.stats.processingRate = this.processingRateWindow.length;
    }, 1000);
  }

  // Health Check Implementation
  isHealthy(): boolean {
    const timeSinceLastMessage = Date.now() - this.stats.lastProcessedTimestamp;
    const isRecentlyActive = timeSinceLastMessage < 300000; // 5 minutes
    const hasNoRecentErrors = this.lastError === null;

    return this.isRunning && isRecentlyActive && hasNoRecentErrors;
  }

  getLastError(): Error | null {
    return this.lastError;
  }

  getStats(): ConsumerStats {
    return { ...this.stats };
  }

  // Utility Methods
  async seekToOffset(_topic: string, _partition: number, _offset: string): Promise<void> {}

  async getConsumerLag(): Promise<number> {
    // Calculate consumer lag
    // This would require fetching high water marks and current offsets
    return 0; // Placeholder
  }

  async pauseConsumption(): Promise<void> {}

  async resumeConsumption(): Promise<void> {}

  getStatus(): {
    isRunning: boolean;
    groupId: string;
    topics: string[];
    stats: ConsumerStats;
    isHealthy: boolean;
  } {
    return {
      isRunning: this.isRunning,
      groupId: this.config.groupId,
      topics: this.config.topics,
      stats: this.getStats(),
      isHealthy: this.isHealthy(),
    };
  }
}
