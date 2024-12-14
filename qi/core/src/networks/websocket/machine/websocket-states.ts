/**
 * @fileoverview
 * @module websocket-states.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-14
 */

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
