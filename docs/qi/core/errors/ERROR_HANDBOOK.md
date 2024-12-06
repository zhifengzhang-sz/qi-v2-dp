# Error Handling Handbook

## Table of Contents
- [Overview](#overview)
- [Core Components](#core-components)
- [Error Categories](#error-categories)
- [Using the Error System](#using-the-error-system)
- [Specialized Error Types](#specialized-error-types)
- [Best Practices](#best-practices)
- [Error Handling Patterns](#error-handling-patterns)
- [Integration Guidelines](#integration-guidelines)

## Overview

The QI platform implements a comprehensive error handling system through the `@qi/core/errors` module. This system provides:

- Strongly-typed error classes
- Standardized error codes
- Detailed error tracking
- Type-safe error details
- Consistent error handling patterns

### Key Features
- Hierarchical error classification
- Environment-aware error details
- Standardized logging integration
- HTTP status code mapping
- Stack trace management

## Core Components

### ApplicationError Base Class
```typescript
class ApplicationError extends Error {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.APPLICATION_ERROR,
    statusCode: number = 500,
    details?: ErrorDetails
  );

  handle(): {
    status: number;
    error: {
      code: ErrorCode;
      message: string;
      details?: ErrorDetails;
    };
  };
}
```

### Error Details Interface
```typescript
interface ErrorDetails {
  [key: string]: unknown;
}
```

## Error Categories

### Generic Errors (1000-1999)
Used for general application errors, IO operations, and basic connectivity issues.

```typescript
// Base errors
APPLICATION_ERROR = 1000
INITIALIZATION_ERROR = 1001
NOT_INITIALIZED = 1002

// IO errors
READ_ERROR = 1100
WRITE_ERROR = 1101
PARSE_ERROR = 1102

// Connection errors
CONNECTION_ERROR = 1200
TIMEOUT_ERROR = 1201
```

### Configuration Errors (2000-2999)
Handle configuration loading, validation, and environment setup issues.

```typescript
// Basic config errors
CONFIGURATION_ERROR = 2000
CONFIG_NOT_FOUND = 2001
CONFIG_LOAD_ERROR = 2002

// Schema errors
SCHEMA_ERROR = 2100
INVALID_SCHEMA = 2101
```

### Service Lifecycle Errors (3000-3999)
Manage service initialization, connection, and operational states.

```typescript
// Service management
SERVICE_ERROR = 3000
SERVICE_INITIALIZATION_ERROR = 3001
SERVICE_NOT_INITIALIZED = 3002
```

## Using the Error System

### Basic Error Handling
```typescript
try {
  await performOperation();
} catch (error) {
  throw new ApplicationError(
    "Operation failed",
    ErrorCode.OPERATION_ERROR,
    500,
    { originalError: error }
  );
}
```

### With Error Details
```typescript
try {
  await service.connect();
} catch (error) {
  throw new ApplicationError(
    "Service connection failed",
    ErrorCode.CONNECTION_ERROR,
    503,
    {
      service: serviceName,
      host: connectionDetails.host,
      error: error instanceof Error ? error.message : String(error)
    }
  );
}
```

### Error Response Handling
```typescript
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ApplicationError) {
    const response = err.handle();
    res.status(response.status).json(response.error);
  } else {
    const appError = new ApplicationError(
      "Internal Server Error",
      ErrorCode.APPLICATION_ERROR,
      500,
      { originalError: err }
    );
    const response = appError.handle();
    res.status(response.status).json(response.error);
  }
});
```

## Specialized Error Types

### Configuration Error Handling
```typescript
class ConfigLoaderError extends ApplicationError {
  constructor(
    message: string,
    code: ConfigLoaderCode = ErrorCode.CONFIGURATION_ERROR,
    details?: ConfigLoaderErrorDetails
  ) {
    super(message, code, 500, details);
    this.name = "ConfigLoaderError";
  }

  static validationError(
    message: string,
    schemaId: string,
    errors: ErrorObject[]
  ): ConfigLoaderError {
    return ConfigLoaderError.create(
      message,
      ErrorCode.SCHEMA_VALIDATION_FAILED,
      schemaId,
      { errors }
    );
  }
}
```

### Service Error Handling
```typescript
interface ServiceErrorDetails extends ErrorDetails {
  serviceName: string;
  operation?: string;
  state?: string;
}

class ServiceError extends ApplicationError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.SERVICE_ERROR,
    details?: ServiceErrorDetails
  ) {
    super(message, code, 503, details);
    this.name = "ServiceError";
  }
}
```

## Best Practices

### 1. Error Creation
- Use descriptive error messages
- Include appropriate error codes
- Add relevant context in details
- Set appropriate HTTP status codes

```typescript
throw new ApplicationError(
  "Failed to process user data",
  ErrorCode.OPERATION_ERROR,
  400,
  {
    userId: user.id,
    operation: "processUserData",
    validationErrors: errors
  }
);
```

### 2. Error Handling
- Handle errors at appropriate levels
- Transform external errors
- Include debugging context
- Clean up resources

```typescript
try {
  await operation();
} catch (error) {
  await cleanup();
  throw ApplicationError.fromError(
    error,
    ErrorCode.OPERATION_ERROR,
    {
      context: operationContext,
      timestamp: new Date().toISOString()
    }
  );
}
```

### 3. Error Details
- Exclude sensitive information
- Structure details consistently
- Include operation context
- Add timestamps for debugging

```typescript
const errorDetails = {
  operation: "userDataSync",
  timestamp: new Date().toISOString(),
  attemptNumber: retryCount,
  lastSuccessful: lastSync
};
```

## Error Handling Patterns

### 1. Service Layer
```typescript
class ServiceManager {
  async initialize() {
    try {
      await this.service.connect();
    } catch (error) {
      throw new ServiceError(
        "Service initialization failed",
        ErrorCode.SERVICE_INITIALIZATION_ERROR,
        {
          serviceName: this.name,
          state: this.service.state,
          error: error instanceof Error ? error.message : String(error)
        }
      );
    }
  }
}
```

### 2. Configuration Layer
```typescript
class ConfigManager {
  async loadConfig() {
    try {
      const config = await this.loader.load();
      await this.validate(config);
      return config;
    } catch (error) {
      if (error instanceof ConfigLoaderError) {
        throw error;
      }
      throw new ConfigLoaderError(
        "Failed to load configuration",
        ErrorCode.CONFIG_LOAD_ERROR,
        {
          source: this.configPath,
          error: error instanceof Error ? error.message : String(error)
        }
      );
    }
  }
}
```

## Integration Guidelines

### 1. HTTP API Integration
```typescript
function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (error instanceof ApplicationError) {
    const response = error.handle();
    res.status(response.status).json(response.error);
    return;
  }

  // Handle unknown errors
  const appError = new ApplicationError(
    "Internal Server Error",
    ErrorCode.APPLICATION_ERROR,
    500,
    { originalError: error }
  );
  
  const response = appError.handle();
  res.status(response.status).json(response.error);
}
```

### 2. Service Integration
```typescript
class ServiceClient {
  async connect() {
    try {
      await this.client.connect();
    } catch (error) {
      throw new ServiceError(
        "Failed to connect to service",
        ErrorCode.CONNECTION_ERROR,
        {
          serviceName: this.name,
          host: this.config.host,
          port: this.config.port,
          error: error instanceof Error ? error.message : String(error)
        }
      );
    }
  }
}
```

### 3. Logging Integration
```typescript
class Logger {
  error(error: ApplicationError) {
    console.error({
      message: error.message,
      code: error.code,
      status: error.statusCode,
      details: error.details,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
```

For information on adding new error codes or modifying existing ones, please refer to the [Error Code Workflow](ERROR_CODE_WORKFLOW.md).