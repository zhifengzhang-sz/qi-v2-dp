/**
 * @fileoverview Service connection manager implementation
 * @module @qi/core/services/base/manager
 *
 * @description
 * Provides centralized management of service connections and health monitoring.
 * This manager handles:
 * - Service registration
 * - Connection lifecycle
 * - Health status monitoring
 * - Coordinated startup/shutdown
 *
 * Used to manage all service types including:
 * - Database services
 * - Cache services
 * - Message queue services
 *
 * @example Basic Usage
 * ```typescript
 * const manager = new ServiceConnectionManager();
 *
 * // Register services
 * manager.registerService('redis', redisService);
 * manager.registerService('db', dbService);
 *
 * // Start all services
 * await manager.connectAll();
 *
 * // Monitor health
 * const status = await manager.getHealthStatus();
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-05
 * @created 2024-12-04
 */

import { logger } from "@qi/core/logger";
import { ServiceClient, ServiceConfig } from "./types.js";

/**
 * Manages service connections and lifecycle
 * @class ServiceConnectionManager
 */
export class ServiceConnectionManager {
  /**
   * Map of registered services
   * @private
   */
  private services: Map<string, ServiceClient<ServiceConfig>> = new Map();

  /**
   * Registers a new service with the manager
   *
   * @param {string} name - Unique service identifier
   * @param {ServiceClient<ServiceConfig>} service - Service instance
   * @throws {Error} If service name is already registered
   *
   * @example
   * ```typescript
   * manager.registerService('redis', new RedisService(config));
   * ```
   */
  registerService(name: string, service: ServiceClient<ServiceConfig>): void {
    if (this.services.has(name)) {
      throw new Error(`Service ${name} is already registered`);
    }
    this.services.set(name, service);
    logger.info(`Service ${name} registered`);
  }

  /**
   * Connects all enabled services
   *
   * @returns {Promise<void>}
   * @throws {Error} If any service connection fails
   *
   * @example
   * ```typescript
   * try {
   *   await manager.connectAll();
   *   console.log('All services connected');
   * } catch (error) {
   *   console.error('Service startup failed', error);
   * }
   * ```
   */
  async connectAll(): Promise<void> {
    const services = Array.from(this.services.entries());

    for (const [name, service] of services) {
      if (!service.isEnabled()) {
        logger.info(`Skipping disabled service: ${name}`);
        continue;
      }

      try {
        await service.connect();
        logger.info(`Successfully connected to ${name}`);
      } catch (error) {
        logger.error(`Failed to connect to ${name}`, { error });
        throw error;
      }
    }
  }

  /**
   * Disconnects all services
   *
   * @returns {Promise<void>}
   * Continues even if individual services fail to disconnect
   *
   * @example
   * ```typescript
   * await manager.disconnectAll();
   * console.log('All services disconnected');
   * ```
   */
  async disconnectAll(): Promise<void> {
    const services = Array.from(this.services.entries());

    for (const [name, service] of services) {
      try {
        await service.disconnect();
        logger.info(`Successfully disconnected from ${name}`);
      } catch (error) {
        logger.error(`Failed to disconnect from ${name}`, { error });
      }
    }
  }

  /**
   * Gets health status for all enabled services
   *
   * @returns {Promise<Record<string, boolean>>} Map of service names to health status
   *
   * @example
   * ```typescript
   * const status = await manager.getHealthStatus();
   * for (const [service, healthy] of Object.entries(status)) {
   *   console.log(`${service}: ${healthy ? 'healthy' : 'unhealthy'}`);
   * }
   * ```
   */
  async getHealthStatus(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {};

    for (const [name, service] of this.services) {
      if (!service.isEnabled()) {
        continue;
      }
      status[name] = await service.isHealthy();
    }

    return status;
  }
}
