1. `qi/core/src/services/base/types.ts`:
```ts
/**
 * @fileoverview Base service type definitions and interfaces
 * @module @qi/core/services/base/types
 *
 * @description
 * Defines core type definitions and interfaces for the service infrastructure.
 * These types provide the foundation for implementing service wrappers around
 * various backends like databases, message queues, and caches.
 *
 * Features:
 * - Common service configuration interfaces
 * - Health check types and status enums
 * - Base service client interface
 * - Connection configuration
 * - Error handling types
 *
 * This module is used as the basis for implementing specific services like:
 * - Database services (TimescaleDB, QuestDB)
 * - Cache services (Redis)
 * - Message queue services (Redpanda)
 *
 * @example
 * ```typescript
 * // Implementing a custom service
 * class MyService extends BaseServiceClient<MyConfig> {
 *   constructor(config: MyConfig) {
 *     super(config, 'MyService');
 *   }
 * }
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-12-04
 */
  
/**
 * Base configuration interface for all services
 * @interface ServiceConfig
 *
 * @property {boolean} enabled - Whether the service is enabled
 * @property {Object} [healthCheck] - Optional health check configuration
 * @property {boolean} healthCheck.enabled - Whether health checks are enabled
 * @property {number} healthCheck.interval - Interval between health checks in ms
 * @property {number} healthCheck.timeout - Timeout for health checks in ms
 * @property {number} healthCheck.retries - Number of retries for failed health checks
 */
export interface ServiceConfig {
  enabled: boolean;
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
    retries: number;
  };
}
  
/**
 * Common connection properties shared across services
 * @interface ConnectionConfig
 *
 * @property {string} host - Service host address
 * @property {number} port - Service port number
 * @property {string} [username] - Optional username for authentication
 * @property {string} [password] - Optional password for authentication
 */
export interface ConnectionConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}
  
/**
 * Base interface for service clients
 * @interface ServiceClient
 * @template T - Service configuration type extending ServiceConfig
 *
 * @property {function} isEnabled - Check if service is enabled
 * @property {function} isHealthy - Check service health status
 * @property {function} getConfig - Get service configuration
 * @property {function} connect - Establish service connection
 * @property {function} disconnect - Close service connection
 */
export interface ServiceClient<T extends ServiceConfig> {
  isEnabled(): boolean;
  isHealthy(): Promise<boolean>;
  getConfig(): T;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
  
/**
 * Health check result interface
 * @interface HealthCheckResult
 *
 * @property {('healthy'|'unhealthy')} status - Health check status
 * @property {string} [message] - Optional status message
 * @property {Object} [details] - Optional detailed status information
 * @property {Date} timestamp - Time when health check was performed
 */
export interface HealthCheckResult {
  status: "healthy" | "unhealthy";
  message?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}
  
/**
 * Service status enumeration
 * @enum {string}
 *
 * @property {string} INITIALIZING - Service is initializing
 * @property {string} CONNECTED - Service is connected and ready
 * @property {string} DISCONNECTED - Service is disconnected
 * @property {string} ERROR - Service encountered an error
 */
export enum ServiceStatus {
  INITIALIZING = "initializing",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  ERROR = "error",
}
  
/**
 * Base service error class
 * @class ServiceError
 * @extends Error
 *
 * @property {string} service - Name of the service where error occurred
 * @property {string} code - Error code for categorization
 * @property {Object} [details] - Additional error details
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly service: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ServiceError";
  }
}
  
```  
  
2. `qi/core/src/services/base/client.ts`:
```ts
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
      logger.error(`Health check failed for <img src="https://latex.codecogs.com/gif.latex?{this.serviceName}`,%20{%20error%20});%20%20%20%20%20%20return%20false;%20%20%20%20}%20%20}%20%20/**%20%20%20*%20Gets%20the%20current%20service%20configuration%20%20%20*%20%20%20*%20@returns%20{T}%20Service%20configuration%20%20%20*%20%20%20*%20@example%20%20%20*%20```typescript%20%20%20*%20const%20config%20=%20service.getConfig();%20%20%20*%20console.log(`Service%20TTL:"/>{config.ttl}`);
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
    logger.info(`<img src="https://latex.codecogs.com/gif.latex?{this.serviceName}%20status%20changed%20to"/>{status}`);
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
      throw new Error(`<img src="https://latex.codecogs.com/gif.latex?{this.serviceName}%20configuration%20is%20required`);%20%20%20%20}%20%20%20%20if%20(this.config.healthCheck?.enabled)%20{%20%20%20%20%20%20if%20(%20%20%20%20%20%20%20%20!this.config.healthCheck.interval%20||%20%20%20%20%20%20%20%20!this.config.healthCheck.timeout%20%20%20%20%20%20)%20{%20%20%20%20%20%20%20%20throw%20new%20Error(%20%20%20%20%20%20%20%20%20%20`Invalid%20health%20check%20configuration%20for"/>{this.serviceName}`
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
        logger.error(`Health check failed for <img src="https://latex.codecogs.com/gif.latex?{this.serviceName}`,%20{%20error%20});%20%20%20%20%20%20}%20%20%20%20},%20interval);%20%20}}```%20%203.%20`qi/core/src/services/base/manager.ts`:```ts%20block_code=true%20class=&quot;line-numbers&quot;%20%20/**%20*%20@fileoverview%20Service%20connection%20manager%20implementation%20*%20@module%20@qi/core/services/base/manager%20*%20*%20@description%20*%20Provides%20centralized%20management%20of%20service%20connections%20and%20health%20monitoring.%20*%20This%20manager%20handles:%20*%20-%20Service%20registration%20*%20-%20Connection%20lifecycle%20*%20-%20Health%20status%20monitoring%20*%20-%20Coordinated%20startup/shutdown%20*%20*%20Used%20to%20manage%20all%20service%20types%20including:%20*%20-%20Database%20services%20*%20-%20Cache%20services%20*%20-%20Message%20queue%20services%20*%20*%20@example%20Basic%20Usage%20*%20```typescript%20*%20const%20manager%20=%20new%20ServiceConnectionManager();%20*%20*%20//%20Register%20services%20*%20manager.registerService(&#39;redis&#39;,%20redisService);%20*%20manager.registerService(&#39;db&#39;,%20dbService);%20*%20*%20//%20Start%20all%20services%20*%20await%20manager.connectAll();%20*%20*%20//%20Monitor%20health%20*%20const%20status%20=%20await%20manager.getHealthStatus();%20*%20```%20*%20*%20@author%20Zhifeng%20Zhang%20*%20@created%202024-12-04%20*/import%20{%20logger%20}%20from%20&quot;@qi/core/logger&quot;;import%20{%20ServiceClient,%20ServiceConfig%20}%20from%20&quot;./types.js&quot;;/**%20*%20Manages%20service%20connections%20and%20lifecycle%20*%20@class%20ServiceConnectionManager%20*/export%20class%20ServiceConnectionManager%20{%20%20/**%20%20%20*%20Map%20of%20registered%20services%20%20%20*%20@private%20%20%20*/%20%20private%20services:%20Map&lt;string,%20ServiceClient&lt;ServiceConfig&gt;&gt;%20=%20new%20Map();%20%20/**%20%20%20*%20Registers%20a%20new%20service%20with%20the%20manager%20%20%20*%20%20%20*%20@param%20{string}%20name%20-%20Unique%20service%20identifier%20%20%20*%20@param%20{ServiceClient&lt;ServiceConfig&gt;}%20service%20-%20Service%20instance%20%20%20*%20@throws%20{Error}%20If%20service%20name%20is%20already%20registered%20%20%20*%20%20%20*%20@example%20%20%20*%20```typescript%20%20%20*%20manager.registerService(&#39;redis&#39;,%20new%20RedisService(config));%20%20%20*%20```%20%20%20*/%20%20registerService(name:%20string,%20service:%20ServiceClient&lt;ServiceConfig&gt;):%20void%20{%20%20%20%20if%20(this.services.has(name))%20{%20%20%20%20%20%20throw%20new%20Error(`Service"/>{name} is already registered`);
    }
    this.services.set(name, service);
    logger.info(`Service <img src="https://latex.codecogs.com/gif.latex?{name}%20registered`);%20%20}%20%20/**%20%20%20*%20Connects%20all%20enabled%20services%20%20%20*%20%20%20*%20@returns%20{Promise&lt;void&gt;}%20%20%20*%20@throws%20{Error}%20If%20any%20service%20connection%20fails%20%20%20*%20%20%20*%20@example%20%20%20*%20```typescript%20%20%20*%20try%20{%20%20%20*%20%20%20await%20manager.connectAll();%20%20%20*%20%20%20console.log(&#39;All%20services%20connected&#39;);%20%20%20*%20}%20catch%20(error)%20{%20%20%20*%20%20%20console.error(&#39;Service%20startup%20failed&#39;,%20error);%20%20%20*%20}%20%20%20*%20```%20%20%20*/%20%20async%20connectAll():%20Promise&lt;void&gt;%20{%20%20%20%20const%20services%20=%20Array.from(this.services.entries());%20%20%20%20for%20(const%20[name,%20service]%20of%20services)%20{%20%20%20%20%20%20if%20(!service.isEnabled())%20{%20%20%20%20%20%20%20%20logger.info(`Skipping%20disabled%20service:"/>{name}`);
        continue;
      }
  
      try {
        await service.connect();
        logger.info(`Successfully connected to <img src="https://latex.codecogs.com/gif.latex?{name}`);%20%20%20%20%20%20}%20catch%20(error)%20{%20%20%20%20%20%20%20%20logger.error(`Failed%20to%20connect%20to"/>{name}`, { error });
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
        logger.info(`Successfully disconnected from <img src="https://latex.codecogs.com/gif.latex?{name}`);%20%20%20%20%20%20}%20catch%20(error)%20{%20%20%20%20%20%20%20%20logger.error(`Failed%20to%20disconnect%20from"/>{name}`, { error });
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
  
```  
  
4. `qi/core/src/services/base/index.ts`
```ts
/**
 * @fileoverview Service base module exports
 * @module @qi/core/services/base
 *
 * @description
 * Exports all base service components including:
 * - Type definitions
 * - Base service client
 * - Service manager
 *
 * This module serves as the foundation for all service implementations
 * in the system.
 *
 * @example
 * ```typescript
 * import { BaseServiceClient, ServiceConfig, ServiceConnectionManager } from '@qi/core/services/base';
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-12-04
 */
  
export * from "./types.js";
export * from "./client.js";
export * from "./manager.js";
  
```  
  