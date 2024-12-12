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
