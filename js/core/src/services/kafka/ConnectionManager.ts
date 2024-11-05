// src/services/kafka/KafkaConnectionManager.ts

import { Kafka, Producer, Consumer } from 'kafkajs';
import { logger } from '@qi/core/logger';

/**
 * @class KafkaConnectionManager
 * @description Manages Kafka producer and consumer connections using the singleton pattern
 */
export class KafkaConnectionManager {
  /** Singleton instance */
  private static instance: KafkaConnectionManager;
  /** Kafka client instance */
  private kafka: Kafka;
  /** Kafka producer instance */
  private producer: Producer;
  /** Kafka consumer instance */
  private consumer: Consumer;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'my-app',
      brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID || 'default-group' });

    this.producer.on('producer.connect', () => {
      logger.info('Kafka Producer Connected');
    });

    this.producer.on('producer.disconnect', () => {
      logger.warn('Kafka Producer Disconnected');
    });

    this.consumer.on('consumer.connect', () => {
      logger.info('Kafka Consumer Connected');
    });

    this.consumer.on('consumer.disconnect', () => {
      logger.warn('Kafka Consumer Disconnected');
    });

    this.consumer.on('consumer.crash', (error) => {
      logger.error('Kafka Consumer Crashed:', error);
    });
  }

  /**
   * Gets the singleton instance of KafkaConnectionManager
   * @returns KafkaConnectionManager instance
   */
  public static getInstance(): KafkaConnectionManager {
    if (!KafkaConnectionManager.instance) {
      KafkaConnectionManager.instance = new KafkaConnectionManager();
    }
    return KafkaConnectionManager.instance;
  }

  /**
   * Connects the Kafka producer and consumer
   * @throws Will throw an error if connection fails
   */
  public async connect(): Promise<void> {
    try {
      await this.producer.connect();
      await this.consumer.connect();
      logger.info('Connected to Kafka successfully.');
    } catch (error) {
      logger.error('Failed to connect to Kafka:', error);
      throw error;
    }
  }

  /**
   * Disconnects the Kafka producer and consumer
   * @throws Will throw an error if disconnection fails
   */
  public async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      await this.consumer.disconnect();
      logger.info('Disconnected from Kafka successfully.');
    } catch (error) {
      logger.error('Failed to disconnect from Kafka:', error);
      throw error;
    }
  }

  /**
   * Gets the Kafka producer instance
   * @returns Producer instance
   */
  public getProducer(): Producer {
    return this.producer;
  }

  /**
   * Gets the Kafka consumer instance
   * @returns Consumer instance
   */
  public getConsumer(): Consumer {
    return this.consumer;
  }
}