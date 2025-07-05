export interface ConsumerConfig {
    groupId: string;
    clientId: string;
    brokers: string[];
    topics: string[];
    fromBeginning?: boolean;
    batchSize?: number;
    batchTimeout?: number;
    retryConfig?: {
        maxRetries: number;
        initialRetryTime: number;
        maxRetryTime: number;
    };
}
export type MessageHandler<T> = (data: T, metadata: MessageMetadata) => Promise<void>;
export interface MessageMetadata {
    topic: string;
    partition: number;
    offset: string;
    timestamp: number;
    key?: string;
    headers?: Record<string, string>;
}
export interface ConsumerStats {
    messagesProcessed: number;
    messagesFailedPermanently: number;
    messagesRetried: number;
    lastProcessedTimestamp: number;
    currentLag: number;
    processingRate: number;
}
export interface OffsetManagement {
    commit(): Promise<void>;
    seek(topic: string, partition: number, offset: string): Promise<void>;
    getOffsets(topic: string): Promise<Array<{
        partition: number;
        offset: string;
    }>>;
}
export interface ConsumerHealthCheck {
    isHealthy(): boolean;
    getLastError(): Error | null;
    getStats(): ConsumerStats;
}
