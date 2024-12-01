/**
 * @fileoverview Config Service Unit Tests
 * @module @qi/core/tests/unit/services/config/loader.test
 *
 * @description
 * Unit tests for the service configuration loader and handlers.
 * Tests configuration loading, validation, and handler creation.
 *
 * @author Claude AI
 * @modified 2024-12-01
 * @created 2024-12-01
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ConfigFactory } from "@qi/core/config";
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { loadEnv } from "@qi/core/utils";
import { logger } from "@qi/core/logger";

import {
  loadServiceConfig,
  PostgresConnectionHandler,
  QuestDBConnectionHandler,
  RedisConnectionHandler,
  MessageQueueConnectionHandler,
  GrafanaEndpointHandler,
  MonitoringEndpointHandler,
  NetworkConfigHandler,
} from "@qi/core/services/config";

// Mock external dependencies
vi.mock("@qi/core/config");
vi.mock("@qi/core/utils");
vi.mock("@qi/core/logger");

// Test configuration
const mockServiceConfig = {
  type: "services",
  version: "1.0",
  databases: {
    postgres: {
      host: "localhost",
      port: 5432,
      database: "testdb",
      user: "testuser",
      maxConnections: 10,
    },
    questdb: {
      host: "localhost",
      httpPort: 9000,
      pgPort: 8812,
      influxPort: 9009,
    },
    redis: {
      host: "localhost",
      port: 6379,
      maxRetries: 3,
    },
  },
  messageQueue: {
    redpanda: {
      kafkaPort: 9092,
      schemaRegistryPort: 8081,
      adminPort: 9644,
      pandaproxyPort: 8082,
    },
  },
  monitoring: {
    grafana: {
      host: "localhost",
      port: 3000,
    },
    pgAdmin: {
      host: "localhost",
      port: 8000,
    },
  },
  networking: {
    networks: {
      db: "test_db",
      redis: "test_redis",
      redpanda: "test_redpanda",
    },
  },
};

const mockEnvConfig = {
  POSTGRES_PASSWORD: "pg-password",
  POSTGRES_USER: "postgres",
  POSTGRES_DB: "postgres",
  REDIS_PASSWORD: "redis-password",
  GF_SECURITY_ADMIN_PASSWORD: "grafana-password",
  GF_INSTALL_PLUGINS: "plugin1;plugin2",
  PGADMIN_DEFAULT_EMAIL: "admin@test.com",
  PGADMIN_DEFAULT_PASSWORD: "pgadmin-password",
  REDPANDA_BROKER_ID: "1",
  REDPANDA_ADVERTISED_KAFKA_API: "localhost",
  REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API: "localhost",
  REDPANDA_ADVERTISED_PANDAPROXY_API: "localhost",
};

describe("Service Configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loadServiceConfig", () => {
    it("should load and validate configuration successfully", async () => {
      // Mock environment loading
      vi.mocked(loadEnv).mockResolvedValueOnce(mockEnvConfig);

      // Mock configuration loading
      const mockLoader = {
        load: vi.fn().mockResolvedValueOnce(mockServiceConfig),
        source: "",
      };

      vi.mocked(ConfigFactory.prototype.createLoader).mockReturnValueOnce(
        mockLoader
      );

      const services = await loadServiceConfig({
        configPath: "/test/config.json",
        envPath: "/test/.env",
      });

      expect(services).toBeDefined();
      expect(services.databases.postgres).toBeInstanceOf(
        PostgresConnectionHandler
      );
      expect(services.databases.questdb).toBeInstanceOf(
        QuestDBConnectionHandler
      );
      expect(services.databases.redis).toBeInstanceOf(RedisConnectionHandler);
      expect(services.messageQueue).toBeInstanceOf(
        MessageQueueConnectionHandler
      );
      expect(services.monitoring.grafana).toBeInstanceOf(
        GrafanaEndpointHandler
      );
      expect(services.monitoring.pgAdmin).toBeInstanceOf(
        MonitoringEndpointHandler
      );
      expect(services.networking).toBeInstanceOf(NetworkConfigHandler);

      expect(logger.info).toHaveBeenCalledWith(
        "Loaded service configuration",
        expect.any(Object)
      );
    });

    it("should handle missing environment configuration", async () => {
      vi.mocked(loadEnv).mockResolvedValueOnce(null);

      const promise = loadServiceConfig({
        configPath: "/test/config.json",
        envPath: "/test/.env",
      });

      // First verify it rejects with ApplicationError
      await expect(promise).rejects.toBeInstanceOf(ApplicationError);

      try {
        await promise;
      } catch (error) {
        // Then check specific error properties
        expect(error).toEqual(
          expect.objectContaining({
            code: ErrorCode.ENV_MISSING_ERROR,
            details: { path: "/test/.env" },
          })
        );
      }
    });

    it("should handle configuration loading failures", async () => {
      vi.mocked(loadEnv).mockResolvedValueOnce(mockEnvConfig);

      const mockLoader = {
        load: vi.fn().mockRejectedValueOnce(new Error("Invalid config")),
        source: "",
      };

      vi.mocked(ConfigFactory.prototype.createLoader).mockReturnValueOnce(
        mockLoader
      );

      const promise = loadServiceConfig({
        configPath: "/test/config.json",
        envPath: "/test/.env",
      });

      // First verify it rejects with ApplicationError
      await expect(promise).rejects.toBeInstanceOf(ApplicationError);

      try {
        await promise;
      } catch (error) {
        // Then check specific error properties
        expect(error).toEqual(
          expect.objectContaining({
            code: ErrorCode.SERVICE_INITIALIZATION_ERROR,
            statusCode: 500,
            details: {
              configPath: "/test/config.json",
              envPath: "/test/.env",
              error: expect.stringContaining("Invalid config"),
            },
          })
        );
      }
    });
  });
  describe("service handlers", () => {
    describe("PostgresConnectionHandler", () => {
      it("should generate correct connection string", () => {
        const handler = new PostgresConnectionHandler(
          mockServiceConfig.databases.postgres,
          {
            user: "testuser",
            password: "testpass",
          }
        );

        expect(handler.getConnectionString()).toBe(
          "postgresql://testuser:testpass@localhost:5432/testdb"
        );
        expect(handler.getMaxConnections()).toBe(10);
      });

      it("should validate required configuration", () => {
        expect(
          () =>
            new PostgresConnectionHandler(
              { ...mockServiceConfig.databases.postgres, host: "" },
              { user: "test", password: "test" }
            )
        ).toThrowError(ApplicationError);
      });
    });

    describe("QuestDBConnectionHandler", () => {
      it("should generate correct endpoints", () => {
        const handler = new QuestDBConnectionHandler(
          mockServiceConfig.databases.questdb
        );

        expect(handler.getHttpEndpoint()).toBe("http://localhost:9000");
        expect(handler.getPgEndpoint()).toBe(
          "postgresql://localhost:8812/questdb"
        );
        expect(handler.getInfluxEndpoint()).toBe("http://localhost:9009");
      });

      it("should validate required configuration", () => {
        expect(
          () =>
            new QuestDBConnectionHandler({
              ...mockServiceConfig.databases.questdb,
              httpPort: 0,
            })
        ).toThrowError(ApplicationError);
      });
    });

    describe("RedisConnectionHandler", () => {
      it("should generate correct connection string", () => {
        const handler = new RedisConnectionHandler(
          mockServiceConfig.databases.redis,
          "testpass"
        );

        expect(handler.getConnectionString()).toBe(
          "redis://:testpass@localhost:6379"
        );
        expect(handler.getMaxRetries()).toBe(3);
      });

      it("should validate required configuration", () => {
        expect(
          () =>
            new RedisConnectionHandler(
              { ...mockServiceConfig.databases.redis, port: 0 },
              "test"
            )
        ).toThrowError(ApplicationError);
      });
    });

    describe("MessageQueueConnectionHandler", () => {
      it("should generate correct endpoints", () => {
        const handler = new MessageQueueConnectionHandler(
          mockServiceConfig.messageQueue.redpanda,
          {
            kafka: "kafka.local",
            schemaRegistry: "schema.local",
            proxy: "proxy.local",
            brokerId: "1",
          }
        );

        expect(handler.getBrokerEndpoint()).toBe("kafka.local:9092");
        expect(handler.getSchemaRegistryEndpoint()).toBe(
          "http://schema.local:8081"
        );
        expect(handler.getProxyEndpoint()).toBe("http://proxy.local:8082");
        expect(handler.getBrokerId()).toBe(1);
      });

      it("should handle missing advertised addresses", () => {
        const handler = new MessageQueueConnectionHandler(
          mockServiceConfig.messageQueue.redpanda,
          {}
        );

        expect(handler.getBrokerEndpoint()).toBe("localhost:9092");
        expect(handler.getBrokerId()).toBeUndefined();
      });
    });

    describe("NetworkConfigHandler", () => {
      it("should return correct network names", () => {
        const handler = new NetworkConfigHandler(
          mockServiceConfig.networking.networks
        );

        expect(handler.getNetworkName("db")).toBe("test_db");
        expect(handler.getNetworkName("redis")).toBe("test_redis");
        expect(handler.getNetworkName("redpanda")).toBe("test_redpanda");
        expect(handler.getAllNetworks()).toEqual(
          mockServiceConfig.networking.networks
        );
      });

      it("should validate required networks", () => {
        expect(
          () =>
            new NetworkConfigHandler({
              ...mockServiceConfig.networking.networks,
              db: "",
            })
        ).toThrowError(ApplicationError);
      });
    });

    describe("MonitoringEndpointHandler", () => {
      it("should generate correct endpoint and credentials", () => {
        const handler = new MonitoringEndpointHandler(
          mockServiceConfig.monitoring.grafana,
          { username: "admin", password: "secret" }
        );

        expect(handler.getEndpoint()).toBe("http://localhost:3000");
        expect(handler.getCredentials()).toEqual({
          username: "admin",
          password: "secret",
        });
      });
    });

    describe("GrafanaEndpointHandler", () => {
      it("should handle plugins configuration", () => {
        const handler = new GrafanaEndpointHandler(
          mockServiceConfig.monitoring.grafana,
          { password: "secret" },
          "plugin1;plugin2"
        );

        expect(handler.getPlugins()).toEqual(["plugin1", "plugin2"]);
      });

      it("should handle empty plugins", () => {
        const handler = new GrafanaEndpointHandler(
          mockServiceConfig.monitoring.grafana,
          { password: "secret" }
        );

        expect(handler.getPlugins()).toEqual([]);
      });
    });
  });
});
