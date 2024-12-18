/**
 * @fileoverview
 * @module machine.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-18
 * @modified 2024-12-18
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createActor } from "xstate";
import { createWebSocketMachine } from "@qi/core/networks/websocket/machine/machine";
import { WebSocketStates } from "@qi/core/networks/websocket/machine/websocket-states";
import { createMockSocket, waitForState } from "./test-helpers.js";

describe("WebSocket Machine", () => {
  let mockSocket: ReturnType<typeof createMockSocket>;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockSocket = createMockSocket();
    vi.stubGlobal(
      "WebSocket",
      vi.fn(() => mockSocket)
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("Initial State and Basic Transitions", () => {
    it("should start in disconnected state", () => {
      const machine = createWebSocketMachine();
      const actor = createActor(machine);
      actor.start();

      expect(actor.getSnapshot().value).toBe("disconnected");
    });

    it("should transition to connecting state on CONNECT event", async () => {
      const machine = createWebSocketMachine();
      const actor = createActor(machine);
      actor.start();

      actor.send({ type: "CONNECT", url: "ws://test", timestamp: Date.now() });
      await waitForState(actor, "connecting");

      expect(actor.getSnapshot().value).toBe("connecting");
    });

    it("should transition to connected state when connection is established", async () => {
      const machine = createWebSocketMachine();
      const actor = createActor(machine);
      actor.start();

      actor.send({ type: "CONNECT", url: "ws://test", timestamp: Date.now() });
      await waitForState(actor, "connecting");

      mockSocket.readyState = WebSocketStates.OPEN;
      mockSocket.onopen?.(new Event("open"));
      await waitForState(actor, "connected");

      expect(actor.getSnapshot().value).toBe("connected");
    });
  });

  describe("Connection Error Handling", () => {
    it("should transition to backingOff state on connection error when retries are enabled", async () => {
      const machine = createWebSocketMachine({
        reconnect: true,
        maxReconnectAttempts: 3,
      });
      const actor = createActor(machine);
      actor.start();

      actor.send({ type: "CONNECT", url: "ws://test", timestamp: Date.now() });
      await waitForState(actor, "connecting");

      mockSocket.onerror?.(new Error("Connection failed"));
      await waitForState(actor, "backingOff");

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe("backingOff");
      expect(snapshot.context.state.connectionAttempts).toBe(1);
    });

    it("should transition to disconnected state when max retries are exceeded", async () => {
      const machine = createWebSocketMachine({
        reconnect: true,
        maxReconnectAttempts: 1,
      });
      const actor = createActor(machine);
      actor.start();

      // First attempt
      actor.send({ type: "CONNECT", url: "ws://test", timestamp: Date.now() });
      await waitForState(actor, "connecting");
      mockSocket.onerror?.(new Error("Connection failed"));
      await waitForState(actor, "backingOff");

      // Second attempt
      actor.send({
        type: "RETRY",
        timestamp: Date.now(),
        attempt: 2,
        delay: 1000,
      });
      await waitForState(actor, "connecting");
      mockSocket.onerror?.(new Error("Connection failed again"));
      await waitForState(actor, "disconnected");

      const snapshot = actor.getSnapshot();
      expect(snapshot.context.state.connectionAttempts).toBe(2);
    });
  });

  describe("Message Handling", () => {
    it("should handle incoming messages in connected state", async () => {
      const machine = createWebSocketMachine();
      const actor = createActor(machine);
      actor.start();

      // Connect
      actor.send({ type: "CONNECT", url: "ws://test", timestamp: Date.now() });
      await waitForState(actor, "connecting");

      // Establish connection
      mockSocket.readyState = WebSocketStates.OPEN;
      mockSocket.onopen?.(new Event("open"));
      await waitForState(actor, "connected");

      // Send test message
      const testMessage = { type: "test", data: "hello" };
      mockSocket.onmessage?.({
        data: JSON.stringify(testMessage),
      } as MessageEvent);

      const snapshot = actor.getSnapshot();
      expect(snapshot.context.metrics.messagesReceived).toBe(1);
    });

    it("should handle message queue in connected state", async () => {
      const machine = createWebSocketMachine();
      const actor = createActor(machine);
      actor.start();

      // Connect
      actor.send({ type: "CONNECT", url: "ws://test", timestamp: Date.now() });
      await waitForState(actor, "connecting");

      // Establish connection
      mockSocket.readyState = WebSocketStates.OPEN;
      mockSocket.onopen?.(new Event("open"));
      await waitForState(actor, "connected");

      // Send message
      actor.send({
        type: "SEND",
        data: { test: "message" },
        timestamp: Date.now(),
      });

      // Wait for message processing
      await vi.runAllTimersAsync();

      expect(mockSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ test: "message" })
      );
    });
  });

  describe("Disconnection Handling", () => {
    it("should handle clean disconnection", async () => {
      const machine = createWebSocketMachine();
      const actor = createActor(machine);
      actor.start();

      // Connect
      actor.send({ type: "CONNECT", url: "ws://test", timestamp: Date.now() });
      await waitForState(actor, "connecting");

      // Establish connection
      mockSocket.readyState = WebSocketStates.OPEN;
      mockSocket.onopen?.(new Event("open"));
      await waitForState(actor, "connected");

      // Initiate disconnect
      actor.send({ type: "DISCONNECT", timestamp: Date.now() });
      await waitForState(actor, "disconnecting");

      mockSocket.readyState = WebSocketStates.CLOSED;
      mockSocket.onclose?.({
        code: 1000,
        reason: "Normal closure",
        wasClean: true,
      } as CloseEvent);
      await waitForState(actor, "disconnected");

      expect(actor.getSnapshot().value).toBe("disconnected");
      expect(mockSocket.close).toHaveBeenCalled();
    });

    it("should attempt reconnection on unexpected disconnection", async () => {
      const machine = createWebSocketMachine({
        reconnect: true,
        maxReconnectAttempts: 3,
      });
      const actor = createActor(machine);
      actor.start();

      // Connect
      actor.send({ type: "CONNECT", url: "ws://test", timestamp: Date.now() });
      await waitForState(actor, "connecting");

      // Establish connection
      mockSocket.readyState = WebSocketStates.OPEN;
      mockSocket.onopen?.(new Event("open"));
      await waitForState(actor, "connected");

      // Simulate unexpected disconnection
      mockSocket.readyState = WebSocketStates.CLOSED;
      mockSocket.onclose?.({
        code: 1006,
        reason: "Abnormal closure",
        wasClean: false,
      } as CloseEvent);
      await waitForState(actor, "backingOff");

      expect(actor.getSnapshot().value).toBe("backingOff");
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce rate limits on message sending", async () => {
      const machine = createWebSocketMachine({
        rateLimit: { messages: 2, window: 1000 },
      });
      const actor = createActor(machine);
      actor.start();

      // Connect
      actor.send({ type: "CONNECT", url: "ws://test", timestamp: Date.now() });
      await waitForState(actor, "connecting");

      // Establish connection
      mockSocket.readyState = WebSocketStates.OPEN;
      mockSocket.onopen?.(new Event("open"));
      await waitForState(actor, "connected");

      // Send messages quickly
      actor.send({ type: "SEND", data: "message1", timestamp: Date.now() });
      actor.send({ type: "SEND", data: "message2", timestamp: Date.now() });
      actor.send({ type: "SEND", data: "message3", timestamp: Date.now() });

      // Wait for message processing
      await vi.runAllTimersAsync();

      const snapshot = actor.getSnapshot();
      expect(mockSocket.send).toHaveBeenCalledTimes(2);
      expect(snapshot.context.queue.messages).toHaveLength(1);
    });
  });

  describe("Context Updates", () => {
    it("should update metrics on successful operations", async () => {
      const machine = createWebSocketMachine();
      const actor = createActor(machine);
      actor.start();

      // Connect
      actor.send({ type: "CONNECT", url: "ws://test", timestamp: Date.now() });
      await waitForState(actor, "connecting");

      // Establish connection
      mockSocket.readyState = WebSocketStates.OPEN;
      mockSocket.onopen?.(new Event("open"));
      await waitForState(actor, "connected");

      // Send test message
      mockSocket.onmessage?.({
        data: JSON.stringify({ type: "test" }),
      } as MessageEvent);

      const context = actor.getSnapshot().context;
      expect(context.metrics.messagesReceived).toBeGreaterThan(0);
      expect(context.state.lastMessageTime).toBeGreaterThan(0);
    });

    it("should maintain error history", async () => {
      const machine = createWebSocketMachine();
      const actor = createActor(machine);
      actor.start();

      // Connect and trigger errors
      actor.send({ type: "CONNECT", url: "ws://test", timestamp: Date.now() });
      await waitForState(actor, "connecting");

      mockSocket.onerror?.(new Error("Test error 1"));
      mockSocket.onerror?.(new Error("Test error 2"));

      const context = actor.getSnapshot().context;
      expect(context.errors).toHaveLength(2);
      expect(context.errors[0].error.message).toBe("Test error 1");
    });
  });
});
