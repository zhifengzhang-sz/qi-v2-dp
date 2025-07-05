// lib/consumers/crypto-data-consumer.ts
import { RedpandaClient } from "../redpanda/redpanda-client";
export class CryptoDataConsumer {
    client;
    config;
    isRunning = false;
    stats;
    lastError = null;
    processingRateWindow = [];
    processingRateInterval;
    // Message handlers
    priceHandler;
    ohlcvHandler;
    analyticsHandler;
    trendingHandler;
    constructor(config) {
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
    async start() {
        if (this.isRunning) {
            return;
        }
        await this.client.connect();
        this.startProcessingRateMonitor();
        this.isRunning = true;
        // Start consuming messages
        await this.client.consumeMessages(this.config.topics, this.config.groupId, this.handleMessage.bind(this));
    }
    async stop() {
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
    onPriceData(handler) {
        this.priceHandler = handler;
    }
    onOHLCVData(handler) {
        this.ohlcvHandler = handler;
    }
    onAnalyticsData(handler) {
        this.analyticsHandler = handler;
    }
    onTrendingData(handler) {
        this.trendingHandler = handler;
    }
    async handleMessage(message) {
        const metadata = {
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
                        await this.priceHandler(message.value, metadata);
                    }
                    break;
                case "crypto-ohlcv":
                    if (this.ohlcvHandler) {
                        await this.ohlcvHandler(message.value, metadata);
                    }
                    break;
                case "crypto-analytics":
                    if (this.analyticsHandler) {
                        await this.analyticsHandler(message.value, metadata);
                    }
                    break;
                case "crypto-trending":
                    if (this.trendingHandler) {
                        await this.trendingHandler(message.value, metadata);
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
        }
        catch (error) {
            console.error(`❌ Error processing message from ${message.topic}:`, error);
            this.lastError = error instanceof Error ? error : new Error(String(error));
            // Implement retry logic
            if (this.config.retryConfig) {
                await this.retryMessage(message, metadata, this.lastError);
            }
            else {
                this.stats.messagesFailedPermanently++;
            }
        }
    }
    async retryMessage(message, _metadata, _error) {
        const retryConfig = this.config.retryConfig;
        if (!retryConfig) {
            this.stats.messagesFailedPermanently++;
            return;
        }
        let retryCount = 0;
        while (retryCount < retryConfig.maxRetries) {
            try {
                const delay = Math.min(retryConfig.initialRetryTime * 2 ** retryCount, retryConfig.maxRetryTime);
                await new Promise((resolve) => setTimeout(resolve, delay));
                // Retry the message processing
                await this.handleMessage(message);
                this.stats.messagesRetried++;
                return;
            }
            catch (retryError) {
                retryCount++;
                console.warn(`⚠️ Retry ${retryCount}/${retryConfig.maxRetries} failed for ${message.topic}:`, retryError);
            }
        }
        // All retries exhausted
        this.stats.messagesFailedPermanently++;
        console.error(`❌ Message from ${message.topic} failed permanently after ${retryConfig.maxRetries} retries`);
    }
    startProcessingRateMonitor() {
        this.processingRateInterval = setInterval(() => {
            const now = Date.now();
            const oneSecondAgo = now - 1000;
            // Remove old entries
            this.processingRateWindow = this.processingRateWindow.filter((timestamp) => timestamp > oneSecondAgo);
            // Calculate rate
            this.stats.processingRate = this.processingRateWindow.length;
        }, 1000);
    }
    // Health Check Implementation
    isHealthy() {
        const timeSinceLastMessage = Date.now() - this.stats.lastProcessedTimestamp;
        const isRecentlyActive = timeSinceLastMessage < 300000; // 5 minutes
        const hasNoRecentErrors = this.lastError === null;
        return this.isRunning && isRecentlyActive && hasNoRecentErrors;
    }
    getLastError() {
        return this.lastError;
    }
    getStats() {
        return { ...this.stats };
    }
    // Utility Methods
    async seekToOffset(_topic, _partition, _offset) { }
    async getConsumerLag() {
        // Calculate consumer lag
        // This would require fetching high water marks and current offsets
        return 0; // Placeholder
    }
    async pauseConsumption() { }
    async resumeConsumption() { }
    getStatus() {
        return {
            isRunning: this.isRunning,
            groupId: this.config.groupId,
            topics: this.config.topics,
            stats: this.getStats(),
            isHealthy: this.isHealthy(),
        };
    }
}
