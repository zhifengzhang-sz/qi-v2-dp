// lib/publishers/analytics-publisher.ts
import { CryptoDataPublisher } from "./crypto-data-publisher";
import type { MarketAnalytics, PublishResult, TrendingData } from "./types";

export class AnalyticsPublisher extends CryptoDataPublisher {
  async publishAnalytics(analytics: MarketAnalytics): Promise<PublishResult> {
    return super.publishAnalytics(analytics);
  }

  async publishTrending(trending: TrendingData): Promise<PublishResult> {
    return super.publishTrending(trending);
  }
}
