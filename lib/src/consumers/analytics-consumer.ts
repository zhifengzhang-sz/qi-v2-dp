import type { MarketAnalytics, TrendingData } from "../publishers/types";
// lib/consumers/analytics-consumer.ts
import { CryptoDataConsumer } from "./crypto-data-consumer";
import type { MessageHandler } from "./types";

export class AnalyticsConsumer extends CryptoDataConsumer {
  onAnalyticsUpdate(handler: MessageHandler<MarketAnalytics>): void {
    this.onAnalyticsData(handler);
  }

  onTrendingUpdate(handler: MessageHandler<TrendingData>): void {
    this.onTrendingData(handler);
  }
}
