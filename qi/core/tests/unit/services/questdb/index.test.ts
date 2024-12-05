/**
 * @fileoverview QuestDB Service Unit Tests
 * @module @qi/core/tests/unit/services/questdb/client.test
 *
 * @description
 * Tests the QuestDB service implementation including:
 * - Connection pool management and configuration
 * - Health monitoring and status reporting
 * - Query execution and client handling
 * - Error handling and recovery
 *
 * The service provides PostgreSQL wire protocol compatibility for QuestDB,
 * enabling standard SQL operations while maintaining connection pooling
 * and proper resource cleanup.
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-05
 * @created 2024-12-05
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Pool, PoolConfig, QueryResult } from "pg";
import { QuestDBService } from "@qi/core/services/questdb";
import { ApplicationError } from "@qi/core/errors";
import { logger } from "@qi/core/logger";
import type { Mock } from "vitest";

/**
 * Mock client interface extending pg.PoolClient
 * Represents a database connection with query capabilities
 */
interface MockedClient {
  query: Mock<(text: string, params?: any[]) => Promise<QueryResult>>;
  release: Mock;
}

/**
 * Mock pool interface extending pg.Pool
 * Manages connection lifecycle and pooling
 */
interface MockedPool {
  connect: Mock<() => Promise<MockedClient>>;
  end: Mock<() => Promise<void>>;
  on: Mock;
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

// Mock pg Pool constructor with default implementations
const mockPool = {
  connect: vi.fn(),
  end: vi.fn(),
  on: vi.fn(),
  totalCount: 0,
  idleCount: 0,
  waitingCount: 0,
} as unknown as MockedPool;

// Configure module mocks
vi.mock("pg", () => ({
  Pool: vi.fn(() => mockPool),
}));

vi.mock("@qi/core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("QuestDBService", () => {
  /**
   * Mock connection configuration providing database access details
   * Implements PostgresConnection interface
   */
  const mockConnection = {
    getHost: () => "localhost",
    getPort: () => 8812,
    getDatabase: () => "qdb",
    getUser: () => "admin",
    getPassword: () => "quest",
    getConnectionString: () => "postgresql://localhost:8812/qdb",
    getMaxConnections: () => 10,
  };

  /**
   * Mock service configuration with pool settings and health check parameters
   */
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
    },
    healthCheck: {
      enabled: true,
      interval: 30000,
      timeout: 5000,
      retries: 3,
    },
  };

  /**
   * Mock client instance for query operations
   */
  const mockClient: MockedClient = {
    query: vi.fn(),
    release: vi.fn(),
  };

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Configure mock client default behavior
    mockClient.query.mockResolvedValue({
      rows: [],
      command: "",
      rowCount: 0,
      oid: 0,
      fields: [],
    } as QueryResult);

    // Configure mock pool default behavior
    (mockPool.connect as Mock).mockResolvedValue(mockClient);
    (mockPool.end as Mock).mockResolvedValue(undefined);
    (mockPool.on as Mock).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (event: string, handler: (err: Error) => void) => mockPool
    );
  });

  describe("initialization", () => {
    /**
     * Tests basic service creation with valid configuration
     */
    it("creates service with correct config", () => {
      const service = new QuestDBService(mockConfig);
      expect(service).toBeDefined();
      expect(service.isEnabled()).toBe(true);
    });

    /**
     * Tests service behavior when disabled via configuration
     */
    it("handles disabled service", async () => {
      const service = new QuestDBService({ ...mockConfig, enabled: false });
      await service.connect();
      expect(service.isEnabled()).toBe(false);
      expect(Pool).not.toHaveBeenCalled();
    });
  });

  describe("connection lifecycle", () => {
    /**
     * Tests successful connection establishment and pool configuration
     */
    it("establishes connection successfully", async () => {
      const service = new QuestDBService(mockConfig);
      await service.connect();

      expect(Pool).toHaveBeenCalledWith({
        host: "localhost",
        port: 8812,
        database: "qdb",
        user: "admin",
        password: "quest",
        max: 20,
        min: 5,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 5000,
        statement_timeout: 30000,
      } as PoolConfig);

      expect(mockClient.query).toHaveBeenCalledWith("SELECT 1");
      expect(await service.isHealthy()).toBe(true);
    });

    /**
     * Tests error handling during connection failure
     */
    it("handles connection failure", async () => {
      const service = new QuestDBService(mockConfig);
      (mockPool.connect as Mock).mockRejectedValueOnce(
        new Error("Connection failed")
      );

      await expect(service.connect()).rejects.toThrow(ApplicationError);
    });

    /**
     * Tests error handling during initial query failure
     */
    it("handles query failure during connection", async () => {
      const service = new QuestDBService(mockConfig);
      mockClient.query.mockRejectedValueOnce(new Error("Query failed"));

      await expect(service.connect()).rejects.toThrow(ApplicationError);
    });

    /**
     * Tests proper cleanup during disconnection
     */
    it("disconnects properly", async () => {
      const service = new QuestDBService(mockConfig);
      await service.connect();
      await service.disconnect();

      expect(mockPool.end).toHaveBeenCalled();
      expect(await service.isHealthy()).toBe(false);
    });
  });

  describe("health checks", () => {
    /**
     * Tests successful health check execution and reporting
     */
    it("performs health check successfully", async () => {
      const service = new QuestDBService(mockConfig);
      await service.connect();

      mockClient.query.mockResolvedValueOnce({
        rows: [{ "?column?": 1 }],
      } as QueryResult);
      const health = await service["checkHealth"]();

      expect(mockClient.query).toHaveBeenCalledWith("SELECT 1");
      expect(health.status).toBe("healthy");
      expect(health.message).toBe("QuestDB is responsive");
      expect(health.details).toEqual({
        host: "localhost",
        port: 8812,
        database: "qdb",
        poolSize: 0,
        idleConnections: 0,
        waitingClients: 0,
      });
    });

    /**
     * Tests health check failure handling
     */
    it("handles failed health check", async () => {
      const service = new QuestDBService(mockConfig);
      await service.connect();

      mockClient.query.mockRejectedValueOnce(new Error("Health check failed"));
      const health = await service["checkHealth"]();

      expect(health.status).toBe("unhealthy");
      expect(health.message).toContain("Health check failed");
    });

    /**
     * Tests health check behavior when service is not initialized
     */
    it("returns unhealthy when pool is not initialized", async () => {
      const service = new QuestDBService(mockConfig);
      const health = await service["checkHealth"]();

      expect(health.status).toBe("unhealthy");
      expect(health.message).toBe("QuestDB connection not initialized");
    });
  });

  describe("query execution", () => {
    /**
     * Tests successful query execution and result handling
     */
    it("executes query successfully", async () => {
      const service = new QuestDBService(mockConfig);
      await service.connect();

      const mockResult = {
        rows: [{ id: 1, value: 100 }],
        rowCount: 1,
      } as QueryResult;

      mockClient.query.mockResolvedValueOnce(mockResult);

      const result = await service.query(
        "SELECT * FROM sensors WHERE id = $1",
        [1]
      );

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith(
        "SELECT * FROM sensors WHERE id = $1",
        [1]
      );
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toBe(mockResult);
    });

    /**
     * Tests client resource cleanup after query failure
     */
    it("releases client after query failure", async () => {
      const service = new QuestDBService(mockConfig);
      await service.connect();

      mockClient.query.mockRejectedValueOnce(new Error("Query failed"));

      await expect(
        service.query("SELECT * FROM invalid_table")
      ).rejects.toThrow();

      expect(mockClient.release).toHaveBeenCalled();
    });

    /**
     * Tests error handling when accessing pool before initialization
     */
    it("throws when accessing pool before initialization", () => {
      const service = new QuestDBService(mockConfig);
      expect(() => service.getPool()).toThrow(ApplicationError);
    });
  });

  describe("error handling", () => {
    /**
     * Tests pool error event handling and logging
     */
    it("handles pool error events", async () => {
      const service = new QuestDBService(mockConfig);
      await service.connect();

      const errorHandler = (mockPool.on as Mock).mock.calls.find(
        (call) => call[0] === "error"
      )?.[1] as (err: Error) => void;

      expect(errorHandler).toBeDefined();
      errorHandler(new Error("Pool error"));

      expect(logger.error).toHaveBeenCalledWith(
        "Unexpected QuestDB pool error",
        { error: "Pool error" }
      );
    });
  });
});
