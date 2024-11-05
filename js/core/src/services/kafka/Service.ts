// src/services/kafka/Service.ts

import { KafkaConnectionManager } from './ConnectionManager.js';
import { logger } from '@qi/core/logger';

/**
 * @class KafkaService
 * @description Provides high-level Kafka operations
 * 
 * @example
 * const kafkaService = KafkaService.getInstance();
 * await kafkaService.connect();
 * await kafkaService.sendMessage('topic-name', { key: 'value' });
 * await kafkaService.disconnect();
 */
export class KafkaService {
  /** Singleton instance */
  private static instance: KafkaService;
  /** Kafka connection manager */
  private connectionManager: KafkaConnectionManager;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.connectionManager = KafkaConnectionManager.getInstance();
  }

  /**
   * Gets the singleton instance of KafkaService
   * @returns KafkaService instance
   */
  public static getInstance(): KafkaService {
    if (!KafkaService.instance) {
      KafkaService.instance = new KafkaService();
    }
    return KafkaService.instance;
  }

  /**
   * Connects to Kafka
   */
  public async connect(): Promise<void> {
    await this.connectionManager.connect();
  }

  /**
   * Disconnects from Kafka
   */
  public async disconnect(): Promise<void> {
    await this.connectionManager.disconnect();
  }

  /**
   * Sends a message to a Kafka topic
   * @param topic Kafka topic name
   * @param messages Messages to send
   */
  public async sendMessage(topic: string, messages: any[]): Promise<void> {
    try {
      await this.connectionManager.getProducer().send({
        topic,
        messages: messages.map(msg => ({
          value: JSON.stringify(msg),
        })),
      });
      logger.info(`Message sent to topic "${topic}"`);
    } catch (error) {
      logger.error(`Failed to send message to topic "${topic}":`, error);
      throw error;
    }
  }

  /**
   * Subscribes to a Kafka topic and processes incoming messages
   * @param topic Kafka topic name
   * @param fromBeginning Whether to read messages from the beginning
   * @param handler Function to handle each message
   */
  public async subscribe(
    topic: string,
    fromBeginning: boolean,
    handler: (message: any) => void
  ): Promise<void> {
    const consumer = this.connectionManager.getConsumer();
    await consumer.subscribe({ topic, fromBeginning });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const parsedMessage = message.value ? JSON.parse(message.value.toString()) : null;
          handler(parsedMessage);
        } catch (error) {
          logger.error(`Failed to process message from topic "${topic}":`, error);
        }
      },
    });

    logger.info(`Subscribed to topic "${topic}"`);
  }
}