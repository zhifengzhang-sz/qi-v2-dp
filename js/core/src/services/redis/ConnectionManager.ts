// src/services/redis/RedisConnectionManager.ts

import { createClient, RedisClientType } from 'redis';
import { logger } from '@qi/core/logger';

/**
 * @class RedisConnectionManager
 * @description Manages Redis client connections using the singleton pattern
 */
export class RedisConnectionManager {
  /** Singleton instance */
  private static instance: RedisConnectionManager;
  /** Redis client instance */
  private client: RedisClientType;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.client = createClient({
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    });

    this.client.on('error', (error) => {
      logger.error('Redis Client Error:', error);
    });

    this.client.on('connect', () => {
      logger.info('Redis Client Connected');
    });
  }

  /**
   * Gets the singleton instance of RedisConnectionManager
   * @returns RedisConnectionManager instance
   */
  public static getInstance(): RedisConnectionManager {
    if (!RedisConnectionManager.instance) {
      RedisConnectionManager.instance = new RedisConnectionManager();
    }
    return RedisConnectionManager.instance;
  }

  /**
   * Connects to Redis server
   * @throws Will throw an error if connection fails
   */
  public async connect(): Promise<void> {
    try {
      await this.client.connect();
      logger.info('Connected to Redis successfully.');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Disconnects from Redis server
   * @throws Will throw an error if disconnection fails
   */
  public async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
      logger.info('Disconnected from Redis successfully.');
    } catch (error) {
      logger.error('Failed to disconnect from Redis:', error);
      throw error;
    }
  }

  /**
   * Gets the Redis client instance
   * @returns RedisClientType instance
   */
  public getClient(): RedisClientType {
    return this.client;
  }
}