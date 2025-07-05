// lib/base/streaming/redpanda/redpanda-client.ts
import { type Admin, type Consumer, Kafka, Partitioners, type Producer } from "kafkajs";
import { RedpandaConfigManager } from "./redpanda-config";
import type { RedpandaConfig } from "./types";
import type {
  ClusterInfo,
  ConsumerGroupInfo,
  ConsumerMessage,
  MessagePayload,
  ProducerResponse,
  TopicConfig,
  TopicMetadata,
} from "./types";

export class RedpandaClient {
  private kafka: Kafka;
  private producer?: Producer;
  private consumer?: Consumer;
  private admin?: Admin;
  private isConnected = false;

  constructor(config?: Partial<RedpandaConfig>) {
    const finalConfig = { ...RedpandaConfigManager.getInstance().getConfig(), ...config };

    this.kafka = new Kafka({
      clientId: finalConfig.clientId,
      brokers: finalConfig.brokers,
      connectionTimeout: 10000,
      requestTimeout: 30000,
      retry: {
        initialRetryTime: 100,
        retries: 8,
        maxRetryTime: 30000,
      },
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      this.admin = this.kafka.admin();
      await this.admin.connect();

      this.producer = this.kafka.producer({
        maxInFlightRequests: 1,
        idempotent: true,
        transactionTimeout: 30000,
        createPartitioner: Partitioners.LegacyPartitioner,
      });
      await this.producer.connect();

      this.isConnected = true;
    } catch (error: unknown) {
      console.error("❌ Failed to connect to Redpanda:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      if (this.consumer) {
        await this.consumer.disconnect();
      }
      if (this.producer) {
        await this.producer.disconnect();
      }
      if (this.admin) {
        await this.admin.disconnect();
      }

      this.isConnected = false;
    } catch (error: unknown) {
      console.error("❌ Error disconnecting from Redpanda:", error);
      throw error;
    }
  }

  // Topic Management
  async createTopic(config: TopicConfig): Promise<void> {
    if (!this.admin) {
      throw new Error("Admin client not connected");
    }

    try {
      await this.admin.createTopics({
        topics: [
          {
            topic: config.name,
            numPartitions: config.partitions,
            replicationFactor: config.replicationFactor,
            configEntries: config.configs
              ? Object.entries(config.configs).map(([name, value]) => ({ name, value }))
              : undefined,
          },
        ],
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("already exists")) {
        // Topic already exists, that's okay
      } else {
        console.error(`❌ Failed to create topic '${config.name}':`, error);
        throw error;
      }
    }
  }

  async createTopics(configs: Array<{ topic: string; numPartitions: number; replicationFactor: number }>): Promise<void> {
    if (!this.admin) {
      throw new Error("Admin client not connected");
    }

    try {
      await this.admin.createTopics({
        topics: configs.map(config => ({
          topic: config.topic,
          numPartitions: config.numPartitions,
          replicationFactor: config.replicationFactor,
        })),
      });
    } catch (error: unknown) {
      console.error("❌ Failed to create topics:", error);
      throw error;
    }
  }

  async listTopics(): Promise<string[]> {
    if (!this.admin) {
      throw new Error("Admin client not connected");
    }

    try {
      const metadata = await this.admin.fetchTopicMetadata();
      return metadata.topics.map((topic) => topic.name);
    } catch (error: unknown) {
      console.error("❌ Failed to list topics:", error);
      throw error;
    }
  }

  async getTopicMetadata(topicName: string): Promise<TopicMetadata> {
    if (!this.admin) {
      throw new Error("Admin client not connected");
    }

    try {
      const metadata = await this.admin.fetchTopicMetadata({
        topics: [topicName],
      });

      const topic = metadata.topics.find((t) => t.name === topicName);
      if (!topic) {
        throw new Error(`Topic '${topicName}' not found`);
      }

      const configs = await this.admin.describeConfigs({
        resources: [
          {
            type: 2, // TOPIC
            name: topicName,
          },
        ],
        includeSynonyms: false,
      });

      const topicConfigs = configs.resources[0]?.configEntries || [];

      return {
        name: topic.name,
        partitions: topic.partitions.map((p) => ({
          partitionId: p.partitionId,
          leader: p.leader,
          replicas: p.replicas,
          isr: p.isr,
        })),
        configs: topicConfigs.reduce(
          (acc, config) => {
            acc[config.configName] = config.configValue;
            return acc;
          },
          {} as Record<string, string>,
        ),
      };
    } catch (error: unknown) {
      console.error(`❌ Failed to get metadata for topic '${topicName}':`, error);
      throw error;
    }
  }

  // Producer Operations
  async produceMessage(message: MessagePayload): Promise<ProducerResponse> {
    if (!this.producer) {
      throw new Error("Producer not connected");
    }

    try {
      const result = await this.producer.send({
        topic: message.topic,
        messages: [
          {
            key: message.key || null,
            value:
              typeof message.value === "string" ? message.value : JSON.stringify(message.value),
            partition: message.partition,
            timestamp: message.timestamp?.toString(),
            headers: message.headers,
          },
        ],
      });

      const recordMetadata = result[0];
      return {
        topic: message.topic,
        partition: recordMetadata.partition,
        offset: recordMetadata.offset || "0",
        timestamp: Number.parseInt(recordMetadata.timestamp || "0"),
      };
    } catch (error: unknown) {
      console.error("❌ Failed to produce message:", error);
      throw error;
    }
  }

  async sendMessages(messages: Array<{ topic: string; messages: Array<{ key: string; value: string }> }>): Promise<any[]> {
    if (!this.producer) {
      throw new Error("Producer not connected");
    }

    try {
      const results = [];
      for (const batch of messages) {
        const result = await this.producer.send({
          topic: batch.topic,
          messages: batch.messages.map(msg => ({
            key: msg.key,
            value: msg.value,
          })),
        });
        results.push(...result);
      }
      return results;
    } catch (error: unknown) {
      console.error("❌ Failed to send messages:", error);
      throw error;
    }
  }

  async produceBatch(messages: MessagePayload[]): Promise<ProducerResponse[]> {
    if (!this.producer) {
      throw new Error("Producer not connected");
    }

    try {
      const batch = messages.reduce(
        (acc, message) => {
          if (!acc[message.topic]) {
            acc[message.topic] = [];
          }

          acc[message.topic].push({
            key: message.key || null,
            value:
              typeof message.value === "string" ? message.value : JSON.stringify(message.value),
            partition: message.partition,
            timestamp: message.timestamp?.toString(),
            headers: message.headers,
          });

          return acc;
        },
        {} as Record<
          string,
          Array<{
            key: string | null;
            value: string;
            partition?: number;
            timestamp?: string;
            headers?: Record<string, string>;
          }>
        >,
      );

      const results: ProducerResponse[] = [];

      for (const [topic, topicMessages] of Object.entries(batch)) {
        const result = await this.producer.send({
          topic,
          messages: topicMessages,
        });

        for (const recordMetadata of result) {
          results.push({
            topic,
            partition: recordMetadata.partition,
            offset: recordMetadata.offset || "0",
            timestamp: Number.parseInt(recordMetadata.timestamp || "0"),
          });
        }
      }

      return results;
    } catch (error: unknown) {
      console.error("❌ Failed to produce batch:", error);
      throw error;
    }
  }

  // Consumer Operations
  async createConsumer(groupId: string): Promise<Consumer> {
    const consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      rebalanceTimeout: 60000,
      heartbeatInterval: 3000,
    });

    await consumer.connect();
    this.consumer = consumer;

    return consumer;
  }

  async consumeMessages(
    topics: string[],
    groupId: string,
    handler: (message: ConsumerMessage) => Promise<void>,
  ): Promise<void> {
    const consumer = await this.createConsumer(groupId);

    await consumer.subscribe({
      topics,
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const consumerMessage: ConsumerMessage = {
          topic,
          partition,
          offset: message.offset,
          key: message.key?.toString() || undefined,
          value: message.value ? JSON.parse(message.value.toString()) : null,
          timestamp: Number.parseInt(message.timestamp),
          headers: message.headers
            ? Object.entries(message.headers).reduce(
                (acc, [key, value]) => {
                  acc[key] = value?.toString() || "";
                  return acc;
                },
                {} as Record<string, string>,
              )
            : undefined,
        };

        await handler(consumerMessage);
      },
    });
  }

  // Cluster Operations
  async getClusterInfo(): Promise<ClusterInfo> {
    if (!this.admin) {
      throw new Error("Admin client not connected");
    }

    try {
      const clusterMetadata = await this.admin.describeCluster();

      return {
        brokers: clusterMetadata.brokers.map(
          (broker: { nodeId: number; host: string; port: number }) => ({
            nodeId: broker.nodeId,
            host: broker.host,
            port: broker.port,
          }),
        ),
        controller:
          typeof clusterMetadata.controller === "object" && clusterMetadata.controller
            ? clusterMetadata.controller
            : clusterMetadata.brokers[0], // Use actual controller or fallback
        clusterId: clusterMetadata.clusterId || "redpanda-cluster",
      };
    } catch (error: unknown) {
      console.error("❌ Failed to get cluster info:", error);
      throw error;
    }
  }

  async getConsumerGroups(): Promise<ConsumerGroupInfo[]> {
    if (!this.admin) {
      throw new Error("Admin client not connected");
    }

    try {
      const groups = await this.admin.listGroups();
      const groupInfos: ConsumerGroupInfo[] = [];

      for (const group of groups.groups) {
        const groupDescription = await this.admin.describeGroups([group.groupId]);
        const groupDetail = groupDescription.groups[0];

        groupInfos.push({
          groupId: group.groupId,
          state: groupDetail.state,
          members: groupDetail.members.map((member) => ({
            memberId: member.memberId,
            clientId: member.clientId,
            clientHost: member.clientHost,
            assignment: member.memberAssignment
              ? JSON.parse(member.memberAssignment.toString())
              : [],
          })),
        });
      }

      return groupInfos;
    } catch (error: unknown) {
      console.error("❌ Failed to get consumer groups:", error);
      throw error;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}