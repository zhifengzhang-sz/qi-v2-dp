/**
 * @fileoverview
 * @module utils.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-19
 * @modified 2024-12-25
 */

import { debounce, merge, uniqBy } from "lodash-es";
import {
  hash,
  formatBytes,
  truncate,
  retryOperation,
  loadEnv,
  formatJsonWithColor,
} from "@qi/core/utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { promises as fsPromises } from "fs";
import chalk from "chalk";

// Mock fs promises
vi.mock("fs", () => {
  const mockReadFile = vi.fn().mockResolvedValue("");
  return {
    promises: { readFile: mockReadFile },
    default: { promises: { readFile: mockReadFile } },
  };
});

vi.mock("chalk", () => ({
  default: {
    blue: vi.fn((text) => `BLUE(${text})`),
    green: vi.fn((text) => `GREEN(${text})`),
    yellow: vi.fn((text) => `YELLOW(${text})`),
  },
  blue: vi.fn((text) => `BLUE(${text})`),
  green: vi.fn((text) => `GREEN(${text})`),
  yellow: vi.fn((text) => `YELLOW(${text})`),
}));

describe("Utils", () => {
  // Existing test suites remain the same
  describe("hash", () => {
    it("should generate consistent SHA256 hash", () => {
      const input = "password123";
      const expected =
        "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f";
      expect(hash(input)).toBe(expected);
    });

    it("should generate different hashes for different inputs", () => {
      expect(hash("test1")).not.toBe(hash("test2"));
    });
  });

  describe("formatBytes", () => {
    it("should format bytes with default decimals", () => {
      expect(formatBytes(1234567)).toBe("1.18 MB");
    });

    it("should respect custom decimals", () => {
      expect(formatBytes(1234567, 1)).toBe("1.2 MB");
    });
  });

  describe("truncate", () => {
    it("should truncate long strings", () => {
      expect(truncate("Hello World", 5)).toBe("Hello...");
    });

    it("should not truncate short strings", () => {
      expect(truncate("Hello", 5)).toBe("Hello");
    });
  });

  describe("retryOperation", () => {
    beforeEach(() => {
      vi.useFakeTimers({
        legacyFakeTimers: true,
      } as any);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should retry failed operations", async () => {
      let attempts = 0;
      const operation = vi
        .fn()
        .mockImplementation(async (): Promise<string> => {
          attempts++;
          if (attempts < 3) throw new Error("Temporary failure");
          return "success";
        });

      const promiseResult = retryOperation(operation as () => Promise<string>, {
        retries: 3,
        minTimeout: 100,
      });

      for (let i = 0; i < 3; i++) {
        await Promise.resolve();
        vi.advanceTimersByTime(100);
      }
      await Promise.resolve();

      const result = await promiseResult;
      expect(result).toBe("success");
      expect(attempts).toBe(3);
    });

    it("should throw after max retries", async () => {
      const operation = vi.fn().mockImplementation(async (): Promise<never> => {
        throw new Error("Permanent failure");
      });

      const promiseResult = retryOperation(operation as () => Promise<string>, {
        retries: 2,
        minTimeout: 100,
      });

      for (let i = 0; i < 3; i++) {
        await Promise.resolve();
        vi.advanceTimersByTime(100);
      }
      await Promise.resolve();

      await expect(promiseResult).rejects.toThrow("Permanent failure");
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  // New test suites for additional functions
  describe("loadEnv", () => {
    beforeEach(() => {
      vi.resetAllMocks();
      process.env = {};
    });

    it("should return null if file doesn't exist", async () => {
      vi.mocked(fsPromises.readFile).mockRejectedValueOnce(
        Object.assign(new Error(), { code: "ENOENT" })
      );
      const result = await loadEnv("test.env");
      expect(result).toBeNull();
    });

    it("should load and parse environment variables without override", async () => {
      process.env.EXISTING = "old_value";

      vi.mocked(fsPromises.readFile).mockResolvedValueOnce(
        "NEW=value\nEXISTING=new_value" as any
      );

      const result = await loadEnv("test.env");

      expect(result).toEqual({
        NEW: "value",
        EXISTING: "new_value",
      });

      expect(process.env.NEW).toBe("value");
      expect(process.env.EXISTING).toBe("old_value");
    });

    it("should override existing environment variables when override is true", async () => {
      process.env.EXISTING = "old_value";

      vi.mocked(fsPromises.readFile).mockResolvedValueOnce(
        "EXISTING=new_value" as any
      );

      const result = await loadEnv("test.env", { override: true });

      expect(result).toEqual({
        EXISTING: "new_value",
      });

      expect(process.env.EXISTING).toBe("new_value");
    });

    it("should handle complex env file formats", async () => {
      vi.mocked(fsPromises.readFile).mockResolvedValueOnce(
        '# Comment\nBASIC=value\nQUOTED="quoted value"\nEMPTY=\nSPACES= value with spaces \n' as any
      );

      const result = await loadEnv("test.env");

      expect(result).toEqual({
        BASIC: "value",
        QUOTED: "quoted value",
        EMPTY: "",
        SPACES: "value with spaces",
      });
    });

    it("should parse env file correctly", async () => {
      vi.mocked(fsPromises.readFile).mockResolvedValueOnce(
        "KEY=value\nNUMBER=123"
      );

      const result = await loadEnv("test.env");
      expect(result).toEqual({
        KEY: "value",
        NUMBER: "123",
      });
    });

    it("should handle override option", async () => {
      process.env.EXISTING = "old";
      vi.mocked(fsPromises.readFile).mockResolvedValueOnce("EXISTING=new");

      await loadEnv("test.env", { override: true });
      expect(process.env.EXISTING).toBe("new");
    });
  });

  describe("formatJsonWithColor", () => {
    beforeEach(() => {
      vi.mocked(chalk.blue).mockImplementation((text) => `BLUE(${text})`);
      vi.mocked(chalk.green).mockImplementation((text) => `GREEN(${text})`);
      vi.mocked(chalk.yellow).mockImplementation((text) => `YELLOW(${text})`);
    });

    it("should format JSON with appropriate colors", () => {
      const input = {
        name: "test",
        age: 25,
        active: true,
        data: null,
      };

      const result = formatJsonWithColor(input);

      expect(result).toContain('BLUE("name")');
      expect(result).toContain('GREEN("test")');
      expect(result).toContain("YELLOW(25)");
      expect(result).toContain("YELLOW(true)");
      expect(result).toContain("YELLOW(null)");
    });
  });

  describe("Library function integration", () => {
    afterEach(() => {
      vi.useRealTimers();
    });
    it("should debounce function calls correctly", () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();
      vi.runAllTimers();
      expect(fn).toHaveBeenCalledTimes(1);

      //vi.useRealTimers();
    });

    it("should merge objects deeply", () => {
      const target = { a: 1, b: { x: 1 } };
      const source = { b: { y: 2 }, c: 3 };
      const expected = { a: 1, b: { x: 1, y: 2 }, c: 3 };

      expect(merge(target, source)).toEqual(expected);
    });

    it("should filter unique objects by key", () => {
      const input = [
        { id: 1, name: "John" },
        { id: 1, name: "Johnny" },
        { id: 2, name: "Jane" },
      ];
      const expected = [
        { id: 1, name: "John" },
        { id: 2, name: "Jane" },
      ];

      expect(uniqBy(input, "id")).toEqual(expected);
    });
  });
});
