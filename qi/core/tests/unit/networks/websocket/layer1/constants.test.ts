/**
 * @fileoverview
 * @module constants.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-25
 * @modified 2024-12-25
 */

import { describe, test, expect } from "vitest";
import {
  STATES,
  EVENTS,
  BASE_CONFIG,
  CLOSE_CODES,
} from "@qi/core/networks/websocket/machine/constants";

describe("Layer 1 - Constants", () => {
  test("STATES constants", () => {
    expect(STATES).toEqual({
      DISCONNECTED: "disconnected",
      CONNECTING: "connecting",
      CONNECTED: "connected",
      RECONNECTING: "reconnecting",
      DISCONNECTING: "disconnecting",
      TERMINATED: "terminated",
    });
  });

  test("EVENTS constants", () => {
    expect(EVENTS).toEqual({
      CONNECT: "CONNECT",
      DISCONNECT: "DISCONNECT",
      OPEN: "OPEN",
      CLOSE: "CLOSE",
      ERROR: "ERROR",
      MESSAGE: "MESSAGE",
      SEND: "SEND",
      RETRY: "RETRY",
      MAX_RETRIES: "MAX_RETRIES",
      TERMINATE: "TERMINATE",
    });
  });

  test("BASE_CONFIG constants", () => {
    expect(BASE_CONFIG).toEqual({
      reconnect: true,
      maxReconnectAttempts: 5,
      reconnectInterval: 1000,
      messageQueueSize: 100,
      maxLatencyHistory: 50,
      maxEventHistory: 100,
      maxStateHistory: 200,
    });
  });

  test("CLOSE_CODES constants", () => {
    expect(CLOSE_CODES).toEqual({
      NORMAL_CLOSURE: 1000,
      GOING_AWAY: 1001,
      PROTOCOL_ERROR: 1002,
      INVALID_DATA: 1003,
      POLICY_VIOLATION: 1008,
      MESSAGE_TOO_BIG: 1009,
      INTERNAL_ERROR: 1011,
      CONNECTION_FAILED: 1006,
    });
  });
});
