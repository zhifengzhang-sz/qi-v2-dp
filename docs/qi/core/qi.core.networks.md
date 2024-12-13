# Project Source Code Documentation

## networks

### errors.ts

```typescript
/**
 * @fileoverview Network Error Handling Module
 * @module @qi/core/networks/errors
 *
 * @description
 * Provides network-specific error handling, including HTTP and WebSocket errors.
 * Integrates with the core error system while providing network-specific functionality.
 *
 * @author zhifengzhang-sz
 * @created 2024-12-12
 * @modified 2024-12-12
 */

import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { AxiosError, HttpStatusCode as AxiosHttpStatusCode } from "axios";

/**
 * Network error context interface
 */
export interface NetworkErrorContext {
  url?: string;
  readyState?: number;
  expected?: number;
  currentState?: string;
  data?: unknown;
  method?: string;
  statusCode?: number;
  [key: string]: unknown;
}

/**
 * HTTP Status Codes
 */
export const HttpStatusCode = {
  // 2xx Success
  OK: AxiosHttpStatusCode.Ok,
  CREATED: AxiosHttpStatusCode.Created,
  ACCEPTED: AxiosHttpStatusCode.Accepted,
  NO_CONTENT: AxiosHttpStatusCode.NoContent,

  // 3xx Redirection
  MOVED_PERMANENTLY: AxiosHttpStatusCode.MovedPermanently,
  FOUND: AxiosHttpStatusCode.Found,
  NOT_MODIFIED: AxiosHttpStatusCode.NotModified,
  TEMPORARY_REDIRECT: AxiosHttpStatusCode.TemporaryRedirect,

  // 4xx Client Errors
  BAD_REQUEST: AxiosHttpStatusCode.BadRequest,
  UNAUTHORIZED: AxiosHttpStatusCode.Unauthorized,
  FORBIDDEN: AxiosHttpStatusCode.Forbidden,
  NOT_FOUND: AxiosHttpStatusCode.NotFound,
  REQUEST_TIMEOUT: AxiosHttpStatusCode.RequestTimeout,
  METHOD_NOT_ALLOWED: AxiosHttpStatusCode.MethodNotAllowed,
  CONFLICT: AxiosHttpStatusCode.Conflict,
  UNPROCESSABLE_ENTITY: AxiosHttpStatusCode.UnprocessableEntity,
  TOO_MANY_REQUESTS: AxiosHttpStatusCode.TooManyRequests,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: AxiosHttpStatusCode.InternalServerError,
  NOT_IMPLEMENTED: AxiosHttpStatusCode.NotImplemented,
  BAD_GATEWAY: AxiosHttpStatusCode.BadGateway,
  SERVICE_UNAVAILABLE: AxiosHttpStatusCode.ServiceUnavailable,
  GATEWAY_TIMEOUT: AxiosHttpStatusCode.GatewayTimeout,

  // WebSocket Status Codes
  WEBSOCKET_NORMAL_CLOSURE: 1000,
  WEBSOCKET_GOING_AWAY: 1001,
  WEBSOCKET_PROTOCOL_ERROR: 1002,
  WEBSOCKET_UNSUPPORTED_DATA: 1003,
  WEBSOCKET_INVALID_FRAME: 1007,
  WEBSOCKET_POLICY_VIOLATION: 1008,
  WEBSOCKET_MESSAGE_TOO_BIG: 1009,
  WEBSOCKET_INTERNAL_ERROR: 1011,
} as const;

export type HttpStatusCodeType =
  (typeof HttpStatusCode)[keyof typeof HttpStatusCode];

/**
 * Maps HTTP status codes to appropriate application error codes
 */
export function mapHttpStatusToErrorCode(
  status: HttpStatusCodeType
): ErrorCode {
  switch (status) {
    case HttpStatusCode.UNAUTHORIZED:
    case HttpStatusCode.FORBIDDEN:
      return ErrorCode.AUTH_ERROR;
    case HttpStatusCode.NOT_FOUND:
      return ErrorCode.NOT_FOUND_ERROR;
    case HttpStatusCode.TOO_MANY_REQUESTS:
      return ErrorCode.RATE_LIMIT_ERROR;
    case HttpStatusCode.BAD_REQUEST:
    case HttpStatusCode.UNPROCESSABLE_ENTITY:
      return ErrorCode.VALIDATION_ERROR;
    case HttpStatusCode.GATEWAY_TIMEOUT:
    case HttpStatusCode.REQUEST_TIMEOUT:
      return ErrorCode.TIMEOUT_ERROR;
    case HttpStatusCode.SERVICE_UNAVAILABLE:
      return ErrorCode.SERVICE_ERROR;
    default:
      if (status >= HttpStatusCode.INTERNAL_SERVER_ERROR) {
        return ErrorCode.NETWORK_ERROR;
      }
      return ErrorCode.OPERATION_ERROR;
  }
}

/**
 * Creates a network-specific application error
 */
export function createNetworkError(
  message: string,
  statusCode: HttpStatusCodeType = HttpStatusCode.INTERNAL_SERVER_ERROR,
  context?: NetworkErrorContext
): ApplicationError {
  const errorCode = mapHttpStatusToErrorCode(statusCode);
  return new ApplicationError(message, errorCode, statusCode, context);
}

/**
 * Maps WebSocket errors to appropriate HTTP status codes
 */
export function mapWebSocketErrorToStatus(error: unknown): HttpStatusCodeType {
  if (error instanceof Error) {
    switch (error.message) {
      case "ETIMEDOUT":
        return HttpStatusCode.GATEWAY_TIMEOUT;
      case "ECONNREFUSED":
        return HttpStatusCode.SERVICE_UNAVAILABLE;
      case "ECONNRESET":
        return HttpStatusCode.BAD_GATEWAY;
      case "EPROTO":
        return HttpStatusCode.WEBSOCKET_PROTOCOL_ERROR;
      case "EMSGSIZE":
        return HttpStatusCode.WEBSOCKET_MESSAGE_TOO_BIG;
      default:
        return HttpStatusCode.INTERNAL_SERVER_ERROR;
    }
  }
  return HttpStatusCode.INTERNAL_SERVER_ERROR;
}

/**
 * Transforms Axios errors into application errors
 */
export function transformAxiosError(error: unknown): ApplicationError {
  if (error instanceof AxiosError) {
    const status =
      error.response?.status || HttpStatusCode.INTERNAL_SERVER_ERROR;
    return createNetworkError(error.message, status, {
      url: error.config?.url,
      method: error.config?.method,
      code: error.code,
      response: error.response && {
        data: error.response.data,
        headers: error.response.headers,
        status: error.response.status,
      },
    });
  }

  return createNetworkError(
    error instanceof Error ? error.message : "Unknown network error",
    HttpStatusCode.INTERNAL_SERVER_ERROR,
    {
      error: error instanceof Error ? error.stack : String(error),
    }
  );
}

```

### index.ts

```typescript
/**
 * @fileoverview Network Module Entry Point
 * @module @qi/core/networks
 *
 * @description
 * Exports all network-related functionality including HTTP and WebSocket clients,
 * error handling utilities, and all necessary types and interfaces for external use.
 *
 * @author zhifengzhang-sz
 * @created 2024-12-11
 * @modified 2024-12-12
 */

// Core error types and utilities
export type { NetworkErrorContext, HttpStatusCodeType } from "./errors.js";
export {
  HttpStatusCode,
  mapHttpStatusToErrorCode,
  createNetworkError,
  transformAxiosError,
} from "./errors.js";

// WebSocket types and utilities
export type { WebSocketConfig, MessageHandler } from "./websocket/types.js";
export type { ConnectionState } from "./websocket/state.js";
export {
  createWebSocketError,
  transformWebSocketError,
} from "./websocket/errors.js";

// HTTP types
export type { HttpConfig, RequestConfig } from "./http/client.js";

// Client implementations
export { HttpClient } from "./http/client.js";
export { WebSocketClient } from "./websocket/client.js";

// Re-export default config
export { defaultConfig as defaultWebSocketConfig } from "./websocket/types.js";

```

### http

#### client.ts

```typescript
/**
 * @fileoverview
 * @module client.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-10
 * @modified 2024-12-12
 */

/**
 * @fileoverview HTTP Client Implementation
 * @module @qi/core/networks/http/client
 */

import { logger } from "@qi/core/logger";
import { retryOperation } from "@qi/core/utils";
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { transformAxiosError } from "../errors.js";

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    startTime?: number;
  }
}

export interface HttpConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
}

export interface RequestConfig extends AxiosRequestConfig {
  retry?: boolean;
}

export class HttpClient {
  private readonly client: AxiosInstance;
  private readonly config: Required<HttpConfig>;

  constructor(config: HttpConfig = {}) {
    this.config = {
      baseURL: config.baseURL || "",
      timeout: config.timeout || 30000,
      headers: config.headers || {},
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: this.config.headers,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for timing
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        config.startTime = Date.now();
        return config;
      }
    );

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        const duration = response.config.startTime
          ? Date.now() - response.config.startTime
          : undefined;

        logger.debug("HTTP Response", {
          url: response.config.url,
          status: response.status,
          duration,
        });
        return response;
      },
      (error) => {
        const duration = error.config?.startTime
          ? Date.now() - error.config.startTime
          : undefined;

        logger.error("HTTP Error", {
          url: error.config?.url,
          status: error.response?.status,
          error: error.message,
          duration,
        });

        throw transformAxiosError(error);
      }
    );
  }

  private async executeRequest<T>(
    config: RequestConfig
  ): Promise<AxiosResponse<T>> {
    try {
      if (config.retry === false) {
        return await this.client.request<T>(config);
      }

      return await retryOperation(() => this.client.request<T>(config), {
        retries: this.config.retries,
        minTimeout: this.config.retryDelay,
        onRetry: (times) => {
          logger.warn("Retrying HTTP request", {
            url: config.url,
            attempt: times,
          });
        },
      });
    } catch (error) {
      throw transformAxiosError(error);
    }
  }

  async get<T>(url: string, config: RequestConfig = {}): Promise<T> {
    const response = await this.executeRequest<T>({
      ...config,
      method: "GET",
      url,
    });
    return response.data;
  }

  async post<T>(
    url: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<T> {
    const response = await this.executeRequest<T>({
      ...config,
      method: "POST",
      url,
      data,
    });
    return response.data;
  }

  async put<T>(
    url: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<T> {
    const response = await this.executeRequest<T>({
      ...config,
      method: "PUT",
      url,
      data,
    });
    return response.data;
  }

  async delete<T>(url: string, config: RequestConfig = {}): Promise<T> {
    const response = await this.executeRequest<T>({
      ...config,
      method: "DELETE",
      url,
    });
    return response.data;
  }
}

```

### shared

#### types.ts

```typescript
/**
 * @fileoverview
 * @module types.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-12
 * @modified 2024-12-12
 */

/**
 * Shared types for network operations
 */
export interface NetworkErrorContext {
  url?: string;
  readyState?: number;
  expected?: number;
  currentState?: string;
  data?: unknown;
  method?: string;
  statusCode?: number;
  [key: string]: unknown;
}

```

### websocket

#### client.ts

```typescript
/**
 * @fileoverview WebSocket Client Implementation
 * @module @qi/core/networks/websocket/client
 *
 * @created 2024-12-11
 */

import WebSocket from "ws";
import { EventEmitter } from "events";
import { logger } from "@qi/core/logger";
import { ConnectionState, ConnectionStateManager } from "./state.js";
import { HeartbeatManager } from "./heartbeat.js";
import { SubscriptionManager } from "./subscription.js";
import { createWebSocketError, transformWebSocketError } from "./errors.js";
import { defaultConfig, WebSocketConfig, MessageHandler } from "./types.js";

interface Events {
  connecting: () => void;
  connected: () => void;
  disconnecting: () => void;
  disconnected: () => void;
  reconnecting: (attempt: number, maxAttempts: number) => void;
  message: (data: unknown) => void;
  error: (error: Error) => void;
  stateChange: (state: ConnectionState) => void;
}

export class WebSocketClient extends EventEmitter {
  public emit<K extends keyof Events>(
    event: K,
    ...args: Parameters<Events[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  public on<K extends keyof Events>(event: K, listener: Events[K]): this {
    return super.on(event, listener);
  }

  public once<K extends keyof Events>(event: K, listener: Events[K]): this {
    return super.once(event, listener);
  }

  private ws: WebSocket | null = null;
  private readonly config: Required<WebSocketConfig>;
  private readonly stateManager: ConnectionStateManager;
  private readonly subscriptionManager: SubscriptionManager;
  private heartbeatManager?: HeartbeatManager;
  private reconnectAttempts = 0;

  constructor(config: WebSocketConfig = {}) {
    super();
    this.config = { ...defaultConfig, ...config };
    this.stateManager = new ConnectionStateManager();
    this.subscriptionManager = new SubscriptionManager();

    this.stateManager.on("stateChange", (state) => {
      this.emit("stateChange", state);
      if (state === "connected") {
        this.setupHeartbeat();
        this.reconnectAttempts = 0;
      } else if (state === "disconnected") {
        this.handleDisconnect();
      }
    });
  }

  public getConfig(): Readonly<Required<WebSocketConfig>> {
    return { ...this.config };
  }

  private setupHeartbeat(): void {
    if (!this.ws) return;

    this.heartbeatManager = new HeartbeatManager(this.ws, this.config, () =>
      this.handlePongTimeout()
    );
    this.heartbeatManager.start();
  }

  private handlePongTimeout(): void {
    logger.warn("WebSocket pong timeout");
    this.ws?.terminate();
  }

  private async handleDisconnect(): Promise<void> {
    this.cleanup();
    this.emit("disconnected");

    if (
      this.config.reconnect &&
      this.reconnectAttempts < this.config.maxReconnectAttempts &&
      this.stateManager.getUrl()
    ) {
      this.reconnectAttempts++;
      this.emit(
        "reconnecting",
        this.reconnectAttempts,
        this.config.maxReconnectAttempts
      );

      await new Promise((resolve) =>
        setTimeout(resolve, this.config.reconnectInterval)
      );

      logger.info("Attempting WebSocket reconnection", {
        attempt: this.reconnectAttempts,
        maxAttempts: this.config.maxReconnectAttempts,
      });

      try {
        await this.connect(this.stateManager.getUrl()!);
      } catch (error) {
        logger.error("WebSocket reconnection failed", { error });
      }
    }
  }

  private cleanup(): void {
    this.heartbeatManager?.stop();
    this.ws?.removeAllListeners();
    this.ws = null;
  }

  async connect(url: string): Promise<void> {
    if (!this.stateManager.transition("connecting")) {
      throw createWebSocketError("Invalid connection state", {
        currentState: this.stateManager.getState(),
        url,
      });
    }

    this.emit("connecting");
    this.stateManager.setUrl(url);

    try {
      await this.establishConnection(url);
      this.stateManager.transition("connected");
      this.emit("connected");
      logger.info("WebSocket connected", { url });
    } catch (error) {
      this.stateManager.transition("disconnected");
      throw transformWebSocketError(error, { url });
    }
  }

  private async establishConnection(url: string): Promise<void> {
    return Promise.race([
      this.createConnection(url),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Connection timeout")),
          this.config.connectionTimeout
        )
      ),
    ]);
  }

  private async createConnection(url: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        const errorHandler = (error: Error) => {
          this.ws?.removeListener("error", errorHandler);
          reject(error);
        };

        this.ws.once("error", errorHandler);
        this.ws.once("open", () => {
          this.ws?.removeListener("error", errorHandler);
          this.setupEventHandlers();
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.on("message", (data: WebSocket.Data) => {
      try {
        const parsed = JSON.parse(data.toString());
        this.subscriptionManager.handleMessage(parsed);
        this.emit("message", parsed);
      } catch (error) {
        logger.error("WebSocket message parse error", { error, data });
      }
    });

    this.ws.on("error", (error) => {
      logger.error("WebSocket error", { error });
      this.emit("error", error);
    });

    this.ws.on("pong", () => {
      this.heartbeatManager?.handlePong();
    });
  }

  async send(data: unknown): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw createWebSocketError("WebSocket not connected", {
        readyState: this.ws?.readyState,
        expected: WebSocket.OPEN,
      });
    }

    return new Promise((resolve, reject) => {
      this.ws!.send(JSON.stringify(data), (error) => {
        if (error) {
          reject(
            transformWebSocketError(error, {
              data: typeof data === "object" ? { ...data } : data,
            })
          );
        } else {
          resolve();
        }
      });
    });
  }

  subscribe(channel: string, handler: MessageHandler): void {
    this.subscriptionManager.subscribe(channel, handler);

    if (this.isConnected()) {
      this.send({ type: "subscribe", channel }).catch((error) => {
        logger.error("Subscription request failed", { error, channel });
      });
    }
  }

  unsubscribe(channel: string, handler?: MessageHandler): void {
    this.subscriptionManager.unsubscribe(channel, handler);

    if (this.isConnected()) {
      this.send({ type: "unsubscribe", channel }).catch((error) => {
        logger.error("Unsubscription request failed", { error, channel });
      });
    }
  }

  async close(): Promise<void> {
    if (!this.ws) return;

    this.stateManager.transition("disconnecting");
    this.emit("disconnecting");
    this.config.reconnect = false;
    this.ws.close();
    this.cleanup();
    this.subscriptionManager.clear();
    this.stateManager.transition("disconnected");
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getState(): ConnectionState {
    return this.stateManager.getState();
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
}

```

#### errors.ts

```typescript
/**
 * @fileoverview
 * @module errors.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-12
 * @modified 2024-12-12
 */

// websocket/errors.ts
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import {
  HttpStatusCode,
  NetworkErrorContext,
  mapWebSocketErrorToStatus,
} from "../errors.js";

/**
 * Creates a WebSocket specific error with additional context
 */
export function createWebSocketError(
  message: string,
  context?: NetworkErrorContext
): ApplicationError {
  return new ApplicationError(
    message,
    ErrorCode.WEBSOCKET_ERROR,
    HttpStatusCode.SERVICE_UNAVAILABLE,
    context
  );
}

/**
 * Transforms WebSocket errors into application errors
 */
export function transformWebSocketError(
  error: unknown,
  context?: NetworkErrorContext
): ApplicationError {
  const status = mapWebSocketErrorToStatus(error);
  const errorCode =
    status === HttpStatusCode.GATEWAY_TIMEOUT
      ? ErrorCode.TIMEOUT_ERROR
      : ErrorCode.WEBSOCKET_ERROR;

  return new ApplicationError("WebSocket operation failed", errorCode, status, {
    ...context,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}

```

#### heartbeat.ts

```typescript
/**
 * @fileoverview
 * @module heartbeat.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-12
 * @modified 2024-12-12
 */

// websocket/heartbeat.ts
import WebSocket from "ws";
import { WebSocketConfig } from "./types.js";

export class HeartbeatManager {
  private pingTimer?: NodeJS.Timeout;
  private pongTimer?: NodeJS.Timeout;

  constructor(
    private readonly ws: WebSocket,
    private readonly config: Required<WebSocketConfig>,
    private readonly onPongTimeout: () => void
  ) {}

  start(): void {
    this.stop();
    this.pingTimer = setInterval(() => this.ping(), this.config.pingInterval);
  }

  stop(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    if (this.pongTimer) clearTimeout(this.pongTimer);
    this.pingTimer = undefined;
    this.pongTimer = undefined;
  }

  handlePong(): void {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = undefined;
    }
  }

  private ping(): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.ping();
      this.pongTimer = setTimeout(this.onPongTimeout, this.config.pongTimeout);
    }
  }
}

```

#### state.ts

```typescript
/**
 * @fileoverview
 * @module state.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-12
 * @modified 2024-12-12
 */

import EventEmitter from "events";

// websocket/state.ts
export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "disconnecting";

export class ConnectionStateManager extends EventEmitter {
  private state: ConnectionState = "disconnected";
  private url: string | null = null;

  private readonly validTransitions: Record<
    ConnectionState,
    ConnectionState[]
  > = {
    disconnected: ["connecting"],
    connecting: ["connected", "disconnected"],
    connected: ["disconnecting", "disconnected"],
    disconnecting: ["disconnected"],
  };

  getState(): ConnectionState {
    return this.state;
  }

  getUrl(): string | null {
    return this.url;
  }

  setUrl(url: string | null): void {
    this.url = url;
  }

  transition(newState: ConnectionState): boolean {
    if (!this.canTransitionTo(newState)) {
      return false;
    }
    this.state = newState;
    this.emit("stateChange", newState);
    return true;
  }

  private canTransitionTo(newState: ConnectionState): boolean {
    return this.validTransitions[this.state].includes(newState);
  }
}

```

#### subscription.ts

```typescript
/**
 * @fileoverview
 * @module subscription.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-12
 * @modified 2024-12-12
 */

// websocket/subscription.ts
import { MessageHandler } from "./types.js";
import { logger } from "@qi/core/logger";

interface WebSocketMessage {
  channel: string;
  data: unknown;
}

export class SubscriptionManager {
  private subscriptions = new Map<string, Set<MessageHandler>>();

  subscribe(channel: string, handler: MessageHandler): void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel)!.add(handler);
  }

  unsubscribe(channel: string, handler?: MessageHandler): void {
    if (!this.subscriptions.has(channel)) return;

    const handlers = this.subscriptions.get(channel)!;
    if (handler) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscriptions.delete(channel);
      }
    }
  }

  handleMessage(message: WebSocketMessage): void {
    if (message.channel && this.subscriptions.has(message.channel)) {
      const handlers = this.subscriptions.get(message.channel)!;
      handlers.forEach((handler) => {
        try {
          handler(message.data);
        } catch (error) {
          logger.error("Message handler error", {
            error,
            channel: message.channel,
          });
        }
      });
    }
  }

  clear(): void {
    this.subscriptions.clear();
  }
}

```

#### types.ts

```typescript
/**
 * @fileoverview WebSocket Types and Defaults
 * @module @qi/core/networks/websocket/types
 */

export interface WebSocketConfig {
  /** Interval in ms between ping messages */
  pingInterval?: number;
  /** Timeout in ms to wait for pong response */
  pongTimeout?: number;
  /** Whether to attempt reconnection on disconnect */
  reconnect?: boolean;
  /** Interval in ms between reconnection attempts */
  reconnectInterval?: number;
  /** Maximum number of reconnection attempts */
  maxReconnectAttempts?: number;
  /** Timeout in ms for initial connection attempt */
  connectionTimeout?: number;
}

export interface MessageHandler {
  (data: unknown): void | Promise<void>;
}

export const defaultConfig: Required<WebSocketConfig> = {
  pingInterval: 30000,
  pongTimeout: 5000,
  reconnect: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  connectionTimeout: 30000,
};

```

