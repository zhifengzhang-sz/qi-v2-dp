/**
 * @module tests/unit/env.validator
 * @description Unit tests for environment validation
 */

import { EnvValidator } from "@qi/core/config";

describe("EnvValidator", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env;
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = EnvValidator.getInstance();
      const instance2 = EnvValidator.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe("validateEnv", () => {
    it("should validate correct environment", () => {
      process.env = {
        NODE_ENV: "development",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        DB_NAME: "test_db",
        DB_USER: "test_user",
        DB_PASSWORD: "test_password",
        REDIS_HOST: "localhost",
        REDIS_PORT: "6379",
      };

      const validator = EnvValidator.getInstance();

      expect(() => validator.validateEnv()).not.toThrow();
    });

    it("should throw on missing required variables", () => {
      process.env = {
        NODE_ENV: "development",
        // Missing other required variables
      };

      const validator = EnvValidator.getInstance();

      expect(() => validator.validateEnv()).toThrow(
        /Environment validation failed/
      );
    });

    it("should throw on invalid NODE_ENV", () => {
      process.env = {
        NODE_ENV: "invalid",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        DB_NAME: "test_db",
        DB_USER: "test_user",
        DB_PASSWORD: "test_password",
        REDIS_HOST: "localhost",
        REDIS_PORT: "6379",
      };

      const validator = EnvValidator.getInstance();

      expect(() => validator.validateEnv()).toThrow(
        /Environment validation failed/
      );
    });

    it("should throw on invalid port number", () => {
      process.env = {
        NODE_ENV: "development",
        DB_HOST: "localhost",
        DB_PORT: "not-a-number",
        DB_NAME: "test_db",
        DB_USER: "test_user",
        DB_PASSWORD: "test_password",
        REDIS_HOST: "localhost",
        REDIS_PORT: "6379",
      };

      const validator = EnvValidator.getInstance();

      expect(() => validator.validateEnv()).toThrow(
        /Environment validation failed/
      );
    });
  });

  describe("getRequiredEnv", () => {
    it("should return existing environment variable", () => {
      process.env.TEST_VAR = "test_value";

      const validator = EnvValidator.getInstance();
      const value = validator.getRequiredEnv("TEST_VAR");

      expect(value).toBe("test_value");
    });

    it("should throw on missing environment variable", () => {
      const validator = EnvValidator.getInstance();

      expect(() => validator.getRequiredEnv("MISSING_VAR")).toThrow(
        "Required environment variable MISSING_VAR is not set"
      );
    });
  });

  describe("getOptionalEnv", () => {
    it("should return existing environment variable", () => {
      process.env.TEST_VAR = "test_value";

      const validator = EnvValidator.getInstance();
      const value = validator.getOptionalEnv("TEST_VAR", "default");

      expect(value).toBe("test_value");
    });

    it("should return default value for missing variable", () => {
      const validator = EnvValidator.getInstance();
      const value = validator.getOptionalEnv("MISSING_VAR", "default");

      expect(value).toBe("default");
    });
  });

  describe("getRequiredEnvAsNumber", () => {
    it("should return number for valid numeric string", () => {
      process.env.NUMBER_VAR = "123";

      const validator = EnvValidator.getInstance();
      const value = validator.getRequiredEnvAsNumber("NUMBER_VAR");

      expect(value).toBe(123);
    });

    it("should throw for non-numeric string", () => {
      process.env.NUMBER_VAR = "not-a-number";

      const validator = EnvValidator.getInstance();

      expect(() => validator.getRequiredEnvAsNumber("NUMBER_VAR")).toThrow(
        "Environment variable NUMBER_VAR must be a number"
      );
    });
  });

  describe("getOptionalEnvAsNumber", () => {
    it("should return number for valid numeric string", () => {
      process.env.NUMBER_VAR = "123";

      const validator = EnvValidator.getInstance();
      const value = validator.getOptionalEnvAsNumber("NUMBER_VAR", 456);

      expect(value).toBe(123);
    });

    it("should return default for missing variable", () => {
      const validator = EnvValidator.getInstance();
      const value = validator.getOptionalEnvAsNumber("MISSING_VAR", 456);

      expect(value).toBe(456);
    });

    it("should throw for non-numeric string", () => {
      process.env.NUMBER_VAR = "not-a-number";

      const validator = EnvValidator.getInstance();

      expect(() => validator.getOptionalEnvAsNumber("NUMBER_VAR", 456)).toThrow(
        "Environment variable NUMBER_VAR must be a number"
      );
    });
  });

  describe("getRequiredEnvAsBoolean", () => {
    it("should return boolean for valid boolean string", () => {
      process.env.BOOL_VAR = "true";

      const validator = EnvValidator.getInstance();
      const value = validator.getRequiredEnvAsBoolean("BOOL_VAR");

      expect(value).toBe(true);
    });

    it("should throw for invalid boolean string", () => {
      process.env.BOOL_VAR = "not-a-boolean";

      const validator = EnvValidator.getInstance();

      expect(() => validator.getRequiredEnvAsBoolean("BOOL_VAR")).toThrow(
        "Environment variable BOOL_VAR must be either 'true' or 'false'"
      );
    });
  });

  describe("getOptionalEnvAsBoolean", () => {
    it("should return boolean for valid boolean string", () => {
      process.env.BOOL_VAR = "true";

      const validator = EnvValidator.getInstance();
      const value = validator.getOptionalEnvAsBoolean("BOOL_VAR", false);

      expect(value).toBe(true);
    });

    it("should return default for missing variable", () => {
      const validator = EnvValidator.getInstance();
      const value = validator.getOptionalEnvAsBoolean("MISSING_VAR", false);

      expect(value).toBe(false);
    });

    it("should throw for invalid boolean string", () => {
      process.env.BOOL_VAR = "not-a-boolean";

      const validator = EnvValidator.getInstance();

      expect(() =>
        validator.getOptionalEnvAsBoolean("BOOL_VAR", false)
      ).toThrow(
        "Environment variable BOOL_VAR must be either 'true' or 'false'"
      );
    });
  });
});
