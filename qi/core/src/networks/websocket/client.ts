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
