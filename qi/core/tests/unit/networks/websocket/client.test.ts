/**
 * @fileoverview
 * @module client.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-12
 * @modified 2024-12-12
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import WebSocket from "ws";
import { ApplicationError } from "@qi/core/errors";
import { WebSocketClient } from "@qi/core/networks";
import { logger } from "@qi/core/logger";

// Mock modules
vi.mock("ws");
vi.mock("@qi/core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("WebSocketClient", () => {
  let client: WebSocketClient;
  let mockWs: any;
  type WSHandler = {
    message: (data: string) => void;
    error: (error: Error) => void;
    open: () => void;
    close: (code?: number, reason?: string) => void;
    pong: () => void;
  };
  let wsEventHandlers: { [K in keyof WSHandler]: Set<WSHandler[K]> };
  const TEST_URL = "ws://test.com";

  beforeEach(() => {
    vi.clearAllMocks();
    wsEventHandlers = {
      message: new Set<WSHandler["message"]>(),
      error: new Set<WSHandler["error"]>(),
      open: new Set<WSHandler["open"]>(),
      close: new Set<WSHandler["close"]>(),
      pong: new Set<WSHandler["pong"]>(),
    };

    mockWs = {
      on: vi.fn(
        <T extends keyof WSHandler>(event: T, handler: WSHandler[T]) => {
          wsEventHandlers[event]?.add(handler);
        }
      ),
      once: vi.fn(
        <T extends keyof WSHandler>(event: T, handler: WSHandler[T]) => {
          wsEventHandlers[event]?.add(handler);
        }
      ),
      removeListener: vi.fn(
        <T extends keyof WSHandler>(event: T, handler: WSHandler[T]) => {
          wsEventHandlers[event]?.delete(handler);
        }
      ),
      removeAllListeners: vi.fn(),
      send: vi.fn((data: string, callback?: (error?: Error) => void) => {
        if (callback) callback();
      }),
      ping: vi.fn(),
      close: vi.fn(),
      terminate: vi.fn(),
      readyState: WebSocket.OPEN,
    };

    vi.mocked(WebSocket).mockImplementation(() => mockWs);

    client = new WebSocketClient({
      pingInterval: 1000,
      pongTimeout: 500,
      reconnectInterval: 1000,
      maxReconnectAttempts: 3,
      connectionTimeout: 5000,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe("initialization", () => {
    it("should initialize with default config", () => {
      const defaultClient = new WebSocketClient();
      const config = defaultClient.getConfig();
      expect(config).toEqual({
        pingInterval: 30000,
        pongTimeout: 5000,
        reconnect: true,
        reconnectInterval: 5000,
        maxReconnectAttempts: 5,
        connectionTimeout: 30000,
      });
    });

    it("should initialize with custom config", () => {
      const config = client.getConfig();
      expect(config).toMatchObject({
        pingInterval: 1000,
        pongTimeout: 500,
        maxReconnectAttempts: 3,
      });
    });
  });

  describe("connection management", () => {
    it("should establish connection successfully", async () => {
      const connectPromise = client.connect(TEST_URL);
      const openHandler = Array.from(wsEventHandlers.open)[0] as () => void;
      openHandler();

      await connectPromise;
      expect(WebSocket).toHaveBeenCalledWith(TEST_URL);
      expect(client.getState()).toBe("connected");
      expect(logger.info).toHaveBeenCalledWith("WebSocket connected", {
        url: TEST_URL,
      });
    });

    it("should handle connection timeout", async () => {
      vi.useFakeTimers();
      const connectPromise = client.connect(TEST_URL);

      await vi.runAllTimersAsync();

      await expect(connectPromise).rejects.toThrow("Connection timeout");
      expect(client.getState()).toBe("disconnected");
    });

    it("should handle connection errors", async () => {
      const connectPromise = client.connect(TEST_URL);
      const errorHandler = Array.from(wsEventHandlers.error)[0] as (
        err: Error
      ) => void;
      errorHandler(new Error("ECONNREFUSED"));

      await expect(connectPromise).rejects.toThrow(ApplicationError);
      expect(client.getState()).toBe("disconnected");
      expect(logger.error).toHaveBeenCalledWith("WebSocket error", {
        error: expect.any(Error),
      });
    });

    it("should prevent multiple concurrent connections", async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const firstConnect = client.connect(TEST_URL);
      const secondConnect = client.connect(TEST_URL);

      await expect(secondConnect).rejects.toThrow("Invalid connection state");
    });
  });

  describe("message handling", () => {
    beforeEach(async () => {
      const connectPromise = client.connect(TEST_URL);
      const openHandler = Array.from(wsEventHandlers.open)[0] as () => void;
      openHandler();
      await connectPromise;
    });

    it("should handle valid messages", () => {
      const messageHandler = vi.fn();
      const testChannel = "test-channel";
      const testData = { value: 123 };

      client.subscribe(testChannel, messageHandler);

      const messageHandlers = Array.from(wsEventHandlers.message);
      messageHandlers[0](
        JSON.stringify({
          channel: testChannel,
          data: testData,
        })
      );

      expect(messageHandler).toHaveBeenCalledWith(testData);
    });

    it("should handle malformed messages", () => {
      const messageHandlers = Array.from(wsEventHandlers.message);
      messageHandlers[0]("invalid json");

      expect(logger.error).toHaveBeenCalledWith(
        "WebSocket message parse error",
        expect.any(Object)
      );
    });

    it("should handle message handler errors", () => {
      const errorHandler = vi.fn(() => {
        throw new Error("Handler error");
      });
      const testChannel = "test-channel";

      client.subscribe(testChannel, errorHandler);

      const messageHandlers = Array.from(wsEventHandlers.message);
      messageHandlers[0](
        JSON.stringify({
          channel: testChannel,
          data: { value: 123 },
        })
      );

      expect(logger.error).toHaveBeenCalledWith(
        "Message handler error",
        expect.any(Object)
      );
    });
  });

  describe("subscription management", () => {
    beforeEach(async () => {
      const connectPromise = client.connect(TEST_URL);
      const openHandler = Array.from(wsEventHandlers.open)[0] as () => void;
      openHandler();
      await connectPromise;
    });

    it("should handle subscription", async () => {
      const handler = vi.fn();
      const channel = "test-channel";

      client.subscribe(channel, handler);

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({ type: "subscribe", channel }),
        expect.any(Function)
      );
    });

    it("should handle unsubscribe for specific handler", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const channel = "test-channel";
      const testData = { value: 123 };

      client.subscribe(channel, handler1);
      client.subscribe(channel, handler2);
      client.unsubscribe(channel, handler1);

      const messageHandlers = Array.from(wsEventHandlers.message);
      messageHandlers[0](
        JSON.stringify({
          channel,
          data: testData,
        })
      );

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith(testData);
    });

    it("should handle unsubscribe all from channel", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const channel = "test-channel";

      client.subscribe(channel, handler1);
      client.subscribe(channel, handler2);
      client.unsubscribe(channel);

      expect(mockWs.send).toHaveBeenLastCalledWith(
        JSON.stringify({ type: "unsubscribe", channel }),
        expect.any(Function)
      );
    });
  });

  describe("heartbeat mechanism", () => {
    beforeEach(async () => {
      vi.useFakeTimers();
      const connectPromise = client.connect(TEST_URL);
      const openHandler = Array.from(wsEventHandlers.open)[0] as () => void;
      openHandler();
      await connectPromise;
    });

    it("should send ping messages", () => {
      vi.advanceTimersByTime(1000);
      expect(mockWs.ping).toHaveBeenCalled();
    });

    it("should handle pong responses", () => {
      vi.advanceTimersByTime(1000);
      const pongHandler = Array.from(wsEventHandlers.pong)[0] as () => void;
      pongHandler();
      vi.advanceTimersByTime(500);
      expect(mockWs.terminate).not.toHaveBeenCalled();
    });

    it("should handle pong timeout", () => {
      vi.advanceTimersByTime(1000);
      vi.advanceTimersByTime(500);
      expect(mockWs.terminate).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith("WebSocket pong timeout");
    });
  });

  describe("reconnection behavior", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it("should attempt reconnection after disconnect", async () => {
      const connectPromise = client.connect(TEST_URL);
      const openHandler = Array.from(wsEventHandlers.open)[0] as () => void;
      openHandler();
      await connectPromise;

      mockWs.readyState = WebSocket.CLOSED;
      const closeHandler = Array.from(wsEventHandlers.close)[0] as (
        code?: number,
        reason?: string
      ) => void;
      closeHandler();

      await vi.advanceTimersByTimeAsync(1000);

      expect(WebSocket).toHaveBeenCalledTimes(2);
      expect(client.getReconnectAttempts()).toBe(1);
    });

    it("should stop reconnection attempts after max attempts", async () => {
      const connectPromise = client.connect(TEST_URL);
      const openHandler = Array.from(wsEventHandlers.open)[0] as () => void;
      openHandler();
      await connectPromise;

      // Simulate multiple disconnects
      for (let i = 0; i < 4; i++) {
        mockWs.readyState = WebSocket.CLOSED;
        const closeHandler = Array.from(wsEventHandlers.close)[0] as () => void;
        closeHandler();
        await vi.advanceTimersByTimeAsync(1000);
      }

      expect(WebSocket).toHaveBeenCalledTimes(4); // Initial + 3 retries
      expect(client.getReconnectAttempts()).toBe(3);
    });
  });

  describe("cleanup", () => {
    it("should cleanup resources on close", async () => {
      const connectPromise = client.connect(TEST_URL);
      const openHandler = Array.from(wsEventHandlers.open)[0] as () => void;
      openHandler();
      await connectPromise;

      await client.close();

      expect(mockWs.close).toHaveBeenCalled();
      expect(mockWs.removeAllListeners).toHaveBeenCalled();
      expect(client.getState()).toBe("disconnected");
    });

    it("should handle close when not connected", async () => {
      await client.close();
      expect(mockWs.close).not.toHaveBeenCalled();
      expect(client.getState()).toBe("disconnected");
    });
  });
});
