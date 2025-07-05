import type { CryptoOHLCV, CryptoPrice, MarketAnalytics, PublishResult, PublisherConfig, TrendingData } from "./types";
export declare class CryptoDataPublisher {
    private client;
    private config;
    private isRunning;
    private publishQueue;
    private batchTimer?;
    constructor(config: PublisherConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    private initializeTopics;
    private startBatchProcessor;
    private flushQueue;
    publishPrice(price: CryptoPrice): Promise<PublishResult>;
    publishPrices(prices: CryptoPrice[]): Promise<PublishResult[]>;
    publishOHLCV(ohlcv: CryptoOHLCV): Promise<PublishResult>;
    publishOHLCVBatch(ohlcvData: CryptoOHLCV[]): Promise<PublishResult[]>;
    publishAnalytics(analytics: MarketAnalytics): Promise<PublishResult>;
    publishTrending(trending: TrendingData): Promise<PublishResult>;
    private publishMessage;
    private publishBatch;
    getTopicMetadata(topic: string): Promise<import("../redpanda").TopicMetadata>;
    listTopics(): Promise<string[]>;
    getStatus(): {
        isRunning: boolean;
        queueSize: number;
    };
}
