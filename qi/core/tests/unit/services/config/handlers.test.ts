/**
 * @fileoverview Connection Handler Tests
 * @module @qi/core/tests/unit/services/config/handlers.test
 */
import { describe, it, expect } from "vitest";
import {
  PostgresConnectionHandler,
  QuestDBConnectionHandler,
  MessageQueueConnectionHandler,
  GrafanaEndpointHandler,
} from "@qi/core/services/config";
import { ApplicationError } from "@qi/core/errors";

describe("Connection Handlers", () => {
  describe("PostgresConnectionHandler", () => {
    it("should handle special characters in password", () => {
      const handler = new PostgresConnectionHandler(
        {
          host: "localhost",
          port: 5432,
          database: "testdb",
          user: "test",
          maxConnections: 10,
        },
        {
          user: "test",
          password: "pass@word#123",
        }
      );

      const connString = handler.getConnectionString();
      expect(connString).toMatch(/pass@word#123/); // URL encoded special chars
    });

    it("should handle IPv6 addresses", () => {
      const handler = new PostgresConnectionHandler(
        {
          host: "::1",
          port: 5432,
          database: "testdb",
          user: "test",
          maxConnections: 10,
        },
        {
          user: "test",
          password: "password",
        }
      );

      const connString = handler.getConnectionString();
      expect(connString).toMatch(/\[::1\]/); // IPv6 address in brackets
    });
  });

  describe("QuestDBConnectionHandler", () => {
    it("should handle custom endpoint paths", () => {
      const handler = new QuestDBConnectionHandler({
        host: "localhost",
        httpPort: 9000,
        pgPort: 8812,
        influxPort: 9009,
      });

      expect(handler.getHttpEndpoint()).toBe("http://localhost:9000");
      expect(handler.getInfluxEndpoint()).toBe("http://localhost:9009");
    });

    it("should validate port ranges", () => {
      expect(
        () =>
          new QuestDBConnectionHandler({
            host: "localhost",
            httpPort: 0, // Invalid port
            pgPort: 8812,
            influxPort: 9009,
          })
      ).toThrow(ApplicationError);
    });
  });

  describe("MessageQueueConnectionHandler", () => {
    it("should handle missing optional broker ID", () => {
      const handler = new MessageQueueConnectionHandler(
        {
          kafkaPort: 9092,
          schemaRegistryPort: 8081,
          adminPort: 9644,
          pandaproxyPort: 8082,
        },
        {}
      );

      expect(handler.getBrokerId()).toBeUndefined();
    });

    it("should handle advertised addresses with ports", () => {
      const handler = new MessageQueueConnectionHandler(
        {
          kafkaPort: 9092,
          schemaRegistryPort: 8081,
          adminPort: 9644,
          pandaproxyPort: 8082,
        },
        {
          kafka: "broker.local:9093", // Custom port
          schemaRegistry: "schema.local:8082",
        }
      );

      expect(handler.getBrokerEndpoint()).toBe("broker.local:9093");
      expect(handler.getSchemaRegistryEndpoint()).toBe(
        "http://schema.local:8082"
      );
    });
  });

  describe("GrafanaEndpointHandler", () => {
    it("should handle plugin options with versions", () => {
      const handler = new GrafanaEndpointHandler(
        {
          host: "localhost",
          port: 3000,
        },
        { password: "secret" },
        "plugin1@1.0.0;plugin2@2.0.0"
      );

      expect(handler.getPlugins()).toEqual(["plugin1@1.0.0", "plugin2@2.0.0"]);
    });

    it("should handle invalid plugin string format", () => {
      const handler = new GrafanaEndpointHandler(
        {
          host: "localhost",
          port: 3000,
        },
        { password: "secret" },
        ";;" // Invalid format
      );

      expect(handler.getPlugins()).toEqual([]);
    });
  });
});
