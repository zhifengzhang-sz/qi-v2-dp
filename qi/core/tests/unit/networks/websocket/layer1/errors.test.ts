/**
 * @fileoverview
 * @module errors.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-25
 * @modified 2024-12-25
 */

import { describe, test, expect } from "vitest";
import {
  ERROR_CODES,
  ERROR_SEVERITY,
  type ErrorContext,
} from "@qi/core/networks/websocket/machine/errors";

describe("Layer 1 - Errors", () => {
  test("ERROR_CODES enum has correct values", () => {
    expect(ERROR_CODES).toBeDefined();
    expect(ERROR_CODES.INVALID_URL).toBe("INVALID_URL");
    expect(ERROR_CODES.CONNECTION_FAILED).toBe("CONNECTION_FAILED");
  });

  test("ERROR_SEVERITY enum has correct values", () => {
    expect(ERROR_SEVERITY).toBeDefined();
    expect(ERROR_SEVERITY.LOW).toBe("low");
    expect(ERROR_SEVERITY.HIGH).toBe("high");
  });

  test("ErrorContext type validation", () => {
    const context: ErrorContext = {
      code: ERROR_CODES.INVALID_URL,
      message: "Test error",
      severity: ERROR_SEVERITY.HIGH,
      timestamp: Date.now(),
    };

    expect(context.code).toBe(ERROR_CODES.INVALID_URL);
    expect(context.severity).toBe(ERROR_SEVERITY.HIGH);
    expect(context.message).toBe("Test error");
    expect(context.timestamp).toBeTypeOf("number");
  });
});
