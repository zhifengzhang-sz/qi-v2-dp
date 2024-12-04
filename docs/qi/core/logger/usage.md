# Logger Module (@qi/core/logger)

## Overview

The logger module provides a configurable logging system based on Winston, offering structured logging with customizable formatting, multiple transports, and environment-aware configuration.

### Key Features

- JSON-structured logging with pretty-printing
- Environment-aware configuration
- Multiple transport targets (console, file)
- Color-coded output by log level
- Error object handling with stack traces
- Millisecond precision timestamps
- Consistent metadata formatting
- TypeScript support
- Development vs Production configurations

### Core Components

1. Logger Instance
   - Winston-based logger
   - Environment-aware configuration
   - Multiple transports support

2. Custom Formatter
   - Structured output
   - Error handling
   - Metadata formatting

3. Transport System
   - Console output
   - File logging (development)
   - Error-specific logging

## Installation

```bash
# npm
npm install winston

# yarn
yarn add winston

# pnpm
pnpm add winston
```

## Configuration

### Environment Variables

- `LOG_LEVEL`: Sets the logging level
  - Values: 'error', 'warn', 'info', 'debug'
  - Default: 'info'

- `NODE_ENV`: Controls environment-specific features
  - Production: Console-only logging
  - Development: Additional file logging

### Log Levels

In order of decreasing severity:

| Level | Description | Usage |
|-------|-------------|-------|
| error | Critical errors requiring immediate attention | System failures, unrecoverable errors |
| warn  | Warning conditions that should be reviewed | Deprecation notices, recoverable issues |
| info  | Normal but significant events | Application state changes, successful operations |
| debug | Detailed debugging information | Development-time troubleshooting |

## Usage

### Basic Logging

```typescript
import { logger } from '@qi/core/logger';

// Simple message
logger.info('Operation successful');

// With metadata
logger.info('User login', {
  userId: '123',
  timestamp: new Date(),
  source: 'auth-service'
});

// Error logging
try {
  throw new Error('Database connection failed');
} catch (error) {
  logger.error('System error', { 
    error,
    context: 'database-init'
  });
}
```

### Logging with Context

```typescript
const context = {
  requestId: 'req-123',
  userId: 'user-456',
  service: 'payment-api'
};

// Info with context
logger.info('Processing payment', {
  ...context,
  amount: 100,
  currency: 'USD'
});

// Error with context
logger.error('Payment failed', {
  ...context,
  error: new Error('Insufficient funds'),
  errorCode: 'PAY_001'
});
```

### Debug Logging

```typescript
logger.debug('Cache operation details', {
  operation: 'set',
  key: 'user:123',
  valueSize: 1024,
  duration: 45
});
```

## Output Formats

### Basic Message

```
2024-03-14 12:34:56.789 [INFO]    User logged in
```

### Message with Metadata

```
2024-03-14 12:34:56.789 [INFO]    User authenticated
{
  "userId": "123",
  "role": "admin",
  "sessionId": "sess_abc123",
  "duration": 150
}
```

### Error Message

```
2024-03-14 12:34:56.789 [ERROR]   Operation failed
{
  "error": {
    "message": "Connection refused",
    "stack": "Error: Connection refused\n    at TCP.connect...",
    "code": "CONN_001"
  },
  "operation": "database_connect",
  "attempts": 3
}
```

## File Logging (Development)

In development mode, logs are written to:

- `error.log`: Error-level messages only
- `combined.log`: All log levels

File logging is automatically disabled in production.

## Best Practices

### Error Logging

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', {
    error,               // Include the full error object
    operation: 'riskyOperation',
    context: {          // Add relevant context
      input: params,
      state: currentState
    }
  });
}
```

### Structured Metadata

```typescript
// Good: Structured and searchable
logger.info('User action', {
  action: 'profile_update',
  userId: '123',
  changes: {
    name: 'new name',
    email: 'new@email.com'
  }
});

// Bad: Unstructured text
logger.info('User 123 updated profile: changed name and email');
```

### Performance Logging

```typescript
const start = performance.now();
try {
  await operation();
  logger.info('Operation completed', {
    operation: 'name',
    duration: performance.now() - start,
    success: true
  });
} catch (error) {
  logger.error('Operation failed', {
    operation: 'name',
    duration: performance.now() - start,
    error,
    success: false
  });
}
```

## Implementation Details

### LogEntry Interface

```typescript
interface LogEntry extends winston.Logform.TransformableInfo {
  level: string;
  message: unknown;
  timestamp?: string;
  [key: string]: unknown;
}
```

### Metadata Formatting

The formatter handles several special cases:
- Error objects (with stack traces)
- Undefined values
- Null values
- Nested objects
- Circular references

### Transport Configuration

- Console Transport:
  - Colorized output
  - Error messages to stderr
  - All levels supported

- File Transport (Development):
  - Separate error log
  - Combined log for all levels
  - No colors

## Common Issues

### Missing Error Details

Problem:
```typescript
logger.error('Failed', { error: error.message });  // Lost stack trace
```

Solution:
```typescript
logger.error('Failed', { error });  // Pass full error object
```

### Excessive Logging

Problem:
```typescript
// High-frequency debug logging
for (const item of items) {
  logger.debug('Processing item', { item });
}
```

Solution:
```typescript
// Batch logging
logger.debug('Processing items', { 
  count: items.length,
  first: items[0],
  last: items[items.length - 1]
});
```

### Large Objects

Problem:
```typescript
logger.info('Data', { hugeObject });  // Memory/performance issue
```

Solution:
```typescript
logger.info('Data', {
  size: Object.keys(hugeObject).length,
  summary: summarizeObject(hugeObject)
});
```

## Testing

### Mocking the Logger

```typescript
import { logger } from '@qi/core/logger';

jest.mock('@qi/core/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

describe('MyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log errors', () => {
    // Test code
    expect(logger.error).toHaveBeenCalledWith(
      'Operation failed',
      expect.objectContaining({
        error: expect.any(Error)
      })
    );
  });
});
```

## Migration Guide

### From console.log

```typescript
// Before
console.log('User:', user);
console.error('Failed:', error);

// After
logger.info('User details', { user });
logger.error('Operation failed', { error });
```

### From other Loggers

```typescript
// Before (generic logger)
log.write('info', 'Message');
log.writeError('Error', error);

// After
logger.info('Message');
logger.error('Error occurred', { error });
```

## License

MIT License - see LICENSE.md for details.