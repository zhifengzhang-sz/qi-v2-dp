/**
 * @fileoverview Additional Config Service Tests
 * @module @qi/core/tests/unit/services/config/schema.test
 */

import { describe, it, expect, beforeEach } from "vitest";
import { serviceConfigSchema } from "@qi/core/services/config";
import { Schema } from "@qi/core/config";
import { ConfigLoaderError } from "@qi/core/config";

describe("Service Configuration Schema", () => {
  let schema: Schema;
  const SCHEMA_ID = "qi://core/services/config/service.schema";

  beforeEach(() => {
    schema = new Schema({ formats: true });
    // Register the schema with an ID for validation
    schema.registerSchema(SCHEMA_ID, serviceConfigSchema);
  });

  it("should validate valid service configuration", () => {
    const validConfig = {
      type: "services",
      version: "1.0",
      databases: {
        postgres: {
          host: "localhost",
          port: 5432,
          database: "testdb",
          user: "test",
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

    // Should not throw an error
    expect(() => schema.validate(validConfig, SCHEMA_ID)).not.toThrow();
  });

  it("should reject invalid port numbers", () => {
    const invalidConfig = {
      type: "services",
      version: "1.0",
      databases: {
        postgres: {
          host: "localhost",
          port: 70000, // Invalid port
          database: "testdb",
          user: "test",
          maxConnections: 10,
        },
      },
    };

    // Should throw a validation error
    expect(() => schema.validate(invalidConfig, "service-config")).toThrow(
      ConfigLoaderError
    );
  });

  it("should reject missing required fields", () => {
    const incompleteConfig = {
      type: "services",
      version: "1.0",
      databases: {
        postgres: {
          host: "localhost",
          // Missing port
          database: "testdb",
          // Missing other required fields
        },
      },
    };

    // Should throw a validation error
    expect(() => schema.validate(incompleteConfig, "service-config")).toThrow(
      ConfigLoaderError
    );
  });

  it("should reject invalid version format", () => {
    const invalidConfig = {
      type: "services",
      version: "invalid", // Should be semver format
      databases: {},
    };

    // Should throw a validation error
    expect(() => schema.validate(invalidConfig, "service-config")).toThrow(
      ConfigLoaderError
    );
  });
});
