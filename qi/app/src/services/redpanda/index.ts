/**
 * @fileoverview RedPanda Service Application
 * @module qi/app/src/services/redpanda
 *
 * @description
 * Application integration for RedPanda service. Provides a high-level interface
 * for message streaming operations by combining service configuration with the RedPanda
 * implementation from @qi/core.
 *
 * Features:
 * - Automatic broker selection based on environment
 * - Consumer group management
 * - Schema registry integration
 * - Health monitoring
 * - Type-safe message operations
 *
 * @example Basic Usage
 * ```typescript
 * import { initialize } from 'qi/app/src/services/redpanda';
 *
 * const redpanda = await initialize();
 * const producer = redpanda.getProducer();
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-06
 */

import { RedPandaService } from "@qi/core/services/redpanda";
import { initializeConfig } from "../config/index.js";
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { logger } from "@qi/core/logger";
import type { MessageQueueConnection } from "@qi/core/services/config";
import type { SASLOptions, Mechanism } from "kafkajs";
import { Kafka } from "kafkajs";

/**
 * Extended Kafka connection interface for RedPanda configuration
 */
interface KafkaConnection extends MessageQueueConnection {
  getBrokers(): string[];
  getSSLConfig(): Record<string, unknown>;
  getSASLConfig(): SASLOptions | Mechanism | undefined;
  getConnectionTimeout(): number;
  getRequestTimeout(): number;
}

/**
 * Default RedPanda configuration
 */
export const DEFAULT_REDPANDA_OPTIONS = {
  enabled: true,
  consumer: {
    sessionTimeout: 30000,
    rebalanceTimeout: 60000,
    heartbeatInterval: 3000,
  },
  producer: {
    allowAutoTopicCreation: true,
    maxInFlightRequests: 5,
    idempotent: false,
  },
  healthCheck: {
    enabled: true,
    interval: 30000,
    timeout: 5000,
    retries: 3,
  },
} as const;

let redpandaClient: RedPandaService | undefined;
let kafkaInstance: Kafka | undefined;

function enhanceConnection(
  connection: MessageQueueConnection
): KafkaConnection {
  return {
    ...connection,
    getBrokers(): string[] {
      return [connection.getBrokerEndpoint()];
    },
    getSSLConfig(): Record<string, unknown> {
      return {};
    },
    getSASLConfig(): SASLOptions | Mechanism | undefined {
      return undefined;
    },
    getConnectionTimeout(): number {
      return 30000;
    },
    getRequestTimeout(): number {
      return 30000;
    },
  };
}

/**
 * Test direct KafkaJS connection
 */
async function testDirectKafkaConnection(
  brokerEndpoint: string
): Promise<void> {
  logger.debug("Creating Kafka instance", { brokerEndpoint });

  try {
    // Create a basic Kafka instance
    kafkaInstance = new Kafka({
      clientId: "connection-test",
      brokers: [brokerEndpoint],
      connectionTimeout: 10000,
      retry: {
        initialRetryTime: 100,
        retries: 3,
      },
    });

    logger.debug("Created Kafka instance, getting admin client");
    const admin = kafkaInstance.admin();

    logger.debug("Connecting to admin client");
    await admin.connect();

    logger.debug("Listing topics to verify connection");
    const topics = await admin.listTopics();
    logger.debug("Successfully listed topics", { topics });

    await admin.disconnect();
    logger.debug("Successfully disconnected from admin client");
  } catch (error) {
    logger.error("Direct Kafka connection test failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

export async function initialize(
  options: Partial<typeof DEFAULT_REDPANDA_OPTIONS> = {}
): Promise<RedPandaService> {
  try {
    if (redpandaClient) {
      return redpandaClient;
    }

    const services = await initializeConfig();

    if (!services.messageQueue) {
      throw new ApplicationError(
        "RedPanda configuration missing",
        ErrorCode.CONFIGURATION_ERROR,
        500
      );
    }

    const brokerEndpoint = services.messageQueue.getBrokerEndpoint();

    logger.debug(
      "Testing direct Kafka connection before RedPanda initialization",
      {
        brokerEndpoint,
        schemaRegistryEndpoint:
          services.messageQueue.getSchemaRegistryEndpoint(),
        proxyEndpoint: services.messageQueue.getProxyEndpoint(),
        networkName: services.networking.getNetworkName("redpanda"),
      }
    );

    try {
      await testDirectKafkaConnection(brokerEndpoint);
    } catch (error) {
      throw new ApplicationError(
        "Failed to establish basic Kafka connection",
        ErrorCode.CONNECTION_ERROR,
        500,
        {
          brokerEndpoint,
          error: error instanceof Error ? error.message : String(error),
        }
      );
    }

    const config = {
      enabled: options.enabled ?? DEFAULT_REDPANDA_OPTIONS.enabled,
      connection: enhanceConnection(services.messageQueue),
      clientId: process.env.SERVICE_NAME || "qi-service",
      consumer: {
        ...DEFAULT_REDPANDA_OPTIONS.consumer,
        ...options.consumer,
        groupId: process.env.CONSUMER_GROUP_ID || "qi-consumer-group",
      },
      producer: {
        ...DEFAULT_REDPANDA_OPTIONS.producer,
        ...options.producer,
      },
      healthCheck: {
        ...DEFAULT_REDPANDA_OPTIONS.healthCheck,
        ...options.healthCheck,
      },
    };

    try {
      logger.debug("Creating RedPanda service instance", config);
      redpandaClient = new RedPandaService(config);

      logger.debug("Attempting RedPanda service connection");
      await redpandaClient.connect();

      logger.debug("RedPanda service connection successful");
    } catch (error) {
      logger.error("RedPanda service connection failed", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        config: {
          broker: brokerEndpoint,
          schemaRegistry: services.messageQueue.getSchemaRegistryEndpoint(),
          proxy: services.messageQueue.getProxyEndpoint(),
          clientId: config.clientId,
          groupId: config.consumer?.groupId,
        },
      });
      throw error;
    }

    logger.info("RedPanda service initialized successfully", {
      brokerEndpoint,
      schemaRegistry: services.messageQueue.getSchemaRegistryEndpoint(),
    });

    return redpandaClient;
  } catch (error) {
    throw new ApplicationError(
      "Failed to initialize RedPanda service",
      ErrorCode.INITIALIZATION_ERROR,
      500,
      {
        error: error instanceof Error ? error.message : String(error),
      }
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

  // Also clean up the Kafka instance if it exists
  if (kafkaInstance) {
    const admin = kafkaInstance.admin();
    try {
      await admin.disconnect();
    } catch (error) {
      logger.warn("Error disconnecting Kafka admin client", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    kafkaInstance = undefined;
  }
}

export type { RedPandaService };
