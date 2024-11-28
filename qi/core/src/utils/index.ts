/**
 * @fileoverview Core utility functions providing common operations, environment handling,
 * data formatting, and enhanced error handling capabilities.
 * @module @qi/core/utils
 *
 * Key Features:
 * - Environment file loading and parsing
 * - Secure cryptographic hashing
 * - Data formatting (bytes, JSON, truncation)
 * - Retry mechanisms for operations
 * - Lodash utility re-exports
 *
 * @author Zhifeng Zhang
 * @created 2024-03-18
 * @modified 2024-11-28
 */

import {
  debounce,
  throttle,
  merge as deepMerge,
  isPlainObject,
  uniqBy as uniqueBy,
} from "lodash-es";
import { createHash } from "crypto";
import bytes from "bytes";
import retry from "retry";
import { promises as fs } from "fs";
import chalk from "chalk";

// Re-export lodash utilities
export { debounce, throttle, deepMerge, isPlainObject, uniqueBy };

/**
 * Handles file not found errors by returning a fallback value.
 * Used for graceful handling of missing config/env files.
 *
 * @param promise - Promise that might reject with ENOENT/ENOTDIR
 * @param fallbackValue - Value to return if file not found
 * @returns Promise resolving to either the original value or fallback
 *
 * @example
 * ```typescript
 * const content = await orIfFileNotExist(
 *   fs.readFile('config.json'),
 *   '{}'
 * );
 * ```
 */
async function orIfFileNotExist<T>(
  promise: Promise<T>,
  fallbackValue: T
): Promise<T> {
  try {
    return await promise;
  } catch (e) {
    if (
      (e as NodeJS.ErrnoException).code === "ENOENT" ||
      (e as NodeJS.ErrnoException).code === "ENOTDIR"
    ) {
      return fallbackValue;
    }
    throw e;
  }
}

/**
 * Parses environment file content in KEY=VALUE format.
 * Handles comments, empty lines, and quoted values.
 *
 * @param content - Raw content of environment file
 * @returns Object mapping environment variable names to values
 *
 * @example
 * ```typescript
 * const vars = parseEnvFile(`
 *   # Database config
 *   DB_HOST=localhost
 *   DB_PORT=5432
 *   DB_NAME="my_app"
 * `);
 * ```
 */
function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};

  content.split("\n").forEach((line) => {
    line = line.trim();
    if (!line || line.startsWith("#")) return;

    const [key, ...valueParts] = line.split("=");
    if (!key || valueParts.length === 0) return;

    const value = valueParts.join("=").trim();
    result[key.trim()] = value.replace(/^["']|["']$/g, "");
  });

  return result;
}

/**
 * Loads and parses environment variables from a file.
 * Supports optional overriding of existing variables.
 *
 * @param envFile - Path to environment file
 * @param options - Configuration options
 *        - override: Whether to override existing variables
 * @returns Parsed environment variables or null if file doesn't exist
 *
 * @example
 * ```typescript
 * // Load without overriding existing vars
 * const vars = await loadEnv('.env');
 *
 * // Load and override existing vars
 * const vars = await loadEnv('.env.local', { override: true });
 * ```
 */
export async function loadEnv(
  envFile: string,
  options: { override?: boolean } = {}
): Promise<Record<string, string> | null> {
  const data = await orIfFileNotExist(fs.readFile(envFile, "utf8"), null);
  if (data === null) return null;

  const parsed = parseEnvFile(data);

  if (options.override) {
    Object.entries(parsed).forEach(([key, value]) => {
      process.env[key] = value;
    });
  } else {
    Object.entries(parsed).forEach(([key, value]) => {
      if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
        process.env[key] = value;
      }
    });
  }

  return parsed;
}

/**
 * Creates a SHA-256 hash of the input string.
 *
 * @param input - String to hash
 * @returns Hexadecimal hash string
 *
 * @example
 * ```typescript
 * const hashedPassword = hash('user-password');
 * ```
 */
export function hash(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Formats byte sizes into human-readable strings.
 *
 * @param byteCount - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with units (e.g., "1.5 MB")
 *
 * @example
 * ```typescript
 * console.log(formatBytes(1536)); // "1.5 KB"
 * console.log(formatBytes(1048576, 1)); // "1.0 MB"
 * ```
 */
export function formatBytes(byteCount: number, decimals = 2): string {
  return bytes.format(byteCount, {
    unitSeparator: " ",
    decimalPlaces: decimals,
  });
}

/**
 * Truncates a string to specified length, adding ellipsis if needed.
 *
 * @param str - String to truncate
 * @param length - Maximum length
 * @returns Truncated string with ellipsis if needed
 *
 * @example
 * ```typescript
 * console.log(truncate("Long text here", 8)); // "Long ..."
 * ```
 */
export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + "..." : str;
}

/**
 * Retries an asynchronous operation with exponential backoff.
 *
 * @param fn - Async function to retry
 * @param options - Retry configuration
 *        - retries: Maximum number of attempts
 *        - minTimeout: Initial timeout in milliseconds
 * @returns Promise resolving to function result
 *
 * @example
 * ```typescript
 * const data = await retryOperation(
 *   () => fetchData(),
 *   { retries: 3, minTimeout: 1000 }
 * );
 * ```
 */
export async function retryOperation<T>(
  fn: () => Promise<T>,
  options: {
    retries: number;
    minTimeout: number;
    onRetry?: (times: number) => void;
  } = { retries: 3, minTimeout: 1000 }
): Promise<T> {
  const operation = retry.operation({
    ...options,
    randomize: false,
  });

  return new Promise((resolve, reject) => {
    operation.attempt(async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (err) {
        if (!operation.retry(err as Error)) {
          reject(operation.mainError());
        } else if (options.onRetry) {
          options.onRetry(operation.attempts());
        }
      }
    });
  });
}

/**
 * Formats a JSON object with color-coded syntax highlighting.
 * Color scheme:
 * - Blue: Property keys
 * - Green: String values
 * - Yellow: Numbers, booleans, null
 * - White: Structural characters
 *
 * @param obj - Object to format
 * @returns Color-formatted JSON string
 *
 * @example
 * ```typescript
 * console.log(formatJsonWithColor({
 *   name: "test",
 *   count: 42,
 *   active: true
 * }));
 * ```
 */
export const formatJsonWithColor = (obj: unknown): string => {
  const colorizeValue = (value: unknown): string => {
    if (typeof value === "string") {
      return chalk.green(`"${value}"`);
    }
    if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      return chalk.yellow(String(value));
    }
    return String(value);
  };

  const formatWithIndent = (data: unknown, indent = 0): string => {
    const spaces = " ".repeat(indent * 2);

    if (Array.isArray(data)) {
      if (data.length === 0) return "[]";
      const items = data
        .map((item) => `${spaces}  ${formatWithIndent(item, indent + 1)}`)
        .join(",\n");
      return `[\n${items}\n${spaces}]`;
    }

    if (data && typeof data === "object" && data !== null) {
      if (Object.keys(data).length === 0) return "{}";
      const entries = Object.entries(data)
        .map(([key, value]) => {
          const coloredKey = chalk.blue(`"${key}"`);
          const formattedValue = formatWithIndent(value, indent + 1);
          return `${spaces}  ${coloredKey}: ${formattedValue}`;
        })
        .join(",\n");
      return `{\n${entries}\n${spaces}}`;
    }

    return colorizeValue(data);
  };

  return formatWithIndent(obj);
};
