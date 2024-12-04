/**
 * @fileoverview Base service client abstract implementation
 * @module @qi/core/services/base/client
 *
 * @description
 * Provides the foundation for all service client implementations in the system.
 * This abstract class defines the core functionality and contracts that all
 * service implementations must fulfill, including:
 *
 * Key features:
 * - Standardized service lifecycle management
 * - Health check infrastructure
 * - Configuration validation
 * - Status tracking
 * - Error handling patterns
 *
 * Services that extend this base include:
 * - Database services (TimescaleDB, QuestDB)
 * - Cache services (Redis)
 * - Message queue services (Redpanda)
 *
 * @example Implementing a custom service
 * ```typescript
 * class MyService extends BaseServiceClient<MyConfig> {
 *   constructor(config: MyConfig) {
 *     super(config, 'MyService');
 *   }
 *
 *   async connect(): Promise<void> {
 *     // Connection implementation
 *   }
 *
 *   async disconnect(): Promise<void> {
 *     // Disconnection implementation
 *   }
 *
 *   protected async checkHealth(): Promise<HealthCheckResult> {
 *     // Health check implementation
 *   }
 * }
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-05
 * @created 2024-12-04
 */

import { logger } from "@qi/core/logger";
import {
  ServiceConfig,
  ServiceClient,
  ServiceStatus,
  HealthCheckResult,
} from "./types.js";

/**
 * Abstract base class for service client implementations
 * @abstract
 * @class BaseServiceClient
 * @implements {ServiceClient<T>}
 * @template T - Service configuration type extending ServiceConfig
 */
export abstract class BaseServiceClient<T extends ServiceConfig>
  implements ServiceClient<T>
{
  /**
   * Current service status
   * @protected
   */
  protected status: ServiceStatus = ServiceStatus.INITIALIZING;

  /**
   * Result of the last health check
   * @protected
   */
  protected lastHealthCheck?: HealthCheckResult;

  /**
   * Creates an instance of BaseServiceClient
   *
   * @param {T} config - Service configuration
   * @param {string} serviceName - Name of the service for logging
   *
   * @throws {Error} When configuration validation fails
   *
   * @example
   * ```typescript
   * super(config, 'MyService');
   * ```
   */
  constructor(
    protected readonly config: T,
    protected readonly serviceName: string
  ) {
    this.validateConfig();
  }

  /**
   * Checks if the service is enabled
   *
   * @returns {boolean} True if service is enabled
   *
   * @example
   * ```typescript
   * if (service.isEnabled()) {
   *   await service.connect();
   * }
   * ```
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Establishes connection to the service
   * @abstract
   * @returns {Promise<void>}
   */
  abstract connect(): Promise<void>;

  /**
   * Disconnects from the service
   * @abstract
   * @returns {Promise<void>}
   */
  abstract disconnect(): Promise<void>;

  /**
   * Performs service-specific health check
   * @abstract
   * @protected
   * @returns {Promise<HealthCheckResult>}
   */
  protected abstract checkHealth(): Promise<HealthCheckResult>;

  /**
   * Checks if the service is healthy
   *
   * @returns {Promise<boolean>} True if service is healthy
   *
   * @example
   * ```typescript
   * const healthy = await service.isHealthy();
   * console.log(`Service is ${healthy ? 'healthy' : 'unhealthy'}`);
   * ```
   */
  async isHealthy(): Promise<boolean> {
    try {
      this.lastHealthCheck = await this.checkHealth();
      return this.lastHealthCheck.status === "healthy";
    } catch (error) {
      logger.error(`Health check failed for ${this.serviceName}`, { error });
      return false;
    }
  }

  /**
   * Gets the current service configuration
   *
   * @returns {T} Service configuration
   *
   * @example
   * ```typescript
   * const config = service.getConfig();
   * console.log(`Service TTL: ${config.ttl}`);
   * ```
   */
  getConfig(): T {
    return this.config;
  }

  /**
   * Updates service status and logs the change
   *
   * @protected
   * @param {ServiceStatus} status - New service status
   *
   * @example
   * ```typescript
   * this.setStatus('connected');
   * ```
   */
  protected setStatus(status: ServiceStatus): void {
    this.status = status;
    logger.info(`${this.serviceName} status changed to ${status}`);
  }

  /**
   * Validates service configuration
   *
   * @protected
   * @throws {Error} When configuration is invalid
   *
   * @example
   * ```typescript
   * protected validateConfig(): void {
   *   super.validateConfig();
   *   if (!this.config.customField) {
   *     throw new Error('customField is required');
   *   }
   * }
   * ```
   */
  protected validateConfig(): void {
    if (!this.config) {
      throw new Error(`${this.serviceName} configuration is required`);
    }

    if (this.config.healthCheck?.enabled) {
      if (
        !this.config.healthCheck.interval ||
        !this.config.healthCheck.timeout
      ) {
        throw new Error(
          `Invalid health check configuration for ${this.serviceName}`
        );
      }
    }
  }

  /**
   * Initiates periodic health checks if enabled in configuration
   *
   * @protected
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * await this.startHealthCheck();
   * ```
   */
  protected async startHealthCheck(): Promise<void> {
    if (!this.config.healthCheck?.enabled) {
      return;
    }

    const interval = this.config.healthCheck.interval;
    setInterval(async () => {
      try {
        await this.isHealthy();
      } catch (error) {
        logger.error(`Health check failed for ${this.serviceName}`, { error });
      }
    }, interval);
  }
}
