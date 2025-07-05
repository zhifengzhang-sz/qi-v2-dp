import { type Consumer } from "kafkajs";
import type { RedpandaConfig } from "./types";
import type { ClusterInfo, ConsumerGroupInfo, ConsumerMessage, MessagePayload, ProducerResponse, TopicConfig, TopicMetadata } from "./types";
export declare class RedpandaClient {
    private kafka;
    private producer?;
    private consumer?;
    private admin?;
    private isConnected;
    constructor(config?: Partial<RedpandaConfig>);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    createTopic(config: TopicConfig): Promise<void>;
    listTopics(): Promise<string[]>;
    getTopicMetadata(topicName: string): Promise<TopicMetadata>;
    produceMessage(message: MessagePayload): Promise<ProducerResponse>;
    produceBatch(messages: MessagePayload[]): Promise<ProducerResponse[]>;
    createConsumer(groupId: string): Promise<Consumer>;
    consumeMessages(topics: string[], groupId: string, handler: (message: ConsumerMessage) => Promise<void>): Promise<void>;
    getClusterInfo(): Promise<ClusterInfo>;
    getConsumerGroups(): Promise<ConsumerGroupInfo[]>;
    getConnectionStatus(): boolean;
}
