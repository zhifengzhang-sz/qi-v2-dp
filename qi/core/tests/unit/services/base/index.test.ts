/**
 * @fileoverview Base Service Module Unit Tests
 * @module @qi/core/services/base/tests/index.test
 *
 * @description
 * Comprehensive test suite for the base service module components including:
 * - BaseServiceClient abstract implementation
 * - ServiceConnectionManager
 * - Service lifecycle management
 * - Health check functionality
 * - Configuration validation
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-05
 * @created 2024-12-05
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  BaseServiceClient,
  ServiceConfig,
  ServiceStatus,
  HealthCheckResult,
  ServiceConnectionManager,
} from "@qi/core/services/base";
import { logger } from "@qi/core/logger";

// Mock logger
vi.mock("@qi/core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

/**
 * Test implementation of BaseServiceClient for testing purposes
 * Implements all abstract methods and exposes protected methods for testing
 *
 * @class TestService
 * @extends BaseServiceClient<ServiceConfig>
 */
class TestService extends BaseServiceClient<ServiceConfig> {
  public status: ServiceStatus = ServiceStatus.INITIALIZING;

  /**
   * Creates an instance of TestService
   * @param {ServiceConfig} config - Service configuration
   */
  constructor(config: ServiceConfig) {
    super(config, "TestService");
  }

  /**
   * Implementation of abstract connect method
   * @returns {Promise<void>}
   */
  async connect(): Promise<void> {
    this.setStatus(ServiceStatus.CONNECTED);
  }

  /**
   * Implementation of abstract disconnect method
   * @returns {Promise<void>}
   */
  async disconnect(): Promise<void> {
    this.setStatus(ServiceStatus.DISCONNECTED);
  }

  /**
   * Implementation of abstract checkHealth method
   * @protected
   * @returns {Promise<HealthCheckResult>}
   */
  protected async checkHealth(): Promise<HealthCheckResult> {
    return {
      status: "healthy",
      message: "Test service is healthy",
      details: { test: true },
      timestamp: new Date(),
    };
  }

  /**
   * Exposes protected validateConfig method for testing
   * @public
   */
  public validateConfigTest(): void {
    this.validateConfig();
  }

  /**
   * Exposes protected setStatus method for testing
   * @public
   * @param {ServiceStatus} status - New service status
   */
  public setStatusTest(status: ServiceStatus): void {
    this.setStatus(status);
  }
}

describe("Base Service Module", () => {
  describe("BaseServiceClient", () => {
    let config: ServiceConfig;
    let service: TestService;

    beforeEach(() => {
      config = {
        enabled: true,
        healthCheck: {
          enabled: true,
          interval: 5000,
          timeout: 1000,
          retries: 3,
        },
      };
      service = new TestService(config);
      vi.clearAllMocks();
    });

    describe("initialization", () => {
      it("creates service with valid config", () => {
        expect(service).toBeDefined();
        expect(service.isEnabled()).toBe(true);
        expect(service.getConfig()).toEqual(config);
      });

      it("throws error on invalid config", () => {
        expect(
          () => new TestService(null as unknown as ServiceConfig)
        ).toThrow();
      });

      it("validates health check config", () => {
        const invalidConfig: ServiceConfig = {
          enabled: true,
          healthCheck: {
            enabled: true,
            interval: 0, // Invalid
            timeout: 1000,
            retries: 3,
          },
        };
        expect(() => new TestService(invalidConfig)).toThrow();
      });
    });

    describe("lifecycle management", () => {
      it("handles connection lifecycle", async () => {
        expect(service.status).toBe(ServiceStatus.INITIALIZING);

        await service.connect();
        expect(service.status).toBe(ServiceStatus.CONNECTED);
        expect(logger.info).toHaveBeenCalledWith(
          expect.stringContaining("connected")
        );

        await service.disconnect();
        expect(service.status).toBe(ServiceStatus.DISCONNECTED);
        expect(logger.info).toHaveBeenCalledWith(
          expect.stringContaining("disconnected")
        );
      });

      it("manages status updates", () => {
        service.setStatusTest(ServiceStatus.ERROR);
        expect(service.status).toBe(ServiceStatus.ERROR);
        expect(logger.info).toHaveBeenCalledWith(
          "TestService status changed to error" // Match exact string instead of using stringContaining
        );
      });
    });

    describe("health checks", () => {
      it("performs health check", async () => {
        const healthy = await service.isHealthy();
        expect(healthy).toBe(true);
      });

      it("handles health check failures", async () => {
        const failingService = new (class extends TestService {
          protected async checkHealth(): Promise<HealthCheckResult> {
            throw new Error("Health check failed");
          }
        })(config);

        const healthy = await failingService.isHealthy();
        expect(healthy).toBe(false);
        expect(logger.error).toHaveBeenCalled();
      });

      it("returns unhealthy status on check failure", async () => {
        const unhealthyService = new (class extends TestService {
          protected async checkHealth(): Promise<HealthCheckResult> {
            return {
              status: "unhealthy",
              message: "Service is not responding",
              timestamp: new Date(),
            };
          }
        })(config);

        const healthy = await unhealthyService.isHealthy();
        expect(healthy).toBe(false);
      });
    });
  });

  describe("ServiceConnectionManager", () => {
    let manager: ServiceConnectionManager;
    let service1: TestService;
    let service2: TestService;

    beforeEach(() => {
      manager = new ServiceConnectionManager();
      service1 = new TestService({ enabled: true });
      service2 = new TestService({ enabled: false });
      vi.clearAllMocks();
    });

    describe("service registration", () => {
      it("registers services successfully", () => {
        manager.registerService("service1", service1);
        expect(logger.info).toHaveBeenCalledWith(
          expect.stringContaining("registered")
        );
      });

      it("prevents duplicate registration", () => {
        manager.registerService("service1", service1);
        expect(() => manager.registerService("service1", service1)).toThrow();
      });
    });

    describe("connection management", () => {
      beforeEach(() => {
        manager.registerService("service1", service1);
        manager.registerService("service2", service2);
      });

      it("connects only enabled services", async () => {
        await manager.connectAll();
        expect(logger.info).toHaveBeenCalledWith(
          expect.stringContaining("Skipping disabled service")
        );
      });

      it("handles connection failures", async () => {
        const failingService = new (class extends TestService {
          async connect(): Promise<void> {
            throw new Error("Connection failed");
          }
        })({ enabled: true });

        manager.registerService("failing", failingService);
        await expect(manager.connectAll()).rejects.toThrow();
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("Failed to connect"),
          expect.any(Object)
        );
      });

      it("disconnects all services gracefully", async () => {
        await manager.disconnectAll();
        expect(logger.info).toHaveBeenCalledWith(
          expect.stringContaining("disconnected")
        );
      });

      it("continues disconnecting after individual service failure", async () => {
        const failingService = new (class extends TestService {
          async disconnect(): Promise<void> {
            throw new Error("Disconnect failed");
          }
        })({ enabled: true });

        manager.registerService("failing", failingService);
        await manager.disconnectAll();
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("Failed to disconnect"),
          expect.any(Object)
        );
      });
    });

    describe("health monitoring", () => {
      it("reports health status for enabled services", async () => {
        manager.registerService("service1", service1);
        manager.registerService("service2", service2);

        const status = await manager.getHealthStatus();
        expect(status).toHaveProperty("service1", true);
        expect(status).not.toHaveProperty("service2");
      });

      it("handles health check failures in status report", async () => {
        const failingService = new (class extends TestService {
          protected async checkHealth(): Promise<HealthCheckResult> {
            return {
              status: "unhealthy",
              message: "Service check failed",
              timestamp: new Date(),
            };
          }
        })({ enabled: true });

        manager.registerService("failing", failingService);
        const status = await manager.getHealthStatus();
        expect(status).toHaveProperty("failing", false);
      });
    });
  });
});
