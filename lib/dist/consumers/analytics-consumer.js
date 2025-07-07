// lib/consumers/analytics-consumer.ts
import { CryptoDataConsumer } from "./crypto-data-consumer";
export class AnalyticsConsumer extends CryptoDataConsumer {
  onAnalyticsUpdate(handler) {
    this.onAnalyticsData(handler);
  }
  onTrendingUpdate(handler) {
    this.onTrendingData(handler);
  }
}
