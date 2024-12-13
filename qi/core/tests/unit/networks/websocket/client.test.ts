/**
 * @fileoverview
 * @module client.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-13
 * @modified 2024-12-13
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import WebSocket from "ws";
import { EventEmitter } from "events";
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

class MockWebSocket extends EventEmitter {
  public readyState: number;

  // Add a parameter to control 'open' event emission
  constructor(url: string | URL, shouldOpen = true) {
    super();
    this.readyState = WebSocket.CONNECTING;

    if (shouldOpen) {
      // Emit 'open' asynchronously
      process.nextTick(() => {
        if (this.readyState === WebSocket.CONNECTING) {
          this.readyState = WebSocket.OPEN;
          this.emit("open");
        }
      });
    }
  }

  send = vi.fn(
    (
      data: string | Buffer | ArrayBuffer | Buffer[],
      cb?: (err?: Error) => void
    ) => {
      if (cb) cb();
    }
  );

  ping = vi.fn();

  close = vi.fn(() => {
    this.readyState = WebSocket.CLOSING;
    this.emit("close");
    this.readyState = WebSocket.CLOSED;
  });

  terminate = vi.fn(() => {
    this.readyState = WebSocket.CLOSED;
    this.emit("close");
  });

  simulateDisconnect() {
    this.readyState = WebSocket.CLOSING;
    process.nextTick(() => {
      this.readyState = WebSocket.CLOSED;
      this.emit("close");
    });
  }
}

// MockErrorWebSocket class
class MockErrorWebSocket extends MockWebSocket {
  constructor(url: string | URL) {
    super(url, false);

    // Emit error synchronously
    const error = new Error("ECONNREFUSED");
    this.readyState = WebSocket.CLOSING;
    this.emit("error", error);
    this.readyState = WebSocket.CLOSED;
    this.emit("close");
  }
}

describe("WebSocketClient", () => {
  let client: WebSocketClient;
  let mockWs: MockWebSocket;
  const TEST_URL = "ws://test.com";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers(); // Use fake timers consistently

    // Mock logger to return itself for chaining
    vi.spyOn(logger, "error").mockReturnValue(logger);
    vi.spyOn(logger, "info").mockReturnValue(logger);
    vi.spyOn(logger, "warn").mockReturnValue(logger);

    // Setup WebSocket mock
    vi.mocked(WebSocket).mockImplementation((url: string | URL) => {
      mockWs = new MockWebSocket(url);
      return mockWs as unknown as WebSocket;
    });

    // Initialize client with config
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

  describe("connection management", () => {
    it("should establish connection successfully", async () => {
      const connectPromise = client.connect(TEST_URL);
      await connectPromise;

      expect(WebSocket).toHaveBeenCalledWith(TEST_URL);
      expect(client.getState()).toBe("connected");
      expect(logger.info).toHaveBeenCalledWith("WebSocket connected", {
        url: TEST_URL,
      });
    });

    it("should handle connection errors", async () => {
      // Use real timers
      vi.useRealTimers();

      // Mock the WebSocket to use `MockErrorWebSocket`
      vi.mocked(WebSocket).mockImplementationOnce((url: string | URL) => {
        mockWs = new MockErrorWebSocket(url);
        return mockWs as unknown as WebSocket;
      });

      // Attempt to connect and expect rejection
      await expect(client.connect(TEST_URL)).rejects.toThrow(ApplicationError);

      // Verify client state and logger call
      expect(client.getState()).toBe("disconnected");
      expect(logger.error).toHaveBeenCalledWith("WebSocket error", {
        error: expect.any(Error),
      });
    });
  });

  describe("subscription management", () => {
    beforeEach(async () => {
      const connectPromise = client.connect(TEST_URL);
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

    it("should handle connection errors", async () => {
      // Setup error websocket
      vi.mocked(WebSocket).mockImplementationOnce((url: string | URL) => {
        mockWs = new MockErrorWebSocket(url);
        return mockWs as unknown as WebSocket;
      });

      // Start connection and verify error
      const connectPromise = client.connect(TEST_URL);
      await expect(connectPromise).rejects.toThrow(ApplicationError);

      expect(client.getState()).toBe("disconnected");
      expect(logger.error).toHaveBeenCalledWith("WebSocket error", {
        error: expect.any(Error),
      });
    });
  });

  describe("heartbeat mechanism", () => {
    beforeEach(async () => {
      vi.useFakeTimers();
      const connectPromise = client.connect(TEST_URL);
      await vi.runOnlyPendingTimersAsync();
      await connectPromise;
    });

    it("should send ping messages", async () => {
      await vi.advanceTimersByTimeAsync(1000);
      expect(mockWs.ping).toHaveBeenCalled();
    });

    it("should handle pong timeout", async () => {
      await vi.advanceTimersByTimeAsync(1000); // Trigger ping
      await vi.advanceTimersByTimeAsync(500); // Wait for pong timeout

      expect(mockWs.terminate).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith("WebSocket pong timeout");
    });
  });

  describe("reconnection behavior", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it("should attempt reconnection after disconnect", async () => {
      // First need to establish initial connection
      const connectPromise = client.connect(TEST_URL);
      await vi.runOnlyPendingTimersAsync();
      await connectPromise;

      // Clear the initial WebSocket constructor call
      vi.mocked(WebSocket).mockClear();

      // Setup next WebSocket instance for reconnection
      const newMockWs = new MockWebSocket(TEST_URL);
      vi.mocked(WebSocket).mockImplementationOnce(
        () => newMockWs as unknown as WebSocket
      );

      // Track reconnection attempts
      const connectSpy = vi.fn();
      client.on("connecting", connectSpy);

      // Simulate disconnection
      mockWs.readyState = WebSocket.CLOSED;
      mockWs.emit("close");

      // Wait for reconnect interval
      await vi.advanceTimersByTimeAsync(1000);
      await vi.runOnlyPendingTimersAsync();

      expect(WebSocket).toHaveBeenCalledTimes(1);
      expect(connectSpy).toHaveBeenCalled();
    });

    it("should stop reconnection attempts after max attempts", async () => {
      // First establish connection
      const connectPromise = client.connect(TEST_URL);
      await vi.runOnlyPendingTimersAsync();
      await connectPromise;

      // Clear initial connection
      vi.mocked(WebSocket).mockClear();

      // Simulate max retries
      for (let i = 0; i < 3; i++) {
        // Setup next mock for each attempt
        const newMockWs = new MockWebSocket(TEST_URL);
        vi.mocked(WebSocket).mockImplementationOnce(
          () => newMockWs as unknown as WebSocket
        );

        // Simulate connection failure
        mockWs.readyState = WebSocket.CLOSED;
        mockWs.emit("close");

        // Update reference to new mock
        mockWs = newMockWs;

        // Wait for reconnect interval and let promises resolve
        await vi.advanceTimersByTimeAsync(1000);
        await vi.runOnlyPendingTimersAsync();
      }

      expect(WebSocket).toHaveBeenCalledTimes(3);
      expect(client.getReconnectAttempts()).toBe(3);
    });
  });
});
