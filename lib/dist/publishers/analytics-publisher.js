// lib/publishers/analytics-publisher.ts
import { CryptoDataPublisher } from "./crypto-data-publisher";
export class AnalyticsPublisher extends CryptoDataPublisher {
    async publishAnalytics(analytics) {
        return super.publishAnalytics(analytics);
    }
    async publishTrending(trending) {
        return super.publishTrending(trending);
    }
}
