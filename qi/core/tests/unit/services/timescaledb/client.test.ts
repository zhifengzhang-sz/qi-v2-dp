/**
 * @fileoverview TimescaleDB Service Unit Tests
 * @module @qi/core/tests/unit/services/timescaledb/client.test
 * @description Tests the TimescaleDB service implementation including connection management,
 * health checks, model synchronization, and error handling.
 *
 * @author Zhifeng Zhang
 * @created 2024-12-04
 * @modified 2024-12-05
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Sequelize } from "sequelize";
import { TimescaleDBService } from "@qi/core/services/timescaledb";
import { ApplicationError } from "@qi/core/errors";
import type { Mock } from "vitest";

// Mock external dependencies
vi.mock("sequelize");
vi.mock("@qi/core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("TimescaleDBService", () => {
  const mockConnection = {
    getHost: () => "localhost",
    getPort: () => 5432,
    getDatabase: () => "testdb",
    getUser: () => "testuser",
    getPassword: () => "testpass",
    getConnectionString: () => "postgresql://localhost:5432/testdb",
    getMaxConnections: () => 10,
  };

  const mockConfig = {
    enabled: true,
    connection: mockConnection,
    pool: {
      max: 20,
      min: 5,
      acquireTimeout: 30000,
      idleTimeout: 10000,
      connectionTimeoutMillis: 5000,
      statementTimeout: 30000,
      idleInTransactionSessionTimeout: 60000,
    },
    healthCheck: {
      enabled: true,
      interval: 30000,
      timeout: 5000,
      retries: 3,
    },
    sync: {
      force: false,
      alter: true,
    },
  };

  // Create a proper type for the mocked Sequelize instance
  type MockedSequelize = {
    authenticate: Mock;
    close: Mock;
    sync: Mock;
    fn: Mock;
    col: Mock;
    cast: Mock;
    literal: Mock;
  } & Partial<Sequelize>;

  let mockSequelize: MockedSequelize;

  beforeEach(() => {
    // Create fresh mock instance for each test
    mockSequelize = {
      authenticate: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      sync: vi.fn().mockResolvedValue(undefined),
      fn: vi.fn(),
      col: vi.fn(),
      cast: vi.fn(),
      literal: vi.fn(),
    };

    // Clear all mocks
    vi.clearAllMocks();

    // Mock the Sequelize constructor
    vi.mocked(Sequelize).mockImplementation(
      () => mockSequelize as unknown as Sequelize
    );
  });

  describe("initialization", () => {
    it("creates service with correct config", () => {
      const service = new TimescaleDBService(mockConfig);
      expect(service).toBeDefined();
      expect(service.isEnabled()).toBe(true);
    });

    it("handles disabled service", async () => {
      const service = new TimescaleDBService({ ...mockConfig, enabled: false });
      await service.connect();
      expect(service.isEnabled()).toBe(false);
      expect(Sequelize).not.toHaveBeenCalled();
    });
  });

  describe("connection lifecycle", () => {
    it("establishes connection successfully", async () => {
      const service = new TimescaleDBService(mockConfig);
      await service.connect();

      expect(Sequelize).toHaveBeenCalledWith({
        dialect: "postgres",
        host: "localhost",
        port: 5432,
        database: "testdb",
        username: "testuser",
        password: "testpass",
        logging: expect.any(Function),
        pool: {
          max: 20,
          min: 5,
          acquire: 30000,
          idle: 10000,
        },
        dialectOptions: {
          connectTimeout: 5000,
          statement_timeout: 30000,
          idle_in_transaction_session_timeout: 60000,
        },
      });

      expect(await service.isHealthy()).toBe(true);
    });

    it("handles connection failure", async () => {
      const service = new TimescaleDBService(mockConfig);
      mockSequelize.authenticate.mockRejectedValueOnce(
        new Error("Connection failed")
      );

      await expect(service.connect()).rejects.toThrow(ApplicationError);
    });

    it("disconnects properly", async () => {
      const service = new TimescaleDBService(mockConfig);
      await service.connect();
      await service.disconnect();

      expect(mockSequelize.close).toHaveBeenCalled();
      mockSequelize.authenticate.mockRejectedValueOnce(
        new Error("Not connected")
      );
      expect(await service.isHealthy()).toBe(false);
    });
  });

  describe("health checks", () => {
    it("performs health check successfully", async () => {
      // Create service instance
      const service = new TimescaleDBService(mockConfig);

      // Connect (uses first authenticate call)
      await service.connect();

      // Reset authenticate mock for health check
      mockSequelize.authenticate.mockClear();
      mockSequelize.authenticate.mockResolvedValueOnce(undefined);

      // Perform health check
      const health = await service["checkHealth"]();

      // Verify expectations
      expect(mockSequelize.authenticate).toHaveBeenCalledTimes(1);
      expect(health.status).toBe("healthy");
      expect(health.message).toBe("TimescaleDB is responsive");
      expect(health.details).toEqual({
        database: "testdb",
        host: "localhost",
        port: 5432,
      });
    });

    it("handles failed health check during operation", async () => {
      const service = new TimescaleDBService(mockConfig);
      await service.connect();

      mockSequelize.authenticate.mockRejectedValueOnce(
        new Error("Health check failed")
      );

      const health = await service["checkHealth"]();
      expect(health.status).toBe("unhealthy");
      expect(health.message).toContain("Health check failed");
    });
  });

  describe("model synchronization", () => {
    it("syncs models when configured", async () => {
      const service = new TimescaleDBService(mockConfig);
      await service.connect();

      expect(mockSequelize.sync).toHaveBeenCalledWith({
        force: false,
        alter: true,
      });
    });

    it("skips sync when not configured", async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { sync: syncConfig, ...configWithoutSync } = mockConfig;
      const service = new TimescaleDBService(configWithoutSync);
      await service.connect();

      expect(mockSequelize.sync).not.toHaveBeenCalled();
    });
  });

  describe("sequelize access", () => {
    it("provides access to Sequelize instance", async () => {
      const service = new TimescaleDBService(mockConfig);
      await service.connect();

      const sequelize = service.getSequelize();
      expect(sequelize).toBeDefined();
      expect(sequelize).toBe(mockSequelize);
    });

    it("throws when accessing Sequelize before initialization", () => {
      const service = new TimescaleDBService(mockConfig);
      expect(() => service.getSequelize()).toThrow(ApplicationError);
    });
  });
});
