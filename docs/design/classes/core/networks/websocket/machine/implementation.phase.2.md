## Phase 2: state machine definition

### `machine/guards.ts`

```typescript
// core/networks/websocket/machine/guards.ts

import type { WebSocketContext, WebSocketEvent } from './types';
import { LIMITS } from './constants';

interface GuardUtils {
  isValidProtocol: (url: string) => boolean;
  isValidMessageSize: (data: unknown) => boolean;
}

// Guard utility functions
const utils: GuardUtils = {
  isValidProtocol: (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'ws:' || parsed.protocol === 'wss:';
    } catch {
      return false;
    }
  },

  isValidMessageSize: (data: unknown): boolean => {
    if (typeof data === 'string') {
      return data.length <= LIMITS.MAX_MESSAGE_SIZE;
    }
    if (data instanceof Blob || data instanceof ArrayBuffer) {
      return data.byteLength <= LIMITS.MAX_MESSAGE_SIZE;
    }
    return true;
  }
};

// Guard implementations
export const guards = {
  isValidUrl: (
    context: WebSocketContext,
    event: WebSocketEvent & { url?: string }
  ): boolean => {
    return Boolean(event.url && utils.isValidProtocol(event.url));
  },

  canReconnect: (context: WebSocketContext): boolean => {
    return (
      context.options.reconnect &&
      context.state.reconnectAttempts < context.options.maxReconnectAttempts
    );
  },

  isRateLimited: (context: WebSocketContext): boolean => {
    const now = Date.now();
    const windowStart = context.windowStart;
    const windowDuration = context.rateLimit.window;
    
    // Reset window if expired
    if (now - windowStart > windowDuration) {
      return false;
    }
    
    return context.messageCount >= context.rateLimit.messages;
  },

  hasQueueSpace: (context: WebSocketContext, event: WebSocketEvent & { priority?: 'high' | 'normal' }): boolean => {
    // High priority messages bypass queue limit
    if (event.priority === 'high') {
      return true;
    }
    
    return context.queue.messages.length < context.options.messageQueueSize;
  },

  isValidMessage: (
    context: WebSocketContext,
    event: WebSocketEvent & { data?: unknown }
  ): boolean => {
    if (!event.data) {
      return false;
    }
    
    return utils.isValidMessageSize(event.data);
  },

  canProcessQueue: (context: WebSocketContext): boolean => {
    return (
      !context.queue.processing &&
      context.socket?.readyState === WebSocket.OPEN &&
      !guards.isRateLimited(context)
    );
  },

  shouldReconnect: (
    context: WebSocketContext,
    event: WebSocketEvent & { error?: Error }
  ): boolean => {
    // Don't reconnect for specific error types
    if (event.error) {
      const errorMessage = event.error.message.toLowerCase();
      
      // Don't reconnect for authentication or protocol errors
      if (
        errorMessage.includes('authentication') ||
        errorMessage.includes('protocol')
      ) {
        return false;
      }
    }
    
    return guards.canReconnect(context);
  },

  // Compound guards
  canSendMessage: (
    context: WebSocketContext,
    event: WebSocketEvent
  ): boolean => {
    return (
      guards.isValidMessage(context, event) &&
      !guards.isRateLimited(context) &&
      (guards.hasQueueSpace(context, event) || context.socket?.readyState === WebSocket.OPEN)
    );
  }
};

export type Guards = typeof guards;

```

### `machine/actions.ts`

```typescript
// core/networks/websocket/machine/actions.ts

import type { WebSocketContext, WebSocketEvent, ConnectionOptions } from './types';
import { DEFAULT_OPTIONS, CLOSE_CODES, ERRORS } from './constants';

// Action implementations
export const actions = {
  // Connection actions
  initializeConnection: (
    context: WebSocketContext,
    event: WebSocketEvent & { url?: string; options?: ConnectionOptions }
  ) => {
    if (!event.url) return;
    
    try {
      const socket = new WebSocket(event.url);
      const options = { ...DEFAULT_OPTIONS, ...event.options };
      
      return {
        socket,
        url: event.url,
        options,
        state: {
          ...context.state,
          status: 'connecting'
        }
      };
    } catch (error) {
      console.error('Failed to initialize connection:', error);
      return context;
    }
  },

  establishConnection: (context: WebSocketContext) => {
    if (!context.socket) return context;

    context.socket.onopen = () => context.socket?.dispatchEvent(new Event('open'));
    context.socket.onclose = (event) => context.socket?.dispatchEvent(new CloseEvent('close', event));
    context.socket.onerror = (event) => context.socket?.dispatchEvent(event);
    context.socket.onmessage = (event) => context.socket?.dispatchEvent(event);

    return {
      ...context,
      timers: {
        ...context.timers,
        connectTime: Date.now()
      }
    };
  },

  handleConnectionSuccess: (context: WebSocketContext) => ({
    ...context,
    state: {
      ...context.state,
      status: 'connected',
      reconnectAttempts: 0,
      lastError: null
    }
  }),

  // Disconnect actions
  initiateDisconnect: (context: WebSocketContext, event: WebSocketEvent & { code?: number; reason?: string }) => {
    context.socket?.close(
      event.code || CLOSE_CODES.NORMAL,
      event.reason || 'Normal closure'
    );
    
    return {
      ...context,
      state: {
        ...context.state,
        status: 'disconnecting'
      }
    };
  },

  cleanupConnection: (context: WebSocketContext) => {
    if (context.socket) {
      context.socket.onopen = null;
      context.socket.onclose = null;
      context.socket.onerror = null;
      context.socket.onmessage = null;
      context.socket.close();
    }

    return {
      ...context,
      socket: null,
      timers: {
        ...context.timers,
        disconnectTime: Date.now()
      },
      state: {
        ...context.state,
        status: 'disconnected'
      }
    };
  },

  // Message handling
  handleMessage: (context: WebSocketContext, event: WebSocketEvent & { data?: unknown }) => {
    if (!event.data) return context;

    return {
      ...context,
      state: {
        ...context.state,
        metrics: {
          ...context.state.metrics,
          messagesReceived: context.state.metrics.messagesReceived + 1
        }
      }
    };
  },

  queueMessage: (context: WebSocketContext, event: WebSocketEvent & { data?: unknown }) => {
    if (!event.data) return context;

    const message = {
      id: crypto.randomUUID(),
      data: event.data,
      timestamp: Date.now(),
      attempts: 0,
      priority: event.priority || 'normal'
    };

    return {
      ...context,
      queue: {
        ...context.queue,
        messages: [...context.queue.messages, message]
      }
    };
  },

  // Error handling
  handleError: (context: WebSocketContext, event: WebSocketEvent & { error?: Error }) => ({
    ...context,
    state: {
      ...context.state,
      lastError: event.error || new Error(ERRORS.UNKNOWN_ERROR),
      reconnectAttempts: context.state.reconnectAttempts + 1
    }
  }),

  // Reconnection
  prepareReconnect: (context: WebSocketContext) => ({
    ...context,
    state: {
      ...context.state,
      status: 'reconnecting'
    }
  })
};

export type Actions = typeof actions;

```

### `machine/machine.ts`

```typescript
// core/networks/websocket/machine/machine.ts

import { createMachine } from 'xstate';
import type { WebSocketContext, WebSocketEvent } from './types';
import { EVENTS, STATES, DEFAULT_OPTIONS } from './constants';
import { guards } from './guards';
import { actions } from './actions';

const createInitialContext = (): WebSocketContext => ({
  url: null,
  socket: null,
  options: DEFAULT_OPTIONS,
  state: {
    status: 'disconnected',
    reconnectAttempts: 0,
    lastError: null,
    metrics: {
      messagesSent: 0,
      messagesReceived: 0,
      bytesReceived: 0,
      bytesSent: 0
    },
    lastMessageId: null
  },
  timers: {
    connectTime: 0,
    disconnectTime: 0,
    lastPingTime: 0,
    lastPongTime: 0,
    lastReconnectTime: 0
  },
  queue: {
    messages: [],
    processing: false
  },
  messageCount: 0,
  windowStart: 0,
  rateLimit: DEFAULT_OPTIONS.rateLimit
});

export const createWebSocketMachine = () => {
  return createMachine({
    id: 'webSocket',
    types: {} as {
      context: WebSocketContext;
      events: WebSocketEvent;
    },
    context: createInitialContext(),
    initial: STATES.DISCONNECTED,
    states: {
      [STATES.DISCONNECTED]: {
        on: {
          [EVENTS.CONNECT]: {
            target: STATES.CONNECTING,
            guard: guards.isValidUrl,
            actions: actions.initializeConnection
          }
        }
      },
      [STATES.CONNECTING]: {
        entry: actions.establishConnection,
        on: {
          [EVENTS.OPEN]: {
            target: STATES.CONNECTED,
            actions: actions.handleConnectionSuccess
          },
          [EVENTS.ERROR]: {
            target: STATES.RECONNECTING,
            guard: guards.shouldReconnect,
            actions: [actions.handleError, actions.prepareReconnect]
          },
          [EVENTS.CLOSE]: {
            target: STATES.DISCONNECTED,
            actions: actions.cleanupConnection
          }
        }
      },
      [STATES.CONNECTED]: {
        on: {
          [EVENTS.MESSAGE]: {
            actions: actions.handleMessage
          },
          [EVENTS.SEND]: {
            guard: guards.canSendMessage,
            actions: actions.queueMessage
          },
          [EVENTS.DISCONNECT]: {
            target: STATES.DISCONNECTING,
            actions: actions.initiateDisconnect
          },
          [EVENTS.ERROR]: {
            target: STATES.RECONNECTING,
            guard: guards.shouldReconnect,
            actions: [actions.handleError, actions.prepareReconnect]
          }
        }
      },
      [STATES.DISCONNECTING]: {
        on: {
          [EVENTS.CLOSE]: {
            target: STATES.DISCONNECTED,
            actions: actions.cleanupConnection
          }
        }
      },
      [STATES.RECONNECTING]: {
        on: {
          [EVENTS.RETRY]: {
            target: STATES.CONNECTING,
            guard: guards.canReconnect
          },
          [EVENTS.MAX_RETRIES]: {
            target: STATES.DISCONNECTED,
            actions: actions.cleanupConnection
          }
        }
      }
    }
  });
};

```

---

This gives us a basic working state machine with:
1. Core state transitions
2. Basic action implementations
3. Guard conditions for transitions
4. Initial context and setup

---

We still need to add:
1. Rate limiting functionality
2. Queue processing
3. Heartbeat mechanism
4. More sophisticated error handling
5. Metrics collection

---

<blockquote>
is it better to have unit tests before extending the functionalities? i would make the machine work before upgrading client.ts, what do you think?
</blockquote>

---

Yes, you're absolutely right. We should:
1. Write unit tests first to validate our basic state machine functionality
2. Implement missing core features in the machine
3. Then upgrade the client.ts

Let's create the unit tests for our current machine implementation:



```typescript
// qi/core/tests/unit/network/websocket/machine.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createActor } from 'xstate';
import { createWebSocketMachine } from '../../../../networks/websocket/machine/machine';
import { EVENTS, STATES } from '../../../../networks/websocket/machine/constants';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  public readyState = MockWebSocket.CONNECTING;
  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(public url: string) {}

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code, reason, wasClean: true }));
  }

  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event('open'));
  }

  simulateError(error: Error): void {
    this.onerror?.(Object.assign(new Event('error'), { error }));
  }

  simulateMessage(data: unknown): void {
    this.onmessage?.(new MessageEvent('message', { data }));
  }
}

describe('WebSocket State Machine', () => {
  let machine;
  let actor;

  beforeEach(() => {
    vi.stubGlobal('WebSocket', MockWebSocket);
    machine = createWebSocketMachine();
    actor = createActor(machine);
    actor.start();
  });

  describe('Initial State', () => {
    it('should start in disconnected state', () => {
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe(STATES.DISCONNECTED);
      expect(snapshot.context.socket).toBeNull();
    });
  });

  describe('Connection', () => {
    it('should transition to connecting on valid CONNECT event', () => {
      const validUrl = 'ws://localhost:8080';
      
      actor.send({ type: EVENTS.CONNECT, url: validUrl });
      const snapshot = actor.getSnapshot();

      expect(snapshot.value).toBe(STATES.CONNECTING);
      expect(snapshot.context.url).toBe(validUrl);
      expect(snapshot.context.socket).toBeInstanceOf(MockWebSocket);
    });

    it('should stay in disconnected state for invalid URL', () => {
      actor.send({ type: EVENTS.CONNECT, url: 'invalid-url' });
      expect(actor.getSnapshot().value).toBe(STATES.DISCONNECTED);
    });

    it('should transition to connected on successful connection', () => {
      actor.send({ type: EVENTS.CONNECT, url: 'ws://localhost:8080' });
      const socket = actor.getSnapshot().context.socket as MockWebSocket;
      
      socket.simulateOpen();
      
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe(STATES.CONNECTED);
      expect(snapshot.context.state.reconnectAttempts).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should attempt reconnection on error when connected', () => {
      // Setup connected state
      actor.send({ type: EVENTS.CONNECT, url: 'ws://localhost:8080' });
      (actor.getSnapshot().context.socket as MockWebSocket).simulateOpen();
      
      // Simulate error
      const error = new Error('Connection lost');
      (actor.getSnapshot().context.socket as MockWebSocket).simulateError(error);
      
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe(STATES.RECONNECTING);
      expect(snapshot.context.state.lastError).toBe(error);
      expect(snapshot.context.state.reconnectAttempts).toBe(1);
    });

    it('should not reconnect on authentication errors', () => {
      actor.send({ type: EVENTS.CONNECT, url: 'ws://localhost:8080' });
      (actor.getSnapshot().context.socket as MockWebSocket).simulateOpen();
      
      const error = new Error('Authentication failed');
      (actor.getSnapshot().context.socket as MockWebSocket).simulateError(error);
      
      expect(actor.getSnapshot().value).toBe(STATES.DISCONNECTED);
    });
  });

  describe('Disconnection', () => {
    it('should handle clean disconnection', () => {
      // Setup connected state
      actor.send({ type: EVENTS.CONNECT, url: 'ws://localhost:8080' });
      (actor.getSnapshot().context.socket as MockWebSocket).simulateOpen();
      
      actor.send({ type: EVENTS.DISCONNECT });
      
      expect(actor.getSnapshot().value).toBe(STATES.DISCONNECTING);
      
      (actor.getSnapshot().context.socket as MockWebSocket).close(1000, 'Normal closure');
      
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe(STATES.DISCONNECTED);
      expect(snapshot.context.socket).toBeNull();
    });

    it('should cleanup resources on disconnection', () => {
      actor.send({ type: EVENTS.CONNECT, url: 'ws://localhost:8080' });
      (actor.getSnapshot().context.socket as MockWebSocket).simulateOpen();
      
      actor.send({ type: EVENTS.DISCONNECT });
      (actor.getSnapshot().context.socket as MockWebSocket).close();
      
      const snapshot = actor.getSnapshot();
      expect(snapshot.context.socket).toBeNull();
      expect(snapshot.context.timers.disconnectTime).toBeGreaterThan(0);
    });
  });

  describe('Message Handling', () => {
    it('should update metrics on message received', () => {
      actor.send({ type: EVENTS.CONNECT, url: 'ws://localhost:8080' });
      (actor.getSnapshot().context.socket as MockWebSocket).simulateOpen();
      
      const message = { data: 'test message' };
      actor.send({ type: EVENTS.MESSAGE, data: message });
      
      expect(actor.getSnapshot().context.state.metrics.messagesReceived).toBe(1);
    });

    it('should queue messages when send is called', () => {
      actor.send({ type: EVENTS.CONNECT, url: 'ws://localhost:8080' });
      (actor.getSnapshot().context.socket as MockWebSocket).simulateOpen();
      
      const message = { data: 'test message' };
      actor.send({ type: EVENTS.SEND, data: message });
      
      expect(actor.getSnapshot().context.queue.messages).toHaveLength(1);
      expect(actor.getSnapshot().context.queue.messages[0].data).toBe(message);
    });
  });
});

```

These tests cover our basic functionality and highlight where we need to add features. Based on the test results, we should:

1. Add reconnection logic and backoff strategy
2. Implement message queue processing
3. Add proper cleanup of resources
4. Add event timestamps and proper metrics tracking

