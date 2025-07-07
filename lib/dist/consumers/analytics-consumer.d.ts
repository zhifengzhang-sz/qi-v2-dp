import type { MarketAnalytics, TrendingData } from "../publishers/types";
import { CryptoDataConsumer } from "./crypto-data-consumer";
import type { MessageHandler } from "./types";
export declare class AnalyticsConsumer extends CryptoDataConsumer {
  onAnalyticsUpdate(handler: MessageHandler<MarketAnalytics>): void;
  onTrendingUpdate(handler: MessageHandler<TrendingData>): void;
}
