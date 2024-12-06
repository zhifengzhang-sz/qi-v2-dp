### `basic.usage.ts`

```typescript
import { ApplicationError, ErrorCode } from "@qi/core/errors";

// Basic error handling
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

// Custom error handling
function handleApiError(error: unknown) {
  if (error instanceof ApplicationError) {
    return error.handle();
  }

  const appError = new ApplicationError(
    "Internal Server Error",
    ErrorCode.APPLICATION_ERROR,
    500,
    { originalError: error }
  );
  return appError.handle();
}
```

### `service.errors.ts`

```typescript
import { ApplicationError, ErrorCode } from "@qi/core/errors";

class ServiceError extends ApplicationError {
  constructor(
    message: string,
    originalError: unknown,
    details?: { serviceName: string }
  ) {
    super(message, ErrorCode.SERVICE_ERROR, 500, {
      ...details,
      error:
        originalError instanceof Error
          ? originalError.message
          : String(originalError),
    });
  }
}

// Usage example
async function initializeService() {
  try {
    await service.connect();
  } catch (error) {
    throw new ServiceError("Service initialization failed", error, {
      serviceName: "redis",
    });
  }
}
```

# `config.errors.ts`

```typescript
import { ConfigLoaderError, CONFIG_LOADER_CODES } from "../errors";

// Configuration validation example
function validateConfig(config: unknown) {
  try {
    validateSchema(config);
  } catch (error) {
    throw ConfigLoaderError.validationError(
      "Invalid configuration",
      "config-schema-1.0",
      error.errors
    );
  }
}

// Environment variable handling
function checkRequiredEnv(varName: string) {
  const value = process.env[varName];
  if (!value) {
    throw ConfigLoaderError.create(
      `Missing required environment variable: ${varName}`,
      CONFIG_LOADER_CODES.ENV_MISSING_ERROR,
      "env-loader",
      { variable: varName }
    );
  }
  return value;
}
```
