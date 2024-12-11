/**
 * @fileoverview
 * @module client.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-11
 * @modified 2024-12-11
 */

import WebSocket from "ws";
import { EventEmitter } from "events";
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { logger } from "@qi/core/logger";

export interface WebSocketConfig {
  pingInterval?: number;
  pongTimeout?: number;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface MessageHandler {
  (data: unknown): void | Promise<void>;
}

export class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private readonly config: Required<WebSocketConfig>;
  private reconnectAttempts = 0;
  private pingTimer?: NodeJS.Timeout;
  private pongTimer?: NodeJS.Timeout;
  private readonly subscriptions = new Map<string, Set<MessageHandler>>();

  constructor(config: WebSocketConfig = {}) {
    super();
    this.config = {
      pingInterval: config.pingInterval || 30000,
      pongTimeout: config.pongTimeout || 5000,
      reconnect: config.reconnect ?? true,
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 5,
    };
  }

  async connect(url: string): Promise<void> {
    if (this.ws) {
      throw new ApplicationError(
        "WebSocket already connected",
        ErrorCode.WEBSOCKET_ERROR,
        500
      );
    }

    try {
      await this.establishConnection(url);
      this.setupHeartbeat();
      logger.info("WebSocket connected", { url });
    } catch (error) {
      throw new ApplicationError(
        "WebSocket connection failed",
        ErrorCode.WEBSOCKET_ERROR,
        500,
        { error: String(error) }
      );
    }
  }

  private async establishConnection(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);

      this.ws.on("open", () => {
        this.reconnectAttempts = 0;
        this.emit("connected");
        resolve();
      });

      this.ws.on("message", (data: WebSocket.Data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.channel && this.subscriptions.has(parsed.channel)) {
            const handlers = this.subscriptions.get(parsed.channel)!;
            handlers.forEach((handler) => {
              try {
                handler(parsed.data);
              } catch (error) {
                logger.error("Message handler error", {
                  error,
                  channel: parsed.channel,
                });
              }
            });
          }
          this.emit("message", parsed);
        } catch (error) {
          logger.error("WebSocket message parse error", { error, data });
        }
      });

      this.ws.on("close", () => {
        this.cleanup();
        this.emit("disconnected");
        if (
          this.config.reconnect &&
          this.reconnectAttempts < this.config.maxReconnectAttempts
        ) {
          this.reconnectAttempts++;
          setTimeout(() => {
            logger.info("Attempting WebSocket reconnection", {
              attempt: this.reconnectAttempts,
              maxAttempts: this.config.maxReconnectAttempts,
            });
            this.connect(url).catch((error) => {
              logger.error("WebSocket reconnection failed", { error });
            });
          }, this.config.reconnectInterval);
        }
      });

      this.ws.on("error", (error) => {
        logger.error("WebSocket error", { error });
        this.emit("error", error);
        reject(error);
      });

      this.ws.on("pong", () => {
        this.clearPongTimer();
      });
    });
  }

  private setupHeartbeat(): void {
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.ping();
        this.setPongTimer();
      }
    }, this.config.pingInterval);
  }

  private setPongTimer(): void {
    this.pongTimer = setTimeout(() => {
      logger.warn("WebSocket pong timeout");
      this.ws?.terminate();
    }, this.config.pongTimeout);
  }

  private clearPongTimer(): void {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = undefined;
    }
  }

  private cleanup(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = undefined;
    }
    this.clearPongTimer();
    this.ws = null;
  }

  subscribe(channel: string, handler: MessageHandler): void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel)!.add(handler);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: "subscribe", channel }).catch((error) => {
        logger.error("Subscription request failed", { error, channel });
      });
    }
  }

  unsubscribe(channel: string, handler?: MessageHandler): void {
    if (!this.subscriptions.has(channel)) return;

    const handlers = this.subscriptions.get(channel)!;
    if (handler) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscriptions.delete(channel);
      }
    } else {
      this.subscriptions.delete(channel);
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: "unsubscribe", channel }).catch((error) => {
        logger.error("Unsubscription request failed", { error, channel });
      });
    }
  }

  async send(data: unknown): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new ApplicationError(
        "WebSocket not connected",
        ErrorCode.WEBSOCKET_ERROR,
        500
      );
    }

    return new Promise((resolve, reject) => {
      this.ws!.send(JSON.stringify(data), (error) => {
        if (error) {
          reject(
            new ApplicationError(
              "WebSocket send failed",
              ErrorCode.WEBSOCKET_ERROR,
              500,
              { error: String(error) }
            )
          );
        } else {
          resolve();
        }
      });
    });
  }

  async close(): Promise<void> {
    if (this.ws) {
      this.config.reconnect = false;
      this.ws.close();
      this.cleanup();
      this.subscriptions.clear();
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
