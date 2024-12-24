/**
 * @fileoverview Pure utility functions for WebSocket operations
 * @module @qi/core/network/websocket/utils
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-25
 */

import {
  WebSocketEvent,
  WebSocketContext,
  StateValidationResult,
  TransitionValidationResult,
} from "./types.js";
import { StateDefinition } from "./states.js";

/**
 * Type guard for WebSocket events
 */
export function isWebSocketEvent(value: unknown): value is WebSocketEvent {
  if (
    !value ||
    typeof value !== "object" ||
    !("type" in value) ||
    !("timestamp" in value)
  ) {
    return false;
  }
  const event = value as Partial<WebSocketEvent>;
  return typeof event.type === "string" && typeof event.timestamp === "number";
}

/**
 * Validate event payload structure
 */
export function validateEventPayload(
  event: WebSocketEvent
): TransitionValidationResult {
  if (!event || typeof event !== "object") {
    return { isValid: false, reason: "Event must be an object" };
  }

  // Type-specific validations
  switch (event.type) {
    case "CONNECT":
      if (!event.url || typeof event.url !== "string") {
        return {
          isValid: false,
          reason: "CONNECT event must have a valid URL",
        };
      }
      break;

    case "MESSAGE":
    case "SEND":
      if (event.size !== undefined && typeof event.size !== "number") {
        return { isValid: false, reason: "Message size must be a number" };
      }
      break;

    case "RETRY":
      if (
        typeof event.attempt !== "number" ||
        typeof event.delay !== "number"
      ) {
        return {
          isValid: false,
          reason: "RETRY event must have valid attempt and delay",
        };
      }
      break;
  }

  return { isValid: true };
}

/**
 * Validate WebSocket URL
 */
export function validateUrl(url: string): TransitionValidationResult {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
      return { isValid: false, reason: "URL must use ws: or wss: protocol" };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, reason: "Invalid URL format" };
  }
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoff(
  retryCount: number,
  baseInterval: number,
  maxInterval: number = 30000
): number {
  const delay = baseInterval * Math.pow(2, retryCount);
  return Math.min(delay, maxInterval);
}

/**
 * Validate state invariants
 */
export function validateStateInvariants(
  state: StateDefinition,
  context: WebSocketContext
): StateValidationResult {
  const failures: string[] = [];

  state.invariants.forEach((invariant) => {
    if (!invariant.check(context)) {
      failures.push(invariant.description);
    }
  });

  return {
    isValid: failures.length === 0,
    failures: failures,
  };
}

/**
 * Format bytes for logging
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
