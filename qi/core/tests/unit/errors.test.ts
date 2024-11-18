/**
 * @fileoverview
 * @module errors.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-19
 * @modified 2024-11-19
 */

import { describe, expect, it } from "vitest";

import {
  ApplicationError,
  ValidationError,
  DatabaseError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  ExternalServiceError,
  RateLimitError,
  ConfigurationError,
  CacheError,
} from "@qi/core/errors";

describe("Error Classes", () => {
  describe("ApplicationError", () => {
    it("should create an error with default values", () => {
      const error = new ApplicationError("Test error");

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Test error");
      expect(error.code).toBe("INTERNAL_ERROR");
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe("ApplicationError");
    });

    it("should create an error with custom values", () => {
      const error = new ApplicationError("Custom error", "CUSTOM_CODE", 418, {
        extra: "info",
      });

      expect(error.message).toBe("Custom error");
      expect(error.code).toBe("CUSTOM_CODE");
      expect(error.statusCode).toBe(418);
      expect(error.details).toEqual({ extra: "info" });
    });
  });

  describe("ValidationError", () => {
    it("should create a validation error with correct defaults", () => {
      const error = new ValidationError("Invalid input");

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.message).toBe("Invalid input");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe("ValidationError");
    });

    it("should create a validation error with details", () => {
      const details = { field: "email", constraint: "format" };
      const error = new ValidationError("Invalid email", details);

      expect(error.details).toEqual(details);
    });
  });

  describe("DatabaseError", () => {
    it("should create a database error with correct defaults", () => {
      const error = new DatabaseError("Database connection failed");

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.message).toBe("Database connection failed");
      expect(error.code).toBe("DATABASE_ERROR");
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe("DatabaseError");
    });
  });

  describe("NotFoundError", () => {
    it("should create a not found error with correct defaults", () => {
      const error = new NotFoundError("Resource not found");

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.message).toBe("Resource not found");
      expect(error.code).toBe("NOT_FOUND");
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe("NotFoundError");
    });
  });

  describe("AuthenticationError", () => {
    it("should create an authentication error with correct defaults", () => {
      const error = new AuthenticationError("Invalid credentials");

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.message).toBe("Invalid credentials");
      expect(error.code).toBe("AUTHENTICATION_ERROR");
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe("AuthenticationError");
    });
  });

  describe("AuthorizationError", () => {
    it("should create an authorization error with correct defaults", () => {
      const error = new AuthorizationError("Insufficient permissions");

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.message).toBe("Insufficient permissions");
      expect(error.code).toBe("AUTHORIZATION_ERROR");
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe("AuthorizationError");
    });
  });

  describe("ExternalServiceError", () => {
    it("should create an external service error with correct defaults", () => {
      const error = new ExternalServiceError("API unavailable");

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.message).toBe("API unavailable");
      expect(error.code).toBe("EXTERNAL_SERVICE_ERROR");
      expect(error.statusCode).toBe(502);
      expect(error.name).toBe("ExternalServiceError");
    });
  });

  describe("RateLimitError", () => {
    it("should create a rate limit error with correct defaults", () => {
      const error = new RateLimitError("Too many requests");

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.message).toBe("Too many requests");
      expect(error.code).toBe("RATE_LIMIT_ERROR");
      expect(error.statusCode).toBe(429);
      expect(error.name).toBe("RateLimitError");
    });
  });

  describe("ConfigurationError", () => {
    it("should create a configuration error with correct defaults", () => {
      const error = new ConfigurationError("Invalid configuration");

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.message).toBe("Invalid configuration");
      expect(error.code).toBe("CONFIGURATION_ERROR");
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe("ConfigurationError");
    });
  });

  describe("CacheError", () => {
    it("should create a cache error with correct defaults", () => {
      const error = new CacheError("Cache operation failed");

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.message).toBe("Cache operation failed");
      expect(error.code).toBe("CACHE_ERROR");
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe("CacheError");
    });
  });

  describe("Error inheritance", () => {
    it("all errors should inherit from ApplicationError", () => {
      const errors = [
        new ValidationError("test"),
        new DatabaseError("test"),
        new NotFoundError("test"),
        new AuthenticationError("test"),
        new AuthorizationError("test"),
        new ExternalServiceError("test"),
        new RateLimitError("test"),
        new ConfigurationError("test"),
        new CacheError("test"),
      ];

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(ApplicationError);
      });
    });
  });
});
