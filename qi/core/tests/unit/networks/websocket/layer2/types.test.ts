/**
 * @fileoverview
 * @module types.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-25
 * @modified 2024-12-25
 */

import { describe, test, expect } from "vitest";
import type { WebSocketContext } from "@qi/core/networks/websocket/machine/types";
import { BASE_CONFIG } from "@qi/core/networks/websocket/machine/constants";

describe("Layer 2 - Types", () => {
  test("WebSocketContext type structure", () => {
    const context: WebSocketContext = {
      url: "ws://localhost:8080",
      status: "disconnected",
      socket: null,
      error: null,
      options: BASE_CONFIG,
      metrics: {
        messagesSent: 0,
        messagesReceived: 0,
        errors: [],
        bytesSent: 0,
        bytesReceived: 0,
        latency: [],
        eventHistory: [],
      },
      timing: {
        connectStart: null,
        connectEnd: null,
        lastMessageTime: null,
        lastEventTime: null,
        stateHistory: [],
      },
      rateLimit: {
        count: 0,
        window: 60000,
        lastReset: Date.now(),
        maxBurst: 0,
        history: [],
      },
      messageFlags: {
        isProcessing: false,
        lastProcessedMessageId: null,
        processingHistory: [],
      },
      queue: {
        messages: [],
        pending: false,
        droppedMessages: 0,
      },
      reconnectAttempts: 0,
      backoffDelay: BASE_CONFIG.reconnectInterval,
      retryCount: 0,
    };

    expect(context).toBeDefined();
    expect(context.reconnectAttempts).toBe(0);
    expect(context.backoffDelay).toBe(BASE_CONFIG.reconnectInterval);
    expect(context.retryCount).toBe(0);
  });
});
