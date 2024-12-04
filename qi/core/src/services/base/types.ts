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
 * @modified 2024-12-05
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
