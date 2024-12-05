/**
 * @fileoverview QuestDB Service Unit Tests
 * @module @qi/core/tests/unit/services/questdb/client.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PoolConfig, QueryResult } from "pg";
import { QuestDBService } from "@qi/core/services/questdb";
import { ApplicationError } from "@qi/core/errors";
import { logger } from "@qi/core/logger";
import type { Mock } from "vitest";

interface MockedClient {
  query: Mock<(text: string, params?: any[]) => Promise<QueryResult>>;
  release: Mock;
}

interface MockedPool {
  connect: Mock<() => Promise<MockedClient>>;
  end: Mock<() => Promise<void>>;
  on: Mock;
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

const mockPool = {
  connect: vi.fn(),
  end: vi.fn(),
  on: vi.fn(),
  totalCount: 0,
  idleCount: 0,
  waitingCount: 0,
} as unknown as MockedPool;

const MockPool = vi.fn(() => mockPool);

// Mock pg module with dynamic import support
vi.mock("pg", () => ({
  default: {
    Pool: MockPool,
  },
  Pool: MockPool,
}));

vi.mock("@qi/core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("QuestDBService", () => {
  const mockConnection = {
    getHost: () => "localhost",
    getPort: () => 8812,
    getDatabase: () => "qdb",
    getUser: () => "admin",
    getPassword: () => "quest",
    getConnectionString: () => "postgresql://localhost:8812/qdb",
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
    },
    healthCheck: {
      enabled: true,
      interval: 30000,
      timeout: 5000,
      retries: 3,
    },
  };

  const mockClient: MockedClient = {
    query: vi.fn(),
    release: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient.query.mockResolvedValue({
      rows: [],
      command: "",
      rowCount: 0,
      oid: 0,
      fields: [],
    } as QueryResult);

    (mockPool.connect as Mock).mockResolvedValue(mockClient);
    (mockPool.end as Mock).mockResolvedValue(undefined);
    (mockPool.on as Mock).mockImplementation(() => mockPool);
  });

  describe("initialization", () => {
    it("creates service with correct config", () => {
      const service = new QuestDBService(mockConfig);
      expect(service).toBeDefined();
      expect(service.isEnabled()).toBe(true);
    });

    it("handles disabled service", async () => {
      const service = new QuestDBService({ ...mockConfig, enabled: false });
      await service.connect();
      expect(service.isEnabled()).toBe(false);
      expect(MockPool).not.toHaveBeenCalled();
    });
  });

  describe("connection lifecycle", () => {
    it("establishes connection successfully", async () => {
      const service = new QuestDBService(mockConfig);
      await service.connect();

      expect(MockPool).toHaveBeenCalledWith({
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

    it("handles connection failure", async () => {
      const service = new QuestDBService(mockConfig);
      (mockPool.connect as Mock).mockRejectedValueOnce(
        new Error("Connection failed")
      );

      await expect(service.connect()).rejects.toThrow(ApplicationError);
    });

    it("handles query failure during connection", async () => {
      const service = new QuestDBService(mockConfig);
      mockClient.query.mockRejectedValueOnce(new Error("Query failed"));

      await expect(service.connect()).rejects.toThrow(ApplicationError);
    });

    it("disconnects properly", async () => {
      const service = new QuestDBService(mockConfig);
      await service.connect();
      await service.disconnect();

      expect(mockPool.end).toHaveBeenCalled();
      expect(await service.isHealthy()).toBe(false);
    });
  });

  describe("health checks", () => {
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

    it("handles failed health check", async () => {
      const service = new QuestDBService(mockConfig);
      await service.connect();

      mockClient.query.mockRejectedValueOnce(new Error("Health check failed"));
      const health = await service["checkHealth"]();

      expect(health.status).toBe("unhealthy");
      expect(health.message).toContain("Health check failed");
    });

    it("returns unhealthy when pool is not initialized", async () => {
      const service = new QuestDBService(mockConfig);
      const health = await service["checkHealth"]();

      expect(health.status).toBe("unhealthy");
      expect(health.message).toBe("QuestDB connection not initialized");
    });
  });

  describe("query execution", () => {
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

    it("releases client after query failure", async () => {
      const service = new QuestDBService(mockConfig);
      await service.connect();

      mockClient.query.mockRejectedValueOnce(new Error("Query failed"));

      await expect(
        service.query("SELECT * FROM invalid_table")
      ).rejects.toThrow();

      expect(mockClient.release).toHaveBeenCalled();
    });

    it("throws when accessing pool before initialization", () => {
      const service = new QuestDBService(mockConfig);
      expect(() => service.getPool()).toThrow(ApplicationError);
    });
  });

  describe("error handling", () => {
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
