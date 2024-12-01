/**
 * @fileoverview Environment Configuration Tests
 * @module @qi/core/tests/unit/services/config/env.test
 */
import { describe, it, expect, beforeEach } from "vitest";
import { Schema } from "@qi/core/config";
import { envConfigSchema } from "@qi/core/services/config";
import { ConfigLoaderError } from "@qi/core/config";

describe("Environment Configuration Schema", () => {
  let schema: Schema;
  const SCHEMA_ID = "qi://core/services/config/env.schema";

  beforeEach(() => {
    schema = new Schema({ formats: true });
    schema.registerSchema(SCHEMA_ID, envConfigSchema);
  });

  it("should validate valid environment configuration", () => {
    const validEnv = {
      POSTGRES_PASSWORD: "secret",
      POSTGRES_USER: "postgres",
      POSTGRES_DB: "testdb",
      REDIS_PASSWORD: "secret",
      GF_SECURITY_ADMIN_PASSWORD: "secret",
      PGADMIN_DEFAULT_EMAIL: "admin@test.com",
      PGADMIN_DEFAULT_PASSWORD: "secret",
    };

    // Should not throw an error
    expect(() => schema.validate(validEnv, SCHEMA_ID)).not.toThrow();
  });

  it("should reject invalid email format", () => {
    const invalidEnv = {
      POSTGRES_PASSWORD: "secret",
      POSTGRES_USER: "postgres",
      POSTGRES_DB: "testdb",
      REDIS_PASSWORD: "secret",
      GF_SECURITY_ADMIN_PASSWORD: "secret",
      PGADMIN_DEFAULT_EMAIL: "invalid-email", // Invalid email
      PGADMIN_DEFAULT_PASSWORD: "secret",
    };

    // Should throw a validation error
    expect(() => schema.validate(invalidEnv, SCHEMA_ID)).toThrow(
      ConfigLoaderError
    );
  });

  it("should validate optional telemetry setting", () => {
    const envWithTelemetry = {
      POSTGRES_PASSWORD: "secret",
      POSTGRES_USER: "postgres",
      POSTGRES_DB: "testdb",
      REDIS_PASSWORD: "secret",
      GF_SECURITY_ADMIN_PASSWORD: "secret",
      PGADMIN_DEFAULT_EMAIL: "admin@test.com",
      PGADMIN_DEFAULT_PASSWORD: "secret",
      QDB_TELEMETRY_ENABLED: "true",
    };

    // Should not throw an error
    expect(() => schema.validate(envWithTelemetry, SCHEMA_ID)).not.toThrow();
  });

  it("should reject invalid telemetry value", () => {
    const invalidEnv = {
      POSTGRES_PASSWORD: "secret",
      POSTGRES_USER: "postgres",
      POSTGRES_DB: "testdb",
      REDIS_PASSWORD: "secret",
      GF_SECURITY_ADMIN_PASSWORD: "secret",
      PGADMIN_DEFAULT_EMAIL: "admin@test.com",
      PGADMIN_DEFAULT_PASSWORD: "secret",
      QDB_TELEMETRY_ENABLED: "invalid", // Should be true/false
    };

    // Should throw a validation error
    expect(() => schema.validate(invalidEnv, SCHEMA_ID)).toThrow(
      ConfigLoaderError
    );
  });
});
