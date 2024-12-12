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
