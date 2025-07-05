export interface RedpandaConfig {
    brokers: string[];
    clientId: string;
    groupId?: string;
    enableAutoCommit?: boolean;
    sessionTimeout?: number;
    heartbeatInterval?: number;
}
export interface TopicConfig {
    name: string;
    partitions: number;
    replicationFactor: number;
    configs?: Record<string, string>;
}
export interface MessagePayload {
    topic: string;
    key?: string;
    value: unknown;
    partition?: number;
    timestamp?: number;
    headers?: Record<string, string>;
}
export interface ConsumerMessage {
    topic: string;
    partition: number;
    offset: string;
    key?: string;
    value: unknown;
    timestamp: number;
    headers?: Record<string, string>;
}
export interface ProducerResponse {
    topic: string;
    partition: number;
    offset: string;
    timestamp: number;
}
export interface ClusterInfo {
    brokers: Array<{
        nodeId: number;
        host: string;
        port: number;
    }>;
    controller: {
        nodeId: number;
        host: string;
        port: number;
    };
    clusterId: string;
}
export interface TopicMetadata {
    name: string;
    partitions: Array<{
        partitionId: number;
        leader: number;
        replicas: number[];
        isr: number[];
    }>;
    configs: Record<string, string>;
}
export interface ConsumerGroupInfo {
    groupId: string;
    state: string;
    members: Array<{
        memberId: string;
        clientId: string;
        clientHost: string;
        assignment: Array<{
            topic: string;
            partitions: number[];
        }>;
    }>;
}
