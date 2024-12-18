# WebSocket Error Handling Integration

## 1. Update `types.ts`
```typescript
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { NetworkErrorContext } from "@qi/core/network/errors";

export interface WebSocketErrorContext extends NetworkErrorContext {
  connectionAttempts?: number;
  lastError?: Error;
  closeCode?: number;
  closeReason?: string;
}

export interface WebSocketError extends ApplicationError {
  context: WebSocketErrorContext;
}

export type WebSocketEvents = {
  // ... existing events ...
  ERROR: {
    type: 'ERROR';
    error: WebSocketError;
    timestamp: number;
    attempt?: number;
  };
};
```

## 2. Add Error Creation Utility
```typescript
// utils/errors.ts
import { createNetworkError, HttpStatusCode, mapWebSocketErrorToStatus } from "@qi/core/network/errors";
import { ErrorCode } from "@qi/core/errors";

export function createWebSocketError(
  message: string,
  originalError: Error,
  context: WebSocketErrorContext
): WebSocketError {
  const statusCode = mapWebSocketErrorToStatus(originalError);
  return createNetworkError(
    message,
    statusCode,
    {
      ...context,
      error: originalError,
      readyState: context.socket?.readyState
    }
  ) as WebSocketError;
}

export function isRecoverableError(error: WebSocketError): boolean {
  return error.statusCode !== HttpStatusCode.WEBSOCKET_POLICY_VIOLATION &&
         error.statusCode !== HttpStatusCode.WEBSOCKET_PROTOCOL_ERROR &&
         error.code !== ErrorCode.AUTH_ERROR;
}
```

## 3. Update Services Implementation
```typescript
// services.ts
export const services = {
  webSocketService: (context: WebSocketContext) => (send: Sender) => {
    let socket: WebSocket;
    
    try {
      socket = new WebSocket(context.url, context.protocols);
    } catch (error) {
      const wsError = createWebSocketError(
        "Failed to create WebSocket connection",
        error as Error,
        { url: context.url }
      );
      send({ type: 'ERROR', error: wsError, timestamp: Date.now() });
      return;
    }

    socket.onerror = (event) => {
      const wsError = createWebSocketError(
        "WebSocket encountered an error",
        event.error,
        {
          url: context.url,
          connectionAttempts: context.state.connectionAttempts,
          readyState: socket.readyState
        }
      );
      send({ type: 'ERROR', error: wsError, timestamp: Date.now() });
    };

    socket.onclose = (event) => {
      const wsError = createWebSocketError(
        "WebSocket connection closed",
        new Error(event.reason),
        {
          closeCode: event.code,
          closeReason: event.reason,
          wasClean: event.wasClean,
          url: context.url
        }
      );
      send({ 
        type: 'CLOSE',
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        error: wsError
      });
    };

    return () => {
      if (socket) {
        socket.close(HttpStatusCode.WEBSOCKET_NORMAL_CLOSURE, "Service cleanup");
      }
    };
  },

  // ... other services ...
};
```

## 4. Update Guards for Error Handling
```typescript
// guards.ts
export const guards = {
  // ... existing guards ...
  
  canReconnect: (context: WebSocketContext, event: ErrorEvent) => {
    if (!context.options.reconnect) return false;
    if (context.state.connectionAttempts >= context.options.maxReconnectAttempts) return false;
    
    // Check if error is recoverable
    if ('error' in event && event.error instanceof ApplicationError) {
      return isRecoverableError(event.error as WebSocketError);
    }
    
    return true;
  },

  shouldTerminate: (context: WebSocketContext, event: ErrorEvent) => {
    if ('error' in event && event.error instanceof ApplicationError) {
      return !isRecoverableError(event.error as WebSocketError);
    }
    return false;
  }
};
```

## 5. Update Actions for Error Handling
```typescript
// actions.ts
export const actions = {
  // ... existing actions ...

  handleError: (context: WebSocketContext, event: ErrorEvent) => ({
    ...context,
    state: {
      ...context.state,
      lastError: event.error,
      lastErrorTime: Date.now()
    },
    errors: [
      ...context.errors.slice(-99),
      {
        timestamp: Date.now(),
        error: event.error,
        attempt: context.state.connectionAttempts
      }
    ]
  }),

  logError: (context: WebSocketContext, event: ErrorEvent) => {
    // ApplicationError already handles logging through its handle() method
    if (event.error instanceof ApplicationError) {
      event.error.handle();
    }
    return context;
  }
};
```

## 6. Machine Update
```typescript
// machine.ts
export const webSocketMachine = createMachine({
  // ... other configuration ...
  
  states: {
    connecting: {
      // ... existing state config ...
      on: {
        ERROR: [
          {
            target: 'reconnecting',
            guard: 'canReconnect',
            actions: ['handleError', 'logError']
          },
          {
            target: 'disconnected',
            guard: 'shouldTerminate',
            actions: ['handleError', 'logError', 'cleanup']
          }
        ]
      }
    }
    // ... other states ...
  }
});
```

## Key Improvements:

1. **Type Safety**
   - Proper error context typing
   - Integration with existing error system

2. **Error Recovery**
   - Clear distinction between recoverable and non-recoverable errors
   - Proper error context capture

3. **Logging Integration**
   - Uses existing ApplicationError.handle() mechanism
   - Maintains error history in context

4. **Clean Error Handling**
   - Proper error creation utilities
   - Consistent error format across the system

Would you like me to elaborate on any part of these changes?