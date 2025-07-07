import type { CryptoOHLCV, CryptoPrice, MarketAnalytics, TrendingData } from "../publishers/types";
import type { ConsumerConfig, ConsumerHealthCheck, ConsumerStats, MessageHandler } from "./types";
export declare class CryptoDataConsumer implements ConsumerHealthCheck {
  private client;
  private config;
  private isRunning;
  private stats;
  private lastError;
  private processingRateWindow;
  private processingRateInterval?;
  private priceHandler?;
  private ohlcvHandler?;
  private analyticsHandler?;
  private trendingHandler?;
  constructor(config: ConsumerConfig);
  start(): Promise<void>;
  stop(): Promise<void>;
  onPriceData(handler: MessageHandler<CryptoPrice>): void;
  onOHLCVData(handler: MessageHandler<CryptoOHLCV>): void;
  onAnalyticsData(handler: MessageHandler<MarketAnalytics>): void;
  onTrendingData(handler: MessageHandler<TrendingData>): void;
  private handleMessage;
  private retryMessage;
  private startProcessingRateMonitor;
  isHealthy(): boolean;
  getLastError(): Error | null;
  getStats(): ConsumerStats;
  seekToOffset(_topic: string, _partition: number, _offset: string): Promise<void>;
  getConsumerLag(): Promise<number>;
  pauseConsumption(): Promise<void>;
  resumeConsumption(): Promise<void>;
  getStatus(): {
    isRunning: boolean;
    groupId: string;
    topics: string[];
    stats: ConsumerStats;
    isHealthy: boolean;
  };
}
