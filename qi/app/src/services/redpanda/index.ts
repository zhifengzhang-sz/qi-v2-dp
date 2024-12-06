/**
 * @fileoverview
 * @module index.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-06
 * @modified 2024-12-06
 */

// services/redpanda/index.ts
import { Kafka, Producer, Consumer, ConsumerConfig } from "kafkajs";
import { RedPandaConfig, toKafkaConfig } from "./config.js";
import { initializeConfig } from "../config/index.js";
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { logger } from "@qi/core/logger";

let redpandaClient: RedPandaService | undefined;

interface RedPandaOptions {
  enabled?: boolean;
  consumer?: {
    groupId?: string;
    sessionTimeout?: number;
    rebalanceTimeout?: number;
    heartbeatInterval?: number;
  };
  producer?: {
    allowAutoTopicCreation?: boolean;
    maxInFlightRequests?: number;
    idempotent?: boolean;
  };
  healthCheck?: {
    enabled?: boolean;
    interval?: number;
    timeout?: number;
    retries?: number;
  };
}

export class RedPandaService {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumer: Consumer | null = null;
  private config: RedPandaConfig;

  constructor(config: RedPandaConfig) {
    this.config = config;
    this.kafka = new Kafka(toKafkaConfig(config));
  }

  async connect(): Promise<void> {
    try {
      this.producer = this.kafka.producer(this.config.producer || {});
      await this.producer.connect();

      if (this.config.consumer) {
        const consumerConfig = {
          groupId: this.config.consumer.groupId,
          ...this.config.consumer,
        };
        // Type assertion to satisfy TypeScript
        this.consumer = this.kafka.consumer(consumerConfig as ConsumerConfig);
        await this.consumer.connect();
      }
      logger.info("RedPanda service connected successfully");
    } catch (error) {
      logger.error("Failed to connect RedPanda service", { error });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.consumer) {
        await this.consumer.disconnect();
        this.consumer = null;
      }
      if (this.producer) {
        await this.producer.disconnect();
        this.producer = null;
      }
      logger.info("RedPanda service disconnected successfully");
    } catch (error) {
      logger.error("Error disconnecting RedPanda service", { error });
      throw error;
    }
  }

  getProducer(): Producer {
    if (!this.producer) throw new Error("Producer not initialized");
    return this.producer;
  }

  getConsumer(): Consumer {
    if (!this.consumer) throw new Error("Consumer not initialized");
    return this.consumer;
  }
}

export async function initialize(
  options: RedPandaOptions = {}
): Promise<RedPandaService> {
  try {
    if (redpandaClient) return redpandaClient;

    const services = await initializeConfig();
    if (!services.messageQueue) {
      throw new ApplicationError(
        "RedPanda configuration missing",
        ErrorCode.CONFIGURATION_ERROR,
        500
      );
    }

    logger.debug("Initializing RedPanda service with configuration:", {
      brokerEndpoint: services.messageQueue.getBrokerEndpoint(),
      schemaRegistry: services.messageQueue.getSchemaRegistryEndpoint(),
      ...options,
    });

    const config: RedPandaConfig = {
      type: "redpanda",
      version: "1.0",
      kafka: {
        brokers: [services.messageQueue.getBrokerEndpoint()],
        clientId: process.env.SERVICE_NAME || "qi-service",
      },
      consumer: {
        groupId: process.env.CONSUMER_GROUP_ID || "qi-consumer-group",
        ...options.consumer,
      },
      producer: options.producer,
    };

    redpandaClient = new RedPandaService(config);
    await redpandaClient.connect();
    return redpandaClient;
  } catch (error) {
    throw new ApplicationError(
      "Failed to initialize RedPanda service",
      ErrorCode.INITIALIZATION_ERROR,
      500,
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

export function getService(): RedPandaService {
  if (!redpandaClient) {
    throw new ApplicationError(
      "RedPanda service not initialized. Call initialize() first.",
      ErrorCode.SERVICE_NOT_INITIALIZED,
      500
    );
  }
  return redpandaClient;
}

export async function close(): Promise<void> {
  if (redpandaClient) {
    await redpandaClient.disconnect();
    redpandaClient = undefined;
  }
}

export type { RedPandaConfig };
