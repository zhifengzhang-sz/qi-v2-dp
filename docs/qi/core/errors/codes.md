To synchronize error codes (integer numbers) across different error handlers while maintaining a centralized and maintainable structure, we can adopt a **centralized error code registry**. This approach ensures that each error code is unique and easily manageable across the entire application.

## **1. Centralized Error Code Registry**

Create a single source of truth for all error codes. This can be achieved by defining an `ErrorCode` enum or a constant object that maps descriptive error names to unique integer values.

### **A. Using an Enum**

```typescript
// src/errors/ErrorCodes.ts

/**
 * Centralized Error Codes Enumeration.
 * Each error code is a unique integer.
 */
export enum ErrorCode {
  // Generic Errors
  APPLICATION_ERROR = 1000,
  CACHE_ERROR = 1001,

  // Configuration Errors
  CONFIGURATION_ERROR = 2000,
  INVALID_SCHEMA = 2001,
  SCHEMA_NOT_FOUND = 2002,
  SCHEMA_VALIDATION_FAILED = 2003,
  READ_ERROR = 2004,
  PARSE_ERROR = 2005,
  WATCH_ERROR = 2006,
  ENV_LOAD_ERROR = 2007,
  ENV_MISSING_ERROR = 2008,
  CONFIG_LOAD_ERROR = 2009,
  CONFIG_PARSE_ERROR = 2010,

  // Redis Errors
  REDIS_ERROR = 3000,
  CONNECTION_ERROR = 3001,
  TIMEOUT_ERROR = 3002,
  OPERATION_ERROR = 3003,
  CLIENT_ERROR = 3004,
  PING_ERROR = 3005,

  // CLI Configuration Errors
  CLI_INVALID_ARGUMENT = 4000,
  CLI_MISSING_ARGUMENT = 4001,

  // Services Configuration Errors
  SERVICE_CONFIG_INVALID = 5000,
  SERVICE_CONFIG_MISSING = 5001,

  // Add more categories and error codes as needed
}
```

### **B. Using a Constant Object**

```typescript
// src/errors/ErrorCodes.ts

/**
 * Centralized Error Codes Object.
 * Each error code is a unique integer.
 */
export const ErrorCodes = {
  // Generic Errors
  APPLICATION_ERROR: 1000,
  CACHE_ERROR: 1001,

  // Configuration Errors
  CONFIGURATION_ERROR: 2000,
  INVALID_SCHEMA: 2001,
  SCHEMA_NOT_FOUND: 2002,
  SCHEMA_VALIDATION_FAILED: 2003,
  READ_ERROR: 2004,
  PARSE_ERROR: 2005,
  WATCH_ERROR: 2006,
  ENV_LOAD_ERROR: 2007,
  ENV_MISSING_ERROR: 2008,
  CONFIG_LOAD_ERROR: 2009,
  CONFIG_PARSE_ERROR: 2010,

  // Redis Errors
  REDIS_ERROR: 3000,
  CONNECTION_ERROR: 3001,
  TIMEOUT_ERROR: 3002,
  OPERATION_ERROR: 3003,
  CLIENT_ERROR: 3004,
  PING_ERROR: 3005,

  // CLI Configuration Errors
  CLI_INVALID_ARGUMENT: 4000,
  CLI_MISSING_ARGUMENT: 4001,

  // Services Configuration Errors
  SERVICE_CONFIG_INVALID: 5000,
  SERVICE_CONFIG_MISSING: 5001,

  // Add more categories and error codes as needed
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
```

## **2. Integrate Error Codes into Error Classes**

Utilize the centralized error codes in the error classes to maintain consistency and uniqueness.

### **A. Base Error Class**

```typescript
// src/errors/ApplicationError.ts

import { ErrorCode } from './ErrorCodes';
import { logger } from "@qi/core/logger";

export interface ErrorDetails {
  [key: string]: unknown;
}

/**
 * Base error class for all application errors.
 */
export class ApplicationError extends Error {
  public readonly errorCode: ErrorCode;
  public readonly httpStatusCode: number;
  public readonly details?: ErrorDetails;

  constructor(
    message: string,
    errorCode: ErrorCode,
    httpStatusCode: number,
    details?: ErrorDetails
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.errorCode = errorCode;
    this.httpStatusCode = httpStatusCode;
    this.details = details;

    // Log the error upon creation
    logger.error(`${this.name} [${this.errorCode}]: ${this.message}`, { ...details });
  }
}
```

### **B. Domain-Specific Error Classes**

#### **i. Configuration Errors**

```typescript
// src/config/errors.ts

import { ApplicationError } from "@qi/core/errors/ApplicationError";
import { ErrorCode, ErrorCodes } from "@qi/core/errors/ErrorCodes";

/**
 * Configuration-specific error details.
 */
export interface ConfigurationErrorDetails {
  key?: string;
  expectedType?: string;
  receivedType?: string;
  [key: string]: unknown;
}

/**
 * Configuration-specific error class.
 */
export class ConfigurationError extends ApplicationError {
  constructor(
    message: string,
    errorCode: ErrorCode, // Should be one of the CONFIG_ERROR_CODES
    details?: ConfigurationErrorDetails
  ) {
    super(message, errorCode, 500, details);
    this.name = "ConfigurationError";
  }

  /**
   * Factory method for creating ConfigurationError instances.
   */
  static create(
    message: string,
    errorCode: ErrorCode,
    details?: ConfigurationErrorDetails
  ): ConfigurationError {
    return new ConfigurationError(message, errorCode, details);
  }
}
```

#### **ii. Redis Errors**

```typescript
// src/services/redis/errors.ts

import { ApplicationError } from "@qi/core/errors/ApplicationError";
import { ErrorCode, ErrorCodes } from "@qi/core/errors/ErrorCodes";

/**
 * Redis-specific error details.
 */
export interface RedisErrorDetails {
  operation?: string;
  timeout?: number;
  attempt?: number;
  error?: string;
  [key: string]: unknown;
}

/**
 * Redis-specific error class.
 */
export class RedisError extends ApplicationError {
  constructor(
    message: string,
    errorCode: ErrorCode, // Should be one of the REDIS_ERROR_CODES
    details?: RedisErrorDetails
  ) {
    super(message, errorCode, 500, details);
    this.name = "RedisError";
  }

  /**
   * Factory method for creating RedisError instances.
   */
  static create(
    message: string,
    errorCode: ErrorCode,
    details?: RedisErrorDetails
  ): RedisError {
    return new RedisError(message, errorCode, details);
  }
}
```

## **3. Usage Example**

Here's how we can utilize the centralized error codes within the modules.

### **A. Throwing a Configuration Error**

```typescript
// src/config/loader.ts

import { ConfigurationError } from "./errors";
import { ErrorCodes } from "@qi/core/errors/ErrorCodes";

export class ServiceConfigLoader {
  async load(options: LoadServiceConfigOptions): Promise<LoadServiceConfigResult> {
    const { serviceConfigPath, envConfigPath } = options;

    if (!existsSync(serviceConfigPath)) {
      throw ConfigurationError.create(
        "Service configuration file not found.",
        ErrorCodes.SCHEMA_NOT_FOUND,
        { key: serviceConfigPath }
      );
    }

    // Additional loading logic...
  }
}
```

### **B. Throwing a Redis Error**

```typescript
// src/services/redis/client.ts

import { RedisError } from "./errors";
import { ErrorCodes } from "@qi/core/errors/ErrorCodes";

public async ping(): Promise<boolean> {
  let attemptCount = 0;
  try {
    const result = await retryOperation(
      async () => {
        attemptCount += 1;
        this.logger.debug(`Ping attempt ${attemptCount}`);
        return this.client.ping();
      },
      {
        retries: 3,
        minTimeout: 1000,
      }
    );
    return result === "PONG";
  } catch (error) {
    throw RedisError.create(
      "Ping failed.",
      ErrorCodes.PING_ERROR,
      {
        attempt: attemptCount,
        error: error instanceof Error ? error.message : String(error),
      }
    );
  }
}
```

## **4. Automate Error Code Synchronization**

To ensure that error codes remain synchronized and unique, consider the following strategies:

### **A. Enum Incrementing**

Assign error codes in blocks based on their domain. This approach prevents overlap and makes it easier to manage.

```typescript
// Example:
APPLICATION_ERROR = 1000,
CACHE_ERROR = 1001,
CONFIGURATION_ERROR = 2000,
REDIS_ERROR = 3000,
// And so on...
```

### **B. Automated Scripts**

Implement scripts that automatically generate or validate the uniqueness of error codes. This reduces manual errors and ensures consistency.

```typescript
// scripts/validateErrorCodes.ts

import { ErrorCodes } from "../src/errors/ErrorCodes";

const codes = Object.values(ErrorCodes);
const uniqueCodes = new Set(codes);

if (codes.length !== uniqueCodes.size) {
  throw new Error("Duplicate error codes found!");
}

console.log("All error codes are unique.");
```

Add a script in the `package.json` to run this validation:

```json
{
  "scripts": {
    "validate:error-codes": "ts-node scripts/validateErrorCodes.ts"
  }
}
```

Run it using:

```bash
npm run validate:error-codes
# or
yarn validate:error-codes
```

### **C. Documentation and Guidelines**

Maintain clear documentation outlining:

- **Error Code Ranges:**
  - Define specific ranges for different domains to prevent overlaps.
    - **1000-1999:** Generic Errors
    - **2000-2999:** Configuration Errors
    - **3000-3999:** Redis Errors
    - **4000-4999:** CLI Configuration Errors
    - **5000-5999:** Services Configuration Errors
    - *And so forth...*

- **Assignment Protocol:**
  - Guidelines on how to assign new error codes.
  - Responsibilities for updating the `ErrorCodes` registry.

## **5. Update `tsconfig.json` for Path Aliases**

To streamline imports and maintain consistency, configure path aliases in the `tsconfig.json`.

```json
// tsconfig.json

{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@qi/core/errors": ["errors/ErrorCodes.ts"],
      "@qi/core/config/*": ["config/*"],
      "@qi/core/services/config/*": ["services/config/*"],
      "@qi/core/cli/config/*": ["cli/config/*"]
      // Add other aliases as needed
    },
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"],
    "allowJs": true,
    "checkJs": false,
    "declaration": true,
    "emitDeclarationOnly": false,
    "composite": true,
    "strict": true
    // Add other compiler options as needed
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "**/*.test.ts", "**/*.spec.ts"]
}
```

Ensure that the build tools (like Webpack, if used) are configured to recognize these path aliases.

## **6. Final Recommendations**

1. **Consistency is Key:**
   - Always use the centralized `ErrorCode` registry when throwing errors.
   - Avoid hardcoding error codes within individual modules.

2. **Automate Validation:**
   - Integrate error code validation scripts into the CI/CD pipeline to prevent duplicate or conflicting codes.

3. **Maintain Clear Documentation:**
   - Document the purpose and range of each error code.
   - Provide examples of error usage across different modules.

4. **Scalability:**
   - As the application grows, adjust the error code ranges and add new ones as needed without disrupting existing codes.

5. **Avoid Overlapping Code Ranges:**
   - Clearly define and segregate code ranges for different domains to minimize the risk of duplication.

6. **Leverage TypeScript Features:**
   - Utilize TypeScript’s type safety with enums and const assertions to prevent accidental overlaps and ensure robust error handling.

## **7. Example Project Structure**

```
qi/
└── core/
    ├── src/
    │   ├── errors/
    │   │   ├── ApplicationError.ts
    │   │   ├── CacheError.ts
    │   │   ├── ErrorCodes.ts
    │   │   └── index.ts
    │   ├── config/
    │   │   ├── errors.ts
    │   │   ├── ConfigLoader.ts
    │   │   └── ... other config files
    │   ├── cli/
    │   │   └── config/
    │   │       ├── errors.ts
    │   │       ├── CLIConfigLoader.ts
    │   │       └── ... other CLI config files
    │   ├── services/
    │   │   └── config/
    │   │       ├── errors.ts
    │   │       ├── ServicesConfigLoader.ts
    │   │       └── ... other services config files
    │   └── ... other directories
    ├── tsconfig.json
    └── ... other files
```

## **8. Conclusion**

By implementing a centralized error code registry and integrating it seamlessly across the error classes, we ensure:

- **Uniqueness:** Prevents duplicate error codes across different modules.
- **Maintainability:** Simplifies the process of managing and referencing error codes.
- **Scalability:** Easily accommodates new error codes as the application evolves.
- **Consistency:** Provides a uniform approach to error handling across the entire codebase.

This structured approach not only enhances the robustness of the error-handling mechanism but also facilitates easier debugging and maintenance in the long run.
