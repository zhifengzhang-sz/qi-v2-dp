/**
 * @fileoverview Test helpers for WebSocket unit tests
 * @module test-helpers.ts
 */
import { vi } from "vitest";
import type {
  WebSocketContext,
  Options,
} from "@qi/core/networks/websocket/machine/types";
import { BASE_CONFIG } from "@qi/core/networks/websocket/machine/constants";

/**
 * Interface defining WebSocketEventMap for TypeScript
 */
interface WebSocketEventMap {
  open: Event;
  close: CloseEvent;
  message: MessageEvent;
  error: Event;
}

type WebSocketEventListeners = {
  [K in keyof WebSocketEventMap]: {
    listeners: Array<(ev: WebSocketEventMap[K]) => void>;
  };
};

/**
 * Mock implementation of the native WebSocket interface for testing purposes.
 */
export class MockWebSocket implements WebSocket {
  // Static Ready State Constants
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  // Instance Ready State Constants
  readonly CONNECTING = MockWebSocket.CONNECTING;
  readonly OPEN = MockWebSocket.OPEN;
  readonly CLOSING = MockWebSocket.CLOSING;
  readonly CLOSED = MockWebSocket.CLOSED;

  // WebSocket Properties
  url: string;
  readyState: number = MockWebSocket.CONNECTING;
  binaryType: BinaryType = "blob";
  bufferedAmount: number = 0;
  extensions: string = "";
  protocol: string = "";

  // Event Handlers
  onopen: ((ev: Event) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;

  // Mock Functions
  mockSend = vi.fn();
  mockClose = vi.fn();

  // Event Listener Storage
  private eventListeners: WebSocketEventListeners = {
    open: { listeners: [] },
    close: { listeners: [] },
    message: { listeners: [] },
    error: { listeners: [] },
  };

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    if (protocols) {
      this.protocol = Array.isArray(protocols)
        ? protocols.join(",")
        : protocols;
    }
  }

  /**
   * Mock implementation of the send method.
   * @param data - Data to send through the WebSocket.
   */
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    this.mockSend(data);
  }

  /**
   * Mock implementation of the close method.
   * @param code - Status code explaining why the connection is being closed.
   * @param reason - A human-readable string explaining why the connection is closing.
   */
  close(code?: number, reason?: string): void {
    this.mockClose(code, reason);
    this.readyState = MockWebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      this.mockEmitClose(code ?? 1000, reason ?? "Normal Closure");
    }, 0);
  }

  /**
   * Adds an event listener for the specified event type.
   * @param type - The event type.
   * @param listener - The event handler function.
   */
  addEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (ev: WebSocketEventMap[K]) => void,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: boolean | AddEventListenerOptions // Prefixing with underscore
  ): void {
    this.eventListeners[type].listeners.push(listener);
  }

  /**
   * Removes an event listener for the specified event type.
   * @param type - The event type.
   * @param listener - The event handler function to remove.
   */
  removeEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (ev: WebSocketEventMap[K]) => void,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: boolean | EventListenerOptions // Prefixing with underscore
  ): void {
    const listeners = this.eventListeners[type].listeners;
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Dispatches an event to all registered listeners.
   * @param event - The event to dispatch.
   * @returns True if the event was successfully dispatched.
   */
  dispatchEvent(event: Event): boolean {
    const type = event.type as keyof WebSocketEventMap;
    const listeners = this.eventListeners[type].listeners;

    listeners.forEach((listener) => {
      listener(event as WebSocketEventMap[typeof type]);
    });

    const handler = this[`on${type}`] as
      | ((ev: WebSocketEventMap[typeof type]) => void)
      | null;
    if (handler) {
      handler(event as WebSocketEventMap[typeof type]);
    }

    return true;
  }

  /**
   * Simulates the 'open' event.
   */
  mockEmitOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    const event = new Event("open");
    this.dispatchEvent(event);
  }

  /**
   * Simulates the 'message' event.
   * @param data - The data to send with the message event.
   */
  mockEmitMessage(
    data:
      | string
      | ArrayBufferLike
      | Blob
      | ArrayBufferView
      | Record<string, unknown>
  ): void {
    let messageData: any;

    if (
      typeof data === "object" &&
      data !== null &&
      "data" in data &&
      Object.keys(data).length === 1
    ) {
      messageData = (data as { data: unknown }).data;
    } else {
      messageData = data;
    }

    const event = new MessageEvent("message", { data: messageData });
    this.dispatchEvent(event);
  }

  /**
   * Simulates the 'error' event.
   * @param error - The error to emit.
   */
  mockEmitError(error: Error): void {
    const event = new ErrorEvent("error", { error });
    this.dispatchEvent(event);
  }

  /**
   * Simulates the 'close' event.
   * @param code - Status code explaining why the connection is being closed.
   * @param reason - A human-readable string explaining why the connection is closing.
   */
  mockEmitClose(code: number, reason: string): void {
    const event = new CloseEvent("close", {
      code,
      reason,
      wasClean: code === 1000,
    });
    this.dispatchEvent(event);
  }
}

/**
 * Interface extending WebSocketContext for testing purposes.
 */
export interface TestContext extends Omit<WebSocketContext, "socket"> {
  socket: MockWebSocket | null;
  options: Options;
}

/**
 * Creates a test context with default values, allowing overrides.
 * @param partial - Partial context to override default values.
 * @returns A complete TestContext object.
 */
export function createTestContext(partial?: Partial<TestContext>): TestContext {
  const defaultContext: TestContext = {
    url: "",
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
    retryCount: 0, // Added property
    backoffDelay: BASE_CONFIG.reconnectInterval,
  };

  return { ...defaultContext, ...partial };
}
