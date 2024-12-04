/**
 * @fileoverview
 * @module client.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-04
 * @modified 2024-12-04
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ApplicationError } from "@qi/core/errors";
import { logger } from "@qi/core/logger";
import { TimescaleDBClient } from "@qi/core/services/timescaledb";
import type { PostgresConnection } from "@qi/core/services/config";
import type { Options as SequelizeOptions } from "sequelize";

vi.mock("@qi/core/logger");

class MockPostgresConnection implements PostgresConnection {
  getDatabase = vi.fn().mockReturnValue("testdb");
  getUser = vi.fn().mockReturnValue("testuser");
  getPassword = vi.fn().mockReturnValue("testpass");
  getHost = vi.fn().mockReturnValue("localhost");
  getPort = vi.fn().mockReturnValue(5432);
  getConnectionString = vi
    .fn()
    .mockReturnValue("postgresql://localhost:5432/db");
  getMaxConnections = vi.fn().mockReturnValue(10);
}

describe("TimescaleDBClient", () => {
  let mockConnection: MockPostgresConnection;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConnection = new MockPostgresConnection();
  });

  describe("constructor", () => {
    it("should initialize with valid configuration", () => {
      const client = new TimescaleDBClient({
        connection: mockConnection,
      });

      expect(client).toBeInstanceOf(TimescaleDBClient);
      expect(mockConnection.getConnectionString).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith(
        "TimescaleDB client initialized",
        {
          host: "localhost",
          port: 5432,
          database: "testdb",
        }
      );
    });

    it("should throw error when connection string is invalid", () => {
      mockConnection.getConnectionString.mockImplementation(() => {
        throw new Error("Invalid connection string");
      });

      expect(() => {
        new TimescaleDBClient({
          connection: mockConnection,
        });
      }).toThrow(ApplicationError);

      expect(logger.error).toHaveBeenCalledWith(
        "Failed to initialize TimescaleDB client",
        expect.objectContaining({
          error: "Invalid connection string",
          host: "localhost",
          port: 5432,
        })
      );
    });
  });

  describe("getConnectionDetails", () => {
    it("should return correct sequelize connection options", () => {
      const client = new TimescaleDBClient({
        connection: mockConnection,
        pool: {
          max: 20,
          min: 5,
          acquireTimeout: 25000,
          connectionTimeoutMillis: 5000,
        },
      });

      const details = client.getConnectionDetails();
      const expectedConfig: SequelizeOptions = {
        dialect: "postgres",
        logging: expect.any(Function),
        pool: {
          max: 20,
          min: 5,
          acquire: 25000,
          idle: 10000,
        },
        database: "testdb",
        username: "testuser",
        password: "testpass",
        host: "localhost",
        port: 5432,
        dialectOptions: {
          connectTimeout: 5000,
          statement_timeout: undefined,
          idle_in_transaction_session_timeout: undefined,
        },
      };
      expect(details).toEqual(expectedConfig);
    });

    it("should use default pool values when not provided", () => {
      const client = new TimescaleDBClient({
        connection: mockConnection,
      });

      const details = client.getConnectionDetails();
      expect(details.pool).toEqual({
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      });
    });
  });
});
