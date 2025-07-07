import { CryptoDataPublisher } from "./crypto-data-publisher";
import type { MarketAnalytics, PublishResult, TrendingData } from "./types";
export declare class AnalyticsPublisher extends CryptoDataPublisher {
  publishAnalytics(analytics: MarketAnalytics): Promise<PublishResult>;
  publishTrending(trending: TrendingData): Promise<PublishResult>;
}
