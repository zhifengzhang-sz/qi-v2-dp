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
    
    // Special case for timeout errors
    if (error.code === 'ECONNABORTED') {
      return new ApplicationError(
        error.message,
        ErrorCode.TIMEOUT_ERROR,
        HttpStatusCode.REQUEST_TIMEOUT,
        {
          url: error.config?.url,
          method: error.config?.method,
          code: error.code,
        }
      );
    }

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
 */

// Core HTTP functionality
export { HttpClient } from "./http/client.js";
export type { HttpConfig, RequestConfig } from "./http/types.js";

// Error handling and types
export type { NetworkErrorContext } from "./shared/types.js";
export {
  HttpStatusCode,
  createNetworkError,
  transformAxiosError,
  mapHttpStatusToErrorCode,
  mapWebSocketErrorToStatus,
  type HttpStatusCodeType,
} from "./errors.js";

// WebSocket types and utilities
export type { WebSocketConfig, MessageHandler } from "./websocket/types.js";
export type { ConnectionState } from "./websocket/state.js";
export {
  createWebSocketError,
  transformWebSocketError,
} from "./websocket/errors.js";

export { WebSocketClient } from "./websocket/client.js";

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

import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import { logger } from "@qi/core/logger";
import {
  createNetworkError,
  transformAxiosError,
  HttpStatusCode,
  mapHttpStatusToErrorCode,
} from "../errors.js";
import { ApplicationError } from "@qi/core/errors";
import { retryOperation } from "@qi/core/utils";
import type { HttpConfig, RequestConfig } from "./types.js";

export { HttpStatusCode, mapHttpStatusToErrorCode };
export type { HttpConfig, RequestConfig };

export class HttpClient {
  public readonly config: Required<HttpConfig>;
  private readonly client: AxiosInstance;

  constructor(config: HttpConfig = {}) {
    this.config = {
      baseURL: config.baseURL || "",
      timeout: config.timeout || 30000,
      headers: config.headers || {},
      retry: {
        limit: 3,
        delay: 1000,
        enabled: true,
        ...config.retry,
      },
      logger: config.logger || logger,
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

    // Update response interceptor setup
    this.client.interceptors.response.use(
      (response) => {
        const config = response.config as InternalAxiosRequestConfig;
        const duration = config.startTime
          ? Date.now() - config.startTime
          : undefined;

        this.config.logger.debug("HTTP Response", {
          url: config.url,
          status: response.status,
          duration,
        });
        return response;
      },
      (error: unknown) => {
        if (error instanceof AxiosError) {
          const status =
            error.response?.status || HttpStatusCode.INTERNAL_SERVER_ERROR;
          const errorCode = mapHttpStatusToErrorCode(status);

          const transformedError = new ApplicationError(
            error.message,
            errorCode,
            status,
            {
              url: error.config?.url,
              method: error.config?.method,
              code: error.code,
              response: error.response && {
                data: error.response.data,
                headers: error.response.headers,
                status: error.response.status,
              },
            }
          );

          if (error.config) {
            const config = error.config as InternalAxiosRequestConfig;
            const duration = config.startTime
              ? Date.now() - config.startTime
              : undefined;

            this.config.logger.error("HTTP Error", {
              url: config.url,
              status: error.response?.status,
              error: error.message,
              duration,
            });
          }

          throw transformedError;
        }
        throw createNetworkError(
          "Unknown error occurred",
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }
    );
  }

  private async executeRequest<T>(
    config: RequestConfig
  ): Promise<AxiosResponse<T>> {
    const requestConfig = { ...config }; // Cache config for retry logging

    try {
      if (config.retry === false) {
        return await this.client.request<T>(config);
      }

      return await retryOperation(
        async () => {
          try {
            return await this.client.request<T>(requestConfig);
          } catch (error) {
            // Don't transform here - let interceptor handle it
            throw error;
          }
        },
        {
          retries: this.config.retry.limit,
          minTimeout: this.config.retry.delay,
          onRetry: (times) => {
            // Use cached config for logging
            this.config.logger.warn("Retrying request", {
              url: requestConfig.url,
              attempt: times,
            });
          },
        }
      );
    } catch (error) {
      // Error is already transformed by interceptor
      throw error;
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

#### types.ts

```typescript
import { AxiosRequestConfig } from "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    retry?: boolean;
  }
  export interface InternalAxiosRequestConfig {
    startTime?: number;
  }
}

export interface HttpConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retry?: {
    limit: number;
    delay: number;
    enabled: boolean;
  };
  logger?: {
    warn: (message: string, ...args: unknown[]) => void;
    info: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    debug: (message: string, ...args: unknown[]) => void;
  };
}

export interface RequestConfig extends AxiosRequestConfig {
  retry?: boolean;
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

#### machine

##### actions.ts

```typescript
/**
 * @fileoverview
 * @module actions.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-14
 */

// qi/core/src/networks/websocket/machine/actions.ts

import { setup } from "xstate";
import type { WebSocketContext, WebSocketEvent } from "./types.js";
import { WebSocketStates } from "./websocket-states.js";
import { TIMING } from "./constants.js";

/**
 * All actions used in the WebSocket state machine
 */
export const actions = {
  // Connection management
  storeUrl: setup.assign<WebSocketContext, WebSocketEvent>({
    url: (_, event) => (event.type === "CONNECT" ? event.url : ""),
    protocols: (_, event) =>
      event.type === "CONNECT" ? event.protocols || [] : [],
  }),

  resetState: setup.assign<WebSocketContext, WebSocketEvent>({
    socket: () => null,
    state: (context) => ({
      ...context.state,
      connectionAttempts: 0,
      lastError: null,
    }),
  }),

  establishConnection: setup.assign<WebSocketContext, WebSocketEvent>(
    (context, event) => {
      if (event.type !== "CONNECT") return {};
      return {
        socket: new WebSocket(event.url),
      };
    }
  ),

  bindSocketEvents: setup.assign<WebSocketContext, WebSocketEvent>(
    (context) => ({})
  ),

  cleanupOnFailure: setup.assign<WebSocketContext, WebSocketEvent>(
    (context) => ({})
  ),

  resetRetries: setup.assign<WebSocketContext, WebSocketEvent>((context) => ({
    state: {
      ...context.state,
      connectionAttempts: 0,
    },
  })),

  updateConnectionState: setup.assign<WebSocketContext, WebSocketEvent>(
    (context) => ({
      status: "connected" as const,
      readyState: context.socket?.readyState || WebSocket.CLOSED,
    })
  ),

  startHeartbeat: setup.assign<WebSocketContext, WebSocketEvent>(
    (context) => ({})
  ),

  stopHeartbeat: setup.assign<WebSocketContext, WebSocketEvent>(
    (context) => ({})
  ),

  handleMessage: setup.assign<WebSocketContext, WebSocketEvent>(
    (context, event) => {
      if (event.type !== "MESSAGE") return {};
      return {
        metrics: {
          ...context.metrics,
          messagesReceived: context.metrics.messagesReceived + 1,
        },
      };
    }
  ),

  updateMetrics: setup.assign<WebSocketContext, WebSocketEvent>(
    (context) => ({})
  ),

  enqueueMessage: setup.assign<WebSocketContext, WebSocketEvent>(
    (context, event) => {
      if (event.type !== "SEND") return {};
      return {
        queue: {
          ...context.queue,
          messages: [
            ...context.queue.messages,
            {
              id: event.id || crypto.randomUUID(),
              data: event.data,
              timestamp: Date.now(),
              attempts: 0,
              priority: event.options?.priority || "normal",
            },
          ],
        },
      };
    }
  ),

  processQueue: setup.assign<WebSocketContext, WebSocketEvent>(
    (context) => ({})
  ),

  recordError: setup.assign<WebSocketContext, WebSocketEvent>(
    (context, event) => {
      if (event.type !== "ERROR") return {};
      return {
        errors: [
          ...context.errors,
          {
            timestamp: Date.now(),
            error: event.error,
          },
        ],
      };
    }
  ),

  incrementRetryCounter: setup.assign<WebSocketContext, WebSocketEvent>(
    (context) => ({
      state: {
        ...context.state,
        connectionAttempts: context.state.connectionAttempts + 1,
      },
    })
  ),

  calculateBackoff: setup.assign<WebSocketContext, WebSocketEvent>(
    (context) => ({})
  ),

  clearBackoff: setup.assign<WebSocketContext, WebSocketEvent>(
    (context) => ({})
  ),

  logClosure: setup.assign<WebSocketContext, WebSocketEvent>((context) => ({
    state: {
      ...context.state,
      lastDisconnectTime: Date.now(),
    },
  })),

  logDisconnection: setup.assign<WebSocketContext, WebSocketEvent>(
    (context) => ({
      state: {
        ...context.state,
        lastDisconnectTime: Date.now(),
      },
    })
  ),

  logMaxRetries: setup.assign<WebSocketContext, WebSocketEvent>(
    (context) => ({})
  ),

  initiateClose: setup.assign<WebSocketContext, WebSocketEvent>(
    (context) => ({})
  ),

  sendPing: setup.assign<WebSocketContext, WebSocketEvent>((context) => ({})),

  handlePong: setup.assign<WebSocketContext, WebSocketEvent>((context) => ({})),

  // New actions for rate limiting and suspension
  updateRateLimitState: setup.assign<WebSocketContext, WebSocketEvent>(
    (context) => ({
      status: "rateLimited" as const,
      messageCount: 0,
      windowStart: Date.now(),
    })
  ),

  clearRateLimitState: setup.assign<WebSocketContext, WebSocketEvent>(
    (context) => ({
      messageCount: 0,
      windowStart: Date.now(),
    })
  ),

  logSuspension: setup.assign<WebSocketContext, WebSocketEvent>((context) => ({
    status: "suspended" as const,
  })),
} as const;

```

##### constants.ts

```typescript
/**
 * @fileoverview WebSocket State Machine Constants
 * Default values and configuration constants
 */

// qi/core/src/networks/websocket/machine/constants.ts

// Default connection configuration
export const DEFAULT_CONFIG = {
  // Reconnection settings
  reconnect: true,
  maxReconnectAttempts: 5,
  reconnectInterval: 1000,
  reconnectBackoffRate: 1.5,

  // Health check settings
  pingInterval: 30000,
  pongTimeout: 5000,

  // Message handling
  messageQueueSize: 100,
  messageTimeout: 5000,

  // Rate limiting
  rateLimit: {
    messages: 100,
    window: 1000,
  },
} as const;

// WebSocket close codes
export const WS_CLOSE_CODES = {
  NORMAL_CLOSURE: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED_DATA: 1003,
  NO_STATUS: 1005,
  ABNORMAL_CLOSURE: 1006,
  INVALID_FRAME: 1007,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  MANDATORY_EXTENSION: 1010,
  INTERNAL_ERROR: 1011,
  SERVICE_RESTART: 1012,
  TRY_AGAIN_LATER: 1013,
  BAD_GATEWAY: 1014,
  TLS_HANDSHAKE: 1015,
} as const;

// Timing constants
export const TIMING = {
  MIN_RECONNECT_DELAY: 1000,
  MAX_RECONNECT_DELAY: 30000,
  CONNECTION_TIMEOUT: 30000,
  DEFAULT_PING_INTERVAL: 30000,
  DEFAULT_PONG_TIMEOUT: 5000,
  RATE_LIMIT_WINDOW: 1000,
} as const;

// Maximum values
export const LIMITS = {
  MAX_MESSAGE_SIZE: 1024 * 1024, // 1MB
  MAX_QUEUE_SIZE: 1000,
  MAX_RETRY_ATTEMPTS: 10,
  MAX_ERROR_HISTORY: 100,
  MAX_LATENCY_SAMPLES: 50,
} as const;

// Default error messages
export const ERROR_MESSAGES = {
  INVALID_URL: "Invalid WebSocket URL provided",
  CONNECTION_TIMEOUT: "Connection attempt timed out",
  MAX_RETRIES_EXCEEDED: "Maximum reconnection attempts exceeded",
  RATE_LIMIT_EXCEEDED: "Message rate limit exceeded",
  QUEUE_FULL: "Message queue is full",
  INVALID_STATE: "Invalid state transition attempted",
  PONG_TIMEOUT: "WebSocket pong response timeout",
  MESSAGE_TOO_LARGE: "Message exceeds maximum size limit",
} as const;

export const CONNECTION_STATES = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTING: "disconnecting",
  RECONNECTING: "reconnecting",
  BACKING_OFF: "backingOff",
  RATE_LIMITED: "rateLimited",
  SUSPENDED: "suspended",
} as const;
```

##### guards.ts

```typescript
/**
 * @fileoverview
 * @module guards.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-16
 */

// guards.ts

import type { WebSocketContext, WebSocketEvent } from './types.js';

export const guards = {
  canInitiateConnection: ({ context, event }: { context: WebSocketContext; event: WebSocketEvent }) => {
    if (event.type !== 'CONNECT') return false;
    
    try {
      const url = new URL(event.url);
      return (
        (url.protocol === 'ws:' || url.protocol === 'wss:') &&
        context.status === 'disconnected' &&
        !context.socket
      );
    } catch {
      return false;
    }
  },

  canReconnect: ({ context }: { context: WebSocketContext }) => {
    return (
      context.options.reconnect &&
      context.state.connectionAttempts < context.options.maxReconnectAttempts
    );
  },

  isWithinRetryLimit: ({ context }: { context: WebSocketContext }) => {
    return context.state.connectionAttempts < context.options.maxReconnectAttempts;
  },

  canSendMessage: ({ context }: { context: WebSocketContext }) => {
    return (
      context.socket?.readyState === WebSocket.OPEN &&
      !guards.isRateLimited({ context })
    );
  },

  isRateLimited: ({ context }: { context: WebSocketContext }) => {
    const now = Date.now();
    const windowEnd = context.windowStart + context.options.rateLimit.window;
    
    if (now > windowEnd) {
      context.windowStart = now;
      context.messageCount = 0;
      return false;
    }
    
    return context.messageCount >= context.options.rateLimit.messages;
  }
};
```

##### machine.ts

```typescript
/**
 * @fileoverview
 * @module machine.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-14
 */

// machine.ts

import { setup } from "xstate";
import type { WebSocketContext, WebSocketEvent, ConnectionOptions } from "./types.js";
import { guards } from "./guards.js";
import { actions } from "./actions.js";
import { states } from "./states.js";

const DEFAULT_OPTIONS: Required<ConnectionOptions> = {
  reconnect: true,
  maxReconnectAttempts: 5,
  reconnectInterval: 1000,
  pingInterval: 30000,
  pongTimeout: 5000,
  messageQueueSize: 100,
  messageTimeout: 5000,
  rateLimit: {
    messages: 100,
    window: 1000,
  },
};

/** Create immutable initial context */
const createInitialContext = (config?: Partial<ConnectionOptions>): WebSocketContext => ({
  // Connection
  url: "",
  protocols: [],
  socket: null,
  status: "disconnected",
  readyState: WebSocket.CLOSED,
  options: {
    ...DEFAULT_OPTIONS,
    ...config,
  },

  // State
  state: {
    connectionAttempts: 0,
    lastConnectTime: 0,
    lastDisconnectTime: 0,
    lastError: null,
    lastMessageTime: 0,
  },

  // Queue
  queue: {
    messages: [],
    pending: false,
    lastProcessed: 0,
  },

  // Metrics
  metrics: {
    messagesSent: 0,
    messagesReceived: 0,
    bytesReceived: 0,
    bytesSent: 0,
  },

  // Health Check
  lastPingTime: 0,
  lastPongTime: 0,
  latency: [],

  // Errors
  errors: [],

  // Rate Limiting
  messageCount: 0,
  windowStart: Date.now(),
});

export const createWebSocketMachine = (config?: Partial<ConnectionOptions>) => {
  return setup({
    types: {} as {
      context: WebSocketContext;
      events: WebSocketEvent;
    },
    guards,
    actions,
  }).createMachine({
    id: "webSocket",
    initial: "disconnected",
    context: createInitialContext(config),
    states: states
  });
};

export default createWebSocketMachine;
```

##### states.ts

```typescript
// qi/core/src/networks/websocket/machine/states.ts

import type { WebSocketContext, WebSocketEvent } from "./types.js";
import { CONNECTION_STATES } from "./constants.js";
import type { actions } from "./actions.js";

// Type for state machine configuration with proper typing
type StateConfig = {
  [K in (typeof CONNECTION_STATES)[keyof typeof CONNECTION_STATES]]: {
    entry?: Array<keyof typeof actions>;
    exit?: Array<keyof typeof actions>;
    on?: {
      [E in WebSocketEvent["type"]]?:
        | {
            target?: (typeof CONNECTION_STATES)[keyof typeof CONNECTION_STATES];
            guard?: keyof typeof import("./guards.js").guards;
            actions?: Array<keyof typeof actions>;
          }
        | Array<{
            target: (typeof CONNECTION_STATES)[keyof typeof CONNECTION_STATES];
            guard?: keyof typeof import("./guards.js").guards;
            actions?: Array<keyof typeof actions>;
          }>;
    };
  };
};

export const states: StateConfig = {
  disconnected: {
    on: {
      CONNECT: {
        target: "connecting",
        guard: "canInitiateConnection",
        actions: ["storeUrl", "resetState", "establishConnection"],
      },
    },
  },

  connecting: {
    entry: ["bindSocketEvents"],
    exit: ["cleanupOnFailure"],
    on: {
      OPEN: {
        target: "connected",
        actions: ["resetRetries", "updateConnectionState", "startHeartbeat"],
      },
      ERROR: [
        {
          target: "reconnecting",
          guard: "canReconnect",
          actions: ["recordError", "incrementRetryCounter"],
        },
        {
          target: "disconnected",
          actions: ["recordError", "resetState"],
        },
      ],
      CLOSE: {
        target: "disconnected",
        actions: ["logClosure", "resetState"],
      },
    },
  },

  connected: {
    entry: ["startHeartbeat", "processQueue"],
    exit: ["stopHeartbeat"],
    on: {
      SEND: {
        guard: "canSendMessage",
        actions: ["enqueueMessage", "processQueue"],
      },
      MESSAGE: {
        actions: ["handleMessage", "updateMetrics"],
      },
      PING: {
        actions: ["sendPing"],
      },
      PONG: {
        actions: ["handlePong"],
      },
      ERROR: [
        {
          target: "reconnecting",
          guard: "canReconnect",
          actions: ["recordError", "incrementRetryCounter"],
        },
        {
          target: "disconnected",
          actions: ["recordError", "resetState"],
        },
      ],
      DISCONNECT: {
        target: "disconnecting",
        actions: ["initiateClose"],
      },
    },
  },

  reconnecting: {
    entry: ["calculateBackoff"],
    exit: ["clearBackoff"],
    on: {
      RETRY: {
        target: "connecting",
        guard: "isWithinRetryLimit",
        actions: ["establishConnection"],
      },
      MAX_RETRIES: {
        target: "disconnected",
        actions: ["logMaxRetries", "resetState"],
      },
      CONNECT: {
        target: "connecting",
        guard: "canInitiateConnection",
        actions: ["storeUrl", "resetState", "establishConnection"],
      },
    },
  },

  disconnecting: {
    entry: ["initiateClose"],
    exit: ["resetState"],
    on: {
      CLOSE: {
        target: "disconnected",
        actions: ["logDisconnection"],
      },
    },
  },

  backingOff: {
    on: {
      RETRY: {
        target: "connecting",
        guard: "isWithinRetryLimit",
        actions: ["establishConnection"],
      },
      MAX_RETRIES: {
        target: "disconnected",
        actions: ["logMaxRetries", "resetState"],
      },
    },
  },

  rateLimited: {
    entry: ["updateRateLimitState"],
    exit: ["clearRateLimitState"],
    on: {
      RETRY: {
        target: "connected",
        guard: "isRateLimitCleared",
      },
    },
  },

  suspended: {
    entry: ["logSuspension"],
    on: {
      CONNECT: {
        target: "connecting",
        guard: "canInitiateConnection",
        actions: ["storeUrl", "resetState", "establishConnection"],
      },
    },
  },
} as const;

```

##### types.ts

```typescript
// qi/core/src/networks/websocket/machine/types.ts

import { CONNECTION_STATES, WS_CLOSE_CODES, DEFAULT_CONFIG } from "./constants.js";

// Connection States
export type ConnectionState = keyof typeof CONNECTION_STATES;

// Connection Options
export interface ConnectionOptions {
  // Reconnection settings
  reconnect: boolean;
  maxReconnectAttempts: number;
  reconnectInterval: number;
  reconnectBackoffRate: number;

  // Health check settings
  pingInterval: number;
  pongTimeout: number;

  // Message handling
  messageQueueSize: number;
  messageTimeout: number;

  // Rate limiting
  rateLimit: {
    messages: number;
    window: number;
  };
}

// Message-related types
export interface QueuedMessage {
  id: string;
  data: unknown;
  timestamp: number;
  attempts: number;
  timeout?: number;
  priority: "high" | "normal";
}

export interface ErrorRecord {
  timestamp: number;
  error: Error;
  context?: string;
}

// WebSocket Context
export interface WebSocketContext {
  // Connection
  url: string;
  protocols: string[];
  socket: WebSocket | null;
  status: ConnectionState;
  readyState: number;
  options: Required<ConnectionOptions>;

  // State tracking
  state: {
    connectionAttempts: number;
    lastConnectTime: number;
    lastDisconnectTime: number;
    lastError: Error | null;
    lastMessageTime: number;
  };

  // Message Queue
  queue: {
    messages: QueuedMessage[];
    pending: boolean;
    lastProcessed: number;
  };

  // Metrics
  metrics: {
    messagesSent: number;
    messagesReceived: number;
    bytesReceived: number;
    bytesSent: number;
  };

  // Health Check
  lastPingTime: number;
  lastPongTime: number;
  latency: number[];

  // Error tracking
  errors: ErrorRecord[];

  // Rate Limiting
  messageCount: number;
  windowStart: number;
}

// Event Types
export type WebSocketEvent =
  | {
      type: "CONNECT";
      url: string;
      protocols?: string[];
      options?: Partial<ConnectionOptions>;
      timestamp: number;
    }
  | { type: "DISCONNECT"; code?: number; reason?: string; timestamp: number }
  | { type: "OPEN"; event: Event; timestamp: number }
  | {
      type: "CLOSE";
      code: (typeof WS_CLOSE_CODES)[keyof typeof WS_CLOSE_CODES];
      reason: string;
      wasClean: boolean;
      timestamp: number;
    }
  | { type: "ERROR"; error: Error; timestamp: number; attempt?: number }
  | { type: "MESSAGE"; data: unknown; timestamp: number; id?: string }
  | {
      type: "SEND";
      data: unknown;
      id?: string;
      timestamp: number;
      options?: { priority: "high" | "normal" };
    }
  | { type: "RETRY"; attempt: number; delay: number; timestamp: number }
  | {
      type: "MAX_RETRIES";
      attempts: number;
      lastError?: Error;
      timestamp: number;
    }
  | { type: "PING"; timestamp: number }
  | { type: "PONG"; latency: number; timestamp: number };

// Default configuration type assert
export type DefaultConfig = typeof DEFAULT_CONFIG;

```

##### websocket-state.ts

```typescript
// qi/core/src/networks/websocket/machine/websocket-states.ts

export type WebSocketReadyState = 0 | 1 | 2 | 3;

export const WebSocketStates = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const;

export const isWebSocketOpen = (readyState: number): boolean =>
  readyState === WebSocketStates.OPEN;

export default WebSocketStates;
```

##### websocket-states.ts

```typescript
export type WebSocketReadyState = 0 | 1 | 2 | 3;

export const WebSocketStates = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const;

export const isWebSocketOpen = (readyState: number): boolean =>
  readyState === WebSocketStates.OPEN;

export default WebSocketStates;

```

