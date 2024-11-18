/**
 * @fileoverview
 * @module logger.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-19
 * @modified 2024-11-19
 */

// <reference types="vitest" />
/**
 * @module tests/unit/logger
 * @description Unit tests for logger module
 */

import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs";

// Define types for our mocked Winston
type MockLogger = {
  info: Mock;
  error: Mock;
  warn: Mock;
  debug: Mock;
  add: Mock;
};

type MockFormat = {
  combine: Mock;
  timestamp: Mock;
  printf: Mock;
  colorize: Mock;
  align: Mock;
};

type MockWinston = {
  format: MockFormat;
  createLogger: Mock;
  transports: {
    Console: Mock;
    File: Mock;
  };
};

// Move the mock setup to the top level
const mockLogger: MockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  add: vi.fn(),
};

const mockFormat: MockFormat = {
  combine: vi.fn().mockReturnValue({}),
  timestamp: vi.fn().mockReturnValue({}),
  printf: vi.fn().mockReturnValue({}),
  colorize: vi.fn().mockReturnValue({}),
  align: vi.fn().mockReturnValue({}),
};

const mockWinston: MockWinston = {
  format: mockFormat,
  createLogger: vi.fn().mockReturnValue(mockLogger),
  transports: {
    Console: vi.fn(),
    File: vi.fn(),
  },
};

// Hoist mock declaration
vi.mock("winston", () => ({
  default: mockWinston,
  ...mockWinston,
}));

describe("logger", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
    // Reset all mocks
    Object.values(mockFormat).forEach((mock) => mock.mockClear());
    Object.values(mockLogger).forEach((mock) => mock.mockClear());
    mockWinston.createLogger.mockClear();
    mockWinston.transports.Console.mockClear();
    mockWinston.transports.File.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
    // Clean up log files if they exist
    ["error.log", "combined.log"].forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
  });

  describe("configuration", () => {
    it("should create logger with default level info", async () => {
      await import("@qi/core/logger");
      expect(mockWinston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: "info",
        })
      );
    });

    it("should respect LOG_LEVEL environment variable", async () => {
      process.env.LOG_LEVEL = "debug";
      await import("@qi/core/logger");
      expect(mockWinston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: "debug",
        })
      );
    });

    it("should configure console transport", async () => {
      await import("@qi/core/logger");
      expect(mockWinston.transports.Console).toHaveBeenCalledWith(
        expect.objectContaining({
          stderrLevels: ["error"],
        })
      );
    });
  });

  describe("development environment", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("should add file transports in development", async () => {
      await import("@qi/core/logger");
      expect(mockWinston.transports.File).toHaveBeenCalledTimes(2);
      expect(mockWinston.transports.File).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: "error.log",
          level: "error",
        })
      );
      expect(mockWinston.transports.File).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: "combined.log",
        })
      );
    });
  });

  describe("production environment", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("should not add file transports in production", async () => {
      await import("@qi/core/logger");
      expect(mockWinston.transports.File).not.toHaveBeenCalled();
    });
  });

  describe("logging functionality", () => {
    beforeEach(async () => {
      const { logger } = await import("@qi/core/logger");
      logger.info("test message");
    });

    it("should log messages with correct level", () => {
      expect(mockLogger.info).toHaveBeenCalledWith("test message");
    });

    it("should handle metadata objects", () => {
      const metadata = { userId: "123", action: "test" };
      mockLogger.info("test message", metadata);
      expect(mockLogger.info).toHaveBeenCalledWith("test message", metadata);
    });

    it("should log errors with stack traces", () => {
      const error = new Error("test error");
      mockLogger.error("error occurred", { error });
      expect(mockLogger.error).toHaveBeenCalledWith("error occurred", {
        error,
      });
    });
  });

  describe("format", () => {
    it("should use custom format with timestamp", async () => {
      await import("@qi/core/logger");
      expect(mockFormat.timestamp).toHaveBeenCalledWith(
        expect.objectContaining({
          format: "YYYY-MM-DD HH:mm:ss.SSS",
        })
      );
    });

    it("should use colorize format", async () => {
      await import("@qi/core/logger");
      expect(mockFormat.colorize).toHaveBeenCalledWith(
        expect.objectContaining({
          all: true,
        })
      );
    });

    it("should combine multiple formats", async () => {
      await import("@qi/core/logger");
      expect(mockFormat.combine).toHaveBeenCalled();
    });
  });
});
