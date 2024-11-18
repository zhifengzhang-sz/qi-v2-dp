/**
 * @fileoverview
 * @module schema.registration.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-19
 * @modified 2024-11-19
 */

import { describe, it, beforeEach, expect, vi } from "vitest";
import { Schema } from "@qi/core/config";
import {
  serviceConfigSchema,
  envConfigSchema,
  mergedConfigSchema,
} from "@qi/core/services/config/schemas";
import { ConfigError } from "@qi/core/config";
import { logger } from "@qi/core/logger";

// Mock the logger
vi.mock("@qi/core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Schema Registration", () => {
  let schema: Schema;

  beforeEach(() => {
    schema = new Schema({ formats: true });
    vi.clearAllMocks();
  });

  describe("registerSchema", () => {
    it("should successfully register valid service config schema", () => {
      expect(() => {
        schema.registerSchema("service-config", serviceConfigSchema);
      }).not.toThrow();

      expect(schema.hasSchema("service-config")).toBe(true);
      expect(logger.info).toHaveBeenCalledWith("Registered schema", {
        name: "service-config",
        schemaId: "service-config",
      });
    });

    it("should successfully register valid env config schema", () => {
      expect(() => {
        schema.registerSchema("env-config", envConfigSchema);
      }).not.toThrow();

      expect(schema.hasSchema("env-config")).toBe(true);
      expect(logger.info).toHaveBeenCalledWith("Registered schema", {
        name: "env-config",
        schemaId: "env-config",
      });
    });

    it("should successfully register valid merged config schema", () => {
      expect(() => {
        schema.registerSchema("merged-config", mergedConfigSchema);
      }).not.toThrow();

      expect(schema.hasSchema("merged-config")).toBe(true);
      expect(logger.info).toHaveBeenCalledWith("Registered schema", {
        name: "merged-config",
        schemaId: "merged-config",
      });
    });

    it("should throw error when registering invalid schema", () => {
      const invalidSchema = {
        $id: "invalid-schema",
        type: "invalid-type", // Invalid type
        properties: {
          field: { type: "string" },
        },
      };

      expect(() => {
        schema.registerSchema("invalid-schema", invalidSchema);
      }).toThrowError(ConfigError);

      expect(schema.hasSchema("invalid-schema")).toBe(false);
      expect(logger.error).toHaveBeenCalledWith("Failed to register schema", {
        name: "invalid-schema",
        schemaId: "invalid-schema",
        error: expect.anything(),
      });
    });

    it("should throw error when registering schema with duplicate ID", () => {
      const duplicateSchema = {
        $id: "service-config", // Add $id to match the implementation
        type: "invalid-type", // Invalid type
        properties: {
          field: { type: "string" },
        },
      };

      expect(() => {
        schema.registerSchema("service-config", duplicateSchema);
      }).toThrowError(ConfigError);

      expect(logger.error).toHaveBeenCalledWith("Failed to register schema", {
        name: "service-config",
        schemaId: "service-config",
        error: expect.anything(),
      });
    });
  });

  describe("validate", () => {
    beforeEach(() => {
      schema.registerSchema("service-config", serviceConfigSchema);
      schema.registerSchema("env-config", envConfigSchema);
      schema.registerSchema("merged-config", mergedConfigSchema);
    });

    it("should validate valid service config", () => {
      const validConfig = {
        type: "service",
        version: "1.0.0",
        databases: {
          postgres: {
            host: "localhost",
            port: 5432,
            database: "test",
            user: "user",
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
            port: 5050,
          },
        },
        networking: {
          networks: {
            db: "db-network",
            redis: "redis-network",
            redpanda: "redpanda-network",
          },
        },
      };

      expect(() => {
        schema.validate(validConfig, "service-config");
      }).not.toThrow();
    });

    it("should throw error for invalid service config", () => {
      const invalidConfig = {
        type: "service",
        version: "1.0.0",
        // Missing required fields
      };

      expect(() => {
        schema.validate(invalidConfig, "service-config");
      }).toThrowError(ConfigError);
    });

    it("should validate valid env config", () => {
      const validEnvConfig = {
        POSTGRES_PASSWORD: "password123",
        REDIS_PASSWORD: "redis123",
        GF_SECURITY_ADMIN_PASSWORD: "admin123",
        PGADMIN_DEFAULT_EMAIL: "admin@example.com",
        PGADMIN_DEFAULT_PASSWORD: "pgadmin123",
        QDB_TELEMETRY_ENABLED: "true",
        GF_INSTALL_PLUGINS: "grafana-clock-panel",
        REDPANDA_BROKER_ID: "1",
        REDPANDA_ADVERTISED_KAFKA_API: "localhost:9092",
        REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API: "localhost:8081",
        REDPANDA_ADVERTISED_PANDAPROXY_API: "localhost:8082",
      };

      expect(() => {
        schema.validate(validEnvConfig, "env-config");
      }).not.toThrow();
    });

    it("should throw error for invalid env config", () => {
      const invalidEnvConfig = {
        // Missing required fields
        PGADMIN_DEFAULT_EMAIL: "not-an-email", // Invalid email format
        GF_INSTALL_PLUGINS: "grafana-clock-panel",
      };

      expect(() => {
        schema.validate(invalidEnvConfig, "env-config");
      }).toThrowError(ConfigError);
    });
  });

  describe("error handling", () => {
    it("should throw error when validating with non-existent schema", () => {
      expect(() => {
        schema.validate({}, "non-existent-schema");
      }).toThrowError(ConfigError);
    });

    it("should handle schema removal correctly", () => {
      schema.registerSchema("test-schema", serviceConfigSchema);
      expect(schema.hasSchema("test-schema")).toBe(true);

      schema.removeSchema("test-schema");
      expect(schema.hasSchema("test-schema")).toBe(false);
    });
  });
});

describe("validate", () => {
  let schema: Schema;

  beforeEach(() => {
    schema = new Schema({ formats: true });
    schema.registerSchema("env-config", envConfigSchema);
  });

  it("should validate correct email format", () => {
    const validConfig = {
      POSTGRES_PASSWORD: "password123",
      REDIS_PASSWORD: "redis123",
      GF_SECURITY_ADMIN_PASSWORD: "admin123",
      PGADMIN_DEFAULT_EMAIL: "valid@email.com",
      PGADMIN_DEFAULT_PASSWORD: "pgadmin123",
    };

    expect(() => {
      schema.validate(validConfig, "env-config");
    }).not.toThrow();
  });

  it("should reject invalid email format", () => {
    const invalidConfig = {
      POSTGRES_PASSWORD: "password123",
      REDIS_PASSWORD: "redis123",
      GF_SECURITY_ADMIN_PASSWORD: "admin123",
      PGADMIN_DEFAULT_EMAIL: "not-an-email",
      PGADMIN_DEFAULT_PASSWORD: "pgadmin123",
    };

    expect(() => {
      schema.validate(invalidConfig, "env-config");
    }).toThrowError();
  });
});
