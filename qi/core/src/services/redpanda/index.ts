/**
 * @fileoverview RedPanda service wrapper with Kafka protocol support
 * @module @qi/core/services/redpanda
 *
 * @description
 * Provides a service wrapper around RedPanda using the Kafka protocol for:
 * - Message production and consumption
 * - Topic management
 * - Consumer group coordination
 * - Schema registry integration
 * - Health monitoring
 *
 * Key features:
 * - Full Kafka protocol compatibility
 * - Consumer group management
 * - Configurable compression
 * - Batch processing
 * - Schema registry support
 * - Health monitoring
 *
 * Configuration is handled through the standard service configuration system,
 * utilizing the KafkaConnection interface which extends MessageQueueConnection.
 *
 * @example Basic Usage
 * ```typescript
 * const service = new RedPandaService({
 *   enabled: true,
 *   connection: redpandaConnection,
 *   clientId: 'my-service',
 *   consumer: {
 *     groupId: 'my-consumer-group',
 *     sessionTimeout: 30000
 *   }
 * });
 *
 * await service.connect();
 * const producer = service.getProducer();
 * const consumer = service.getConsumer();
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-05
 * @created 2024-12-05
 */

import {
  Kafka,
  Producer,
  Consumer,
  KafkaConfig,
  ConsumerConfig,
  ProducerConfig,
  SASLOptions,
  Mechanism,
} from "kafkajs";
import { BaseServiceClient } from "../base/client.js";
import { HealthCheckResult, ServiceStatus } from "../base/types.js";
import { MessageQueueConnection } from "@qi/core/services/config";
import { logger } from "@qi/core/logger";
import { ApplicationError, ErrorCode } from "@qi/core/errors";

/**
 * Extended Kafka connection interface for RedPanda configuration
 *
 * @interface KafkaConnection
 * @extends {MessageQueueConnection}
 *
 * @property {function} getBrokers - Returns array of broker addresses
 * @property {function} getSSLConfig - Returns SSL configuration
 * @property {function} getSASLConfig - Returns SASL authentication configuration
 * @property {function} getConnectionTimeout - Returns connection timeout in ms
 * @property {function} getRequestTimeout - Returns request timeout in ms
 */
interface KafkaConnection extends MessageQueueConnection {
  getBrokers(): string[];
  getSSLConfig(): Record<string, unknown>;
  getSASLConfig(): SASLOptions | Mechanism | undefined;
  getConnectionTimeout(): number;
  getRequestTimeout(): number;
}

/**
 * Message content interface for producing messages
 *
 * @interface MessageContent
 * @property {string} [key] - Optional message key for partitioning
 * @property {string | Buffer} value - Message content as string or buffer
 */
interface MessageContent {
  key?: string;
  value: string | Buffer;
}

/**
 * RedPanda service configuration interface
 *
 * @interface RedPandaServiceConfig
 * @property {boolean} enabled - Whether the service is enabled
 * @property {KafkaConnection} connection - RedPanda/Kafka connection configuration
 * @property {string} clientId - Unique identifier for this client
 * @property {Object} [consumer] - Consumer configuration
 * @property {string} consumer.groupId - Consumer group identifier
 * @property {number} [consumer.sessionTimeout] - Session timeout in ms
 * @property {number} [consumer.rebalanceTimeout] - Rebalance timeout in ms
 * @property {number} [consumer.heartbeatInterval] - Heartbeat interval in ms
 * @property {number} [consumer.maxBytesPerPartition] - Max bytes per partition
 * @property {number} [consumer.maxWaitTimeInMs] - Max wait time for fetch requests
 * @property {Object} [producer] - Producer configuration
 * @property {number} [producer.acks] - Required acks for produced messages
 * @property {CompressionTypes} [producer.compression] - Message compression type
 * @property {number} [producer.maxBatchSize] - Maximum size of message batches
 * @property {boolean} [producer.allowAutoTopicCreation] - Auto create topics
 * @property {number} [producer.transactionTimeout] - Transaction timeout in ms
 * @property {boolean} [producer.idempotent] - Enable idempotent producer
 * @property {Object} [healthCheck] - Health check configuration
 * @property {boolean} healthCheck.enabled - Enable health checks
 * @property {number} healthCheck.interval - Health check interval in ms
 * @property {number} healthCheck.timeout - Health check timeout in ms
 * @property {number} healthCheck.retries - Number of retries for health checks
 */
interface RedPandaServiceConfig {
  enabled: boolean;
  connection: KafkaConnection;
  clientId: string;
  consumer?: {
    groupId: string;
    sessionTimeout?: number;
    rebalanceTimeout?: number;
    heartbeatInterval?: number;
    maxBytesPerPartition?: number;
    maxWaitTimeInMs?: number;
  };
  producer?: {
    allowAutoTopicCreation?: boolean;
    maxInFlightRequests?: number;
    idempotent?: boolean;
    transactionalId?: string;
    transactionTimeout?: number;
    metadataMaxAge?: number;
  };
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
    retries: number;
  };
}

/**
 * RedPanda service implementation providing Kafka protocol compatibility
 * and message streaming capabilities.
 *
 * @class RedPandaService
 * @extends {BaseServiceClient<RedPandaServiceConfig>}
 */
export class RedPandaService extends BaseServiceClient<RedPandaServiceConfig> {
  /**
   * Kafka client instance
   * @private
   */
  private kafka: Kafka | null = null;

  /**
   * Kafka producer instance
   * @private
   */
  private producer: Producer | null = null;

  /**
   * Kafka consumer instance
   * @private
   */
  private consumer: Consumer | null = null;

  /**
   * Default producer configuration
   * @private
   */
  private readonly defaultProducerConfig: ProducerConfig = {
    allowAutoTopicCreation: true,
    maxInFlightRequests: 5,
    idempotent: false,
  };

  /**
   * Default consumer configuration
   * @private
   */
  private readonly defaultConsumerConfig: Partial<ConsumerConfig> = {
    sessionTimeout: 30000,
    rebalanceTimeout: 60000,
    heartbeatInterval: 3000,
    maxBytesPerPartition: 1048576,
    maxWaitTimeInMs: 5000,
  };

  /**
   * Creates a new RedPanda service instance
   * @param {RedPandaServiceConfig} config - Service configuration
   */
  constructor(config: RedPandaServiceConfig) {
    super(config, "RedPanda");
  }

  /**
   * Establishes connections to RedPanda cluster
   * @returns {Promise<void>}
   * @throws {ApplicationError} If connection fails
   */
  async connect(): Promise<void> {
    if (!this.isEnabled()) {
      logger.info("RedPanda service is disabled");
      return;
    }

    try {
      const kafkaConfig = this.createKafkaConfig();
      this.kafka = new Kafka(kafkaConfig);

      // Initialize and connect producer
      this.producer = this.kafka.producer(this.createProducerConfig());
      await this.producer.connect();
      logger.info("RedPanda producer connected", {
        clientId: this.config.clientId,
        endpoint: this.config.connection.getBrokerEndpoint(),
      });

      // Initialize and connect consumer if configured
      if (this.config.consumer?.groupId) {
        this.consumer = this.kafka.consumer(this.createConsumerConfig());
        await this.consumer.connect();
        logger.info("RedPanda consumer connected", {
          groupId: this.config.consumer.groupId,
          clientId: this.config.clientId,
        });
      }

      this.setStatus(ServiceStatus.CONNECTED);

      if (this.config.healthCheck?.enabled) {
        await this.startHealthCheck();
      }
    } catch (error) {
      this.setStatus(ServiceStatus.ERROR);
      throw new ApplicationError(
        "Failed to connect to RedPanda",
        ErrorCode.MESSAGE_QUEUE_ERROR,
        500,
        { error: String(error) }
      );
    }
  }

  /**
   * Closes all connections and performs cleanup
   * @returns {Promise<void>}
   * @throws {ApplicationError} If disconnection fails
   */
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

      this.kafka = null;
      this.setStatus(ServiceStatus.DISCONNECTED);
    } catch (error) {
      this.setStatus(ServiceStatus.ERROR);
      throw new ApplicationError(
        "Failed to disconnect from RedPanda",
        ErrorCode.CONNECTION_ERROR,
        500,
        { error: String(error) }
      );
    }
  }

  /**
   * Performs health check on RedPanda connections
   * @returns {Promise<HealthCheckResult>}
   * @protected
   */
  protected async checkHealth(): Promise<HealthCheckResult> {
    if (!this.kafka) {
      return {
        status: "unhealthy",
        message: "RedPanda client not initialized",
        timestamp: new Date(),
      };
    }

    try {
      const admin = this.kafka.admin();
      await admin.listTopics();
      await admin.disconnect();

      return {
        status: "healthy",
        message: "RedPanda is responsive",
        details: {
          brokerEndpoint: this.config.connection.getBrokerEndpoint(),
          schemaRegistryEndpoint:
            this.config.connection.getSchemaRegistryEndpoint(),
          clientId: this.config.clientId,
          producerConnected: Boolean(this.producer),
          consumerConnected: Boolean(this.consumer),
          consumerGroupId: this.config.consumer?.groupId,
          brokerId: this.config.connection.getBrokerId(),
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Gets the Kafka producer instance
   * @returns {Producer}
   * @throws {ApplicationError} If producer is not initialized
   */
  getProducer(): Producer {
    if (!this.producer) {
      throw new ApplicationError(
        "RedPanda producer not initialized",
        ErrorCode.SERVICE_NOT_INITIALIZED,
        500
      );
    }
    return this.producer;
  }

  /**
   * Gets the Kafka consumer instance
   * @returns {Consumer}
   * @throws {ApplicationError} If consumer is not initialized
   */
  getConsumer(): Consumer {
    if (!this.consumer) {
      throw new ApplicationError(
        "RedPanda consumer not initialized",
        ErrorCode.SERVICE_NOT_INITIALIZED,
        500
      );
    }
    return this.consumer;
  }

  /**
   * Creates Kafka client configuration
   * @returns {KafkaConfig}
   * @private
   */
  private createKafkaConfig(): KafkaConfig {
    return {
      clientId: this.config.clientId,
      brokers: [this.config.connection.getBrokerEndpoint()],
      ssl: this.config.connection.getSSLConfig(),
      sasl: this.config.connection.getSASLConfig(),
      connectionTimeout: this.config.connection.getConnectionTimeout(),
      requestTimeout: this.config.connection.getRequestTimeout(),
    };
  }

  /**
   * Creates producer configuration
   * @returns {ProducerConfig}
   * @private
   */
  private createProducerConfig(): ProducerConfig {
    // Only include properties that exist in ProducerConfig
    const config: ProducerConfig = {
      allowAutoTopicCreation:
        this.config.producer?.allowAutoTopicCreation ??
        this.defaultProducerConfig.allowAutoTopicCreation,
      maxInFlightRequests: this.defaultProducerConfig.maxInFlightRequests,
      idempotent:
        this.config.producer?.idempotent ??
        this.defaultProducerConfig.idempotent,
    };

    return config;
  }

  /**
   * Creates consumer configuration
   * @returns {ConsumerConfig}
   * @throws {ApplicationError} If consumer group ID is missing
   * @private
   */
  private createConsumerConfig(): ConsumerConfig {
    if (!this.config.consumer?.groupId) {
      throw new ApplicationError(
        "Consumer group ID is required",
        ErrorCode.REDPANDA_CONFIG_INVALID,
        500
      );
    }

    return {
      ...this.defaultConsumerConfig,
      ...this.config.consumer,
      groupId: this.config.consumer.groupId, // Ensure groupId is applied last
    };
  }

  /**
   * Subscribes to specified topics
   * @param {string[]} topics - Array of topics to subscribe to
   * @returns {Promise<void>}
   * @throws {ApplicationError} If subscription fails
   */
  async subscribe(topics: string[]): Promise<void> {
    const consumer = this.getConsumer();
    try {
      await Promise.all(
        topics.map((topic) =>
          consumer.subscribe({ topic, fromBeginning: false })
        )
      );
      logger.info("Subscribed to topics", { topics });
    } catch (error) {
      throw new ApplicationError(
        "Failed to subscribe to topics",
        ErrorCode.OPERATION_ERROR,
        500,
        { error: String(error), topics }
      );
    }
  }

  /**
   * Sends messages to specified topic
   * @param {string} topic - Topic to send message to
   * @param {MessageContent[]} messages - Array of messages to send
   * @param {number} [partition] - Optional partition number
   * @returns {Promise<void>}
   * @throws {ApplicationError} If sending fails
   */
  async send(
    topic: string,
    messages: MessageContent[],
    partition?: number
  ): Promise<void> {
    const producer = this.getProducer();
    try {
      await producer.send({
        topic,
        messages: messages.map((msg) => ({
          partition,
          key: msg.key,
          value: msg.value,
        })),
      });
    } catch (error) {
      throw new ApplicationError(
        "Failed to send messages",
        ErrorCode.OPERATION_ERROR,
        500,
        { error: String(error), topic }
      );
    }
  }
}

export default RedPandaService;
