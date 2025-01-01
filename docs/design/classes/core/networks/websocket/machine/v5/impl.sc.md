```typescript
import { createMachine, assign } from 'xstate';
import WebSocket from 'ws';
import { ApplicationError, ErrorCode } from '@qi/core/errors';
import { logger } from '@qi/core/logger';

// Machine Context Type
interface Context {
  url: string | null;
  socket: WebSocket | null;
  error: ApplicationError | null;
  retries: number;
  window: {
    start: number;
    count: number;
  };
  lastPing: number | null;
  lastPong: number | null;
}

// Implementation Constants - Derived from Formal Spec
const TIMING = {
  CONNECT_TIMEOUT: 30000,
  INITIAL_RETRY_DELAY: 1000,
  MAX_RETRY_DELAY: 60000,
  RETRY_MULTIPLIER: 1.5,
  MAX_RETRIES: 5,
  PING_INTERVAL: 30000,
  PONG_TIMEOUT: 5000
} as const;

const RATE_LIMIT = {
  WINDOW_SIZE: 1000,
  MAX_MESSAGES: 100
} as const;

export const websocketMachine = createMachine({
  id: 'websocket',
  initial: 'disconnected',
  context: {
    url: null,
    socket: null, 
    error: null,
    retries: 0,
    window: {
      start: 0,
      count: 0
    },
    lastPing: null,
    lastPong: null
  } as Context,

  states: {
    disconnected: {
      entry: ['clearContext'],
      on: {
        CONNECT: {
          target: 'connecting',
          guard: 'hasValidUrl',
          actions: ['initSocket']
        }
      }
    },

    connecting: {
      entry: ['startConnectTimeout'],
      exit: ['clearConnectTimeout'],
      on: {
        CONNECTED: {
          target: 'connected',
          actions: ['clearError', 'resetRetries', 'initPing']
        },
        ERROR: {
          target: 'reconnecting',
          actions: ['setError', 'incrementRetries', 'closeSocket']
        }
      }
    },

    connected: {
      entry: ['initRateLimit'],
      exit: ['clearPing'],
      on: {
        DISCONNECT: {
          target: 'disconnected',
          actions: ['closeSocket']
        },
        ERROR: {
          target: 'reconnecting',
          actions: ['setError', 'incrementRetries', 'closeSocket'] 
        },
        SEND: {
          guard: 'withinRateLimit',
          actions: ['sendMessage', 'incrementWindow']
        },
        PONG_TIMEOUT: {
          target: 'reconnecting',
          actions: ['setPongError', 'incrementRetries', 'closeSocket']
        }
      }
    },

    reconnecting: {
      entry: ['scheduleReconnect'],
      exit: ['clearReconnectTimer'],
      on: {
        RECONNECT: {
          target: 'connecting',
          guard: 'canRetry',
          actions: ['initSocket']
        },
        ERROR: {
          target: 'disconnected',
          guard: 'maxRetriesExceeded',
          actions: ['setFinalError']
        }
      }
    }
  }
}, {
  guards: {
    hasValidUrl: (context, event) => {
      return Boolean(event.type === 'CONNECT' && event.url);
    },

    withinRateLimit: (context) => {
      const now = Date.now();
      if (now - context.window.start > RATE_LIMIT.WINDOW_SIZE) {
        return true;
      }
      return context.window.count < RATE_LIMIT.MAX_MESSAGES;
    },

    canRetry: (context) => {
      return context.retries <= TIMING.MAX_RETRIES;
    },

    maxRetriesExceeded: (context) => {
      return context.retries > TIMING.MAX_RETRIES;
    }
  },

  actions: {
    clearContext: assign({
      url: null,
      socket: null,
      error: null,
      retries: 0,
      window: {
        start: 0,
        count: 0
      },
      lastPing: null,
      lastPong: null
    }),

    initSocket: assign({
      socket: (_, event) => {
        if (event.type !== 'CONNECT' && event.type !== 'RECONNECT') return null;
        
        const url = event.type === 'CONNECT' ? event.url : event.url;
        const socket = new WebSocket(url);
        
        socket.on('open', () => {
          logger.info('WebSocket connected', { url });
        });

        socket.on('error', (error) => {
          logger.error('WebSocket error', { error });
        });

        return socket;
      },
      url: (_, event) => event.type === 'CONNECT' ? event.url : null
    }),

    closeSocket: assign({
      socket: (context) => {
        if (context.socket) {
          context.socket.close();
        }
        return null;
      }
    }),

    setError: assign({
      error: (_, event) => {
        if (event.type !== 'ERROR') return null;
        return new ApplicationError(
          event.error.message,
          ErrorCode.WEBSOCKET_ERROR,
          500,
          { cause: event.error }
        );
      }
    }),

    clearError: assign({
      error: null
    }),

    incrementRetries: assign({
      retries: (context) => context.retries + 1
    }),

    resetRetries: assign({
      retries: 0
    }),

    initRateLimit: assign({
      window: {
        start: Date.now(),
        count: 0
      }
    }),

    incrementWindow: assign({
      window: (context) => {
        const now = Date.now();
        if (now - context.window.start > RATE_LIMIT.WINDOW_SIZE) {
          return {
            start: now,
            count: 1
          };
        }
        return {
          ...context.window,
          count: context.window.count + 1
        };
      }
    }),

    initPing: (context) => {
      const socket = context.socket;
      if (!socket) return;

      const pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.ping();
          context.lastPing = Date.now();

          // Set pong timeout
          setTimeout(() => {
            const now = Date.now();
            if (context.lastPong === null || now - context.lastPong > TIMING.PONG_TIMEOUT) {
              logger.error('WebSocket pong timeout');
              socket.emit('error', new Error('Pong timeout'));
            }
          }, TIMING.PONG_TIMEOUT);
        }
      }, TIMING.PING_INTERVAL);

      socket.on('pong', () => {
        context.lastPong = Date.now();
      });

      return pingInterval;
    },

    setPongError: assign({
      error: () => new ApplicationError(
        'WebSocket pong timeout',
        ErrorCode.WEBSOCKET_ERROR,
        500
      )
    }),

    sendMessage: (context, event) => {
      if (event.type !== 'SEND' || !context.socket) return;
      context.socket.send(event.data);
    }
  }
});
```