import type { RedpandaClient } from "../redpanda/redpanda-client";
import type { MCPTool } from "./registry";
/**
 * High-Performance Topic Management Tool
 */
export declare class ManageTopicsTool implements MCPTool {
    private redpandaClient;
    name: string;
    description: string;
    constructor(redpandaClient: RedpandaClient);
    execute(params: {
        operation: "create" | "delete" | "list" | "describe";
        topicName?: string;
        partitions?: number;
        replicationFactor?: number;
    }): Promise<any>;
    private createTopic;
    private listTopics;
    private describeTopic;
    private deleteTopic;
}
/**
 * High-Performance Consumer Group Management Tool
 */
export declare class ManageConsumerGroupsTool implements MCPTool {
    private redpandaClient;
    name: string;
    description: string;
    constructor(redpandaClient: RedpandaClient);
    execute(params: {
        operation: "list" | "describe" | "reset" | "delete";
        groupId?: string;
        topic?: string;
    }): Promise<any>;
    private listConsumerGroups;
    private describeConsumerGroup;
    private resetConsumerGroup;
    private deleteConsumerGroup;
}
/**
 * High-Performance Cluster Monitoring Tool
 */
export declare class MonitorClusterTool implements MCPTool {
    private redpandaClient;
    name: string;
    description: string;
    constructor(redpandaClient: RedpandaClient);
    execute(params: {
        metrics: ("brokers" | "topics" | "consumers" | "performance")[];
    }): Promise<any>;
    private getBrokerMetrics;
    private getTopicMetrics;
    private getConsumerMetrics;
    private getPerformanceMetrics;
}
