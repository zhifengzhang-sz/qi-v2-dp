## Base modules in `qi/core`

### `qi/core/src/logger`

@import "../../../qi/core/src/logger/index.ts" {block_code=true class="line-numbers"}

#### Usage Example

To utilize the logger in the application, import it and log messages at various levels as shown below:

```typescript
// src/app.ts

import { logger } from "@qi/core/logger";

// Log an informational message
logger.info("Server started successfully", { port: 3000 });

// Log a warning message
logger.warn("Disk space running low", { availableSpace: "500MB" });

// Log an error message
logger.error("Failed to connect to database", { error: err.message });
```

#### Description

The `logger` instance is configured using Winston to provide versatile logging capabilities across the application. It supports:

- **Color-Coded Console Output**: Enhances readability by colorizing log levels in the console.
- **Precise Timestamps**: Logs include timestamps with millisecond precision for accurate tracing.
- **JSON Metadata Support**: Allows attaching additional metadata to log messages for better context.
- **File Logging in Development**: In non-production environments, logs are written to both `error.log` and `combined.log` files for persistent storage and review.

#### Example

Here's how we can implement and use the logger in different scenarios:

```typescript
// Import the logger
import { logger } from "@qi/core/logger";

// Logging an informational message
logger.info("User registration successful", {
  userId: "abc123",
  role: "admin",
});

// Logging a warning message
logger.warn("Cache miss for key", { key: "user_profile_abc123" });

// Logging an error message
logger.error("Unhandled exception occurred", { error: err.stack });
```

This setup ensures that the application has a robust and flexible logging mechanism, aiding in both development and production debugging processes.

---

### `qi/core/src/errors`

1. `qi/core/src/errors/ErrorCode.ts`
   @import "../../../qi/core/src/errors/ErrorCodes.ts"

2. `qi/core/src/errors/ApplicationError.ts`
   @import "../../../qi/core/src/errors/ApplicationError.ts" {block_code=true class="line-numbers"}

3. `qi/core/src/errors/index.ts`
   @import "../../../qi/core/src/errors/index.ts" {block_code=true class="line-numbers"}

#### ApplicationError Overview

The `ApplicationError` class is the cornerstone of the application's error handling mechanism. It provides a consistent and structured way to handle errors across the entire codebase, ensuring that all errors are managed uniformly and contain necessary contextual information.

#### Key Features

1. **Centralized Error Codes:**

   - Utilizes the `ErrorCode` enumeration to assign standardized codes to errors, promoting consistency and ease of identification.

2. **Structured Error Details:**

   - Incorporates an `ErrorDetails` interface to attach additional context to errors, facilitating easier debugging and more informative responses.

3. **Standardized Handling Mechanism:**

   - Implements a `handle` method that logs error details and prepares a consistent response format, suitable for APIs or other interfaces.

4. **Integration with Logging System:**
   - Leverages a centralized `logger` to record error information, including messages, codes, details, and stack traces.

#### Components

1. **ErrorCode Enumeration (`ErrorCodes.ts`):**

   - Defines a comprehensive set of error codes used throughout the application.
   - Ensures that each error type is uniquely identifiable and standardized.

   ```typescript
   // src/errors/ErrorCodes.ts

   export enum ErrorCode {
     APPLICATION_ERROR = "APPLICATION_ERROR",
     INVALID_INPUT = "INVALID_INPUT",
     AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED",
     // Add other error codes as needed
   }
   ```

2. **ErrorDetails Interface:**

   - Provides a flexible structure to include any additional information related to an error.
   - Allows for the inclusion of nested objects, arrays, or primitive values to convey detailed context.

3. **ApplicationError Class:**
   - Serves as the base class for all application-specific errors.
   - Encapsulates common properties such as `message`, `code`, `statusCode`, and `details`.
   - Offers a `handle` method to process the error uniformly across different parts of the application.

#### Usage Guidelines

1. **Creating Custom Errors:**

   - Extend the `ApplicationError` class to create specific error types tailored to different scenarios.
   - Assign appropriate `ErrorCode` values to each custom error to maintain clarity and consistency.

   ````typescript
   // src/errors/CustomErrors.ts

   import { ApplicationError, ErrorDetails } from "./ApplicationError";
   import { ErrorCode } from "./ErrorCodes";

   /**
    * Error thrown when user authentication fails.
    */
   export class AuthenticationError extends ApplicationError {
     constructor(message: string, details?: ErrorDetails) {
       super(message, ErrorCode.AUTHENTICATION_FAILED, 401, details);
       this.name = "AuthenticationError";
     }

     /**
      * Factory method to create a new AuthenticationError instance.
      *
      * @param {string} message - Error message.
      * @param {ErrorDetails} [details] - Additional error details.
      * @returns {AuthenticationError} New instance of AuthenticationError.
      *
      * @example
      * ```typescript
      * throw AuthenticationError.create("Invalid credentials provided.", { username: "john_doe" });
      * ```
      */
     static create(
       message: string,
       details?: ErrorDetails
     ): AuthenticationError {
       return new AuthenticationError(message, details);
     }
   }
   ````

2. **Throwing Errors:**

   - Instantiate and throw errors using either the constructor or factory methods provided by custom error classes.

   ```typescript
   // src/controllers/UserController.ts

   import { AuthenticationError } from "../errors/CustomErrors";

   export async function loginUser(req, res) {
     const { username, password } = req.body;

     const user = await findUserByUsername(username);
     if (!user || !validatePassword(user, password)) {
       throw AuthenticationError.create("Invalid username or password.", {
         username,
       });
     }

     // Proceed with generating token or session
   }
   ```

3. **Catching and Handling Errors:**

   - Use try-catch blocks to intercept errors and utilize the `handle` method for logging and response preparation.

   ```typescript
   // src/middleware/errorHandler.ts

   import { ApplicationError } from "../errors/ApplicationError";

   export function errorHandler(err, req, res, next) {
     if (err instanceof ApplicationError) {
       const response = err.handle();
       return res.status(response.status).json(response.error);
     }

     // Handle non-ApplicationError instances
     console.error("Unhandled error:", err);
     res
       .status(500)
       .json({
         code: "INTERNAL_SERVER_ERROR",
         message: "An unexpected error occurred.",
       });
   }
   ```

#### Best Practices

- **Consistent Error Codes:**

  - Always use predefined `ErrorCode` values when throwing errors to maintain consistency and facilitate easier error tracking.

- **Comprehensive Error Details:**

  - Provide as much contextual information as possible within the `details` property to aid in debugging and user feedback.

- **Avoid Sensitive Information:**

  - Ensure that sensitive data is not exposed in error messages or details, especially in production environments.

- **Utilize Factory Methods:**

  - Prefer using factory methods for creating error instances, as they encapsulate the instantiation logic and enforce consistent usage patterns.

- **Centralized Error Handling:**
  - Implement a centralized error handling middleware or mechanism to uniformly process and respond to errors across the application.

#### Extending the Error Handling System

To extend the error handling system with new error types:

1. **Define a New ErrorCode:**

   - Add a new entry to the `ErrorCode` enumeration in `ErrorCodes.ts`.

   ```typescript
   export enum ErrorCode {
     // Existing codes...
     RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
     // Add new codes here
   }
   ```

2. **Create a Custom Error Class:**

   - Extend `ApplicationError` to create a new error class corresponding to the new error code.

   ````typescript
   // src/errors/ResourceErrors.ts

   import { ApplicationError, ErrorDetails } from "./ApplicationError";
   import { ErrorCode } from "./ErrorCodes";

   /**
    * Error thrown when a requested resource is not found.
    */
   export class ResourceNotFoundError extends ApplicationError {
     constructor(message: string, details?: ErrorDetails) {
       super(message, ErrorCode.RESOURCE_NOT_FOUND, 404, details);
       this.name = "ResourceNotFoundError";
     }

     /**
      * Factory method to create a new ResourceNotFoundError instance.
      *
      * @param {string} message - Error message.
      * @param {ErrorDetails} [details] - Additional error details.
      * @returns {ResourceNotFoundError} New instance of ResourceNotFoundError.
      *
      * @example
      * ```typescript
      * throw ResourceNotFoundError.create("User not found.", { userId: 123 });
      * ```
      */
     static create(
       message: string,
       details?: ErrorDetails
     ): ResourceNotFoundError {
       return new ResourceNotFoundError(message, details);
     }
   }
   ````

3. **Utilize the New Error:**

   - Throw the new error in appropriate places within the application.

   ```typescript
   // src/services/UserService.ts

   import { ResourceNotFoundError } from "../errors/ResourceErrors";

   export async function getUserById(userId: number) {
     const user = await database.findUserById(userId);
     if (!user) {
       throw ResourceNotFoundError.create("User not found.", { userId });
     }
     return user;
   }
   ```

#### **Summary**

The `ApplicationError` class, in conjunction with the `ErrorCode` enumeration and specialized error classes, establishes a robust error handling framework within the application. By adhering to the outlined practices and extending the system as needed, developers can ensure consistent, informative, and manageable error management throughout the project.

---

### `qi/core/src/utils`

@import "../../../qi/core/src/utils/index.ts" {block_code=true class="line-numbers"}

#### Description

The `@qi/core/utils` module offers a collection of essential utility functions that facilitate common operations within the application. These utilities enhance environment handling, data formatting, error management, and provide re-exports of frequently used Lodash functions for streamlined development.

**Key Features:**

- **Environment Handling:**

  - `parseEnvFile`: Parses environment variable files (`.env`) supporting comments and quoted values.
  - `orIfFileNotExist`: Gracefully handles file read operations by providing fallback values if files are missing.

- **Data Formatting:**

  - `formatBytes`: Converts byte values into human-readable formats (e.g., KB, MB).
  - `truncate`: Shortens long strings and appends ellipses for readability.

- **Cryptographic Operations:**

  - `generateHash`: Creates SHA-256 hashes for input strings, useful for securing sensitive data.

- **Retry Mechanisms:**

  - `retryAsync`: Implements retry logic for asynchronous operations, enhancing reliability in network requests or unstable operations.

- **Logging Enhancements:**

  - `coloredLog`: Outputs log messages with colors corresponding to their severity levels for better visibility in the console.

- **Lodash Utilities:**
  - Re-exports common Lodash functions like `debounce`, `throttle`, `deepMerge`, `isPlainObject`, and `uniqueBy` for ease of use across the application.

#### Usage Example

Here's how we can utilize the various utility functions provided by the `@qi/core/utils` module in the application:

```typescript
// src/app.ts

import {
  debounce,
  throttle,
  deepMerge,
  isPlainObject,
  uniqueBy,
  orIfFileNotExist,
  parseEnvFile,
  generateHash,
  formatBytes,
  retryAsync,
  truncate,
  coloredLog,
} from "@qi/core/utils";
import { promises as fs } from "fs";

async function initializeApp() {
  // Environment Handling
  const envContent = await orIfFileNotExist(fs.readFile(".env", "utf-8"), "");
  const envVars = parseEnvFile(envContent);
  console.log(envVars);

  // Cryptographic Hashing
  const passwordHash = generateHash("my_secure_password");
  console.log(`Password Hash: ${passwordHash}`);

  // Data Formatting
  const formattedBytes = formatBytes(2048);
  console.log(`Formatted Bytes: ${formattedBytes}`);

  const longString =
    "This is an exceptionally long string that needs to be truncated.";
  const shortString = truncate(longString, 30);
  console.log(`Truncated String: ${shortString}`);

  // Logging Enhancements
  coloredLog("info", "Application initialized successfully.");
  coloredLog("warn", "Low disk space detected.");
  coloredLog("error", "Failed to connect to the database.");

  // Retry Mechanism
  try {
    const data = await retryAsync(() => fetchDataFromAPI(), {
      retries: 3,
      minTimeout: 1000,
    });
    console.log("Data fetched:", data);
  } catch (error) {
    console.error("Failed to fetch data after retries:", error);
  }

  // Lodash Utilities
  const debouncedFunction = debounce(() => {
    console.log("Debounced Function Executed");
  }, 300);

  debouncedFunction();

  const throttledFunction = throttle(() => {
    console.log("Throttled Function Executed");
  }, 1000);

  throttledFunction();

  const mergedObject = deepMerge({ a: 1, b: { c: 2 } }, { b: { d: 3 } });
  console.log("Merged Object:", mergedObject);

  const plain = isPlainObject(mergedObject);
  console.log("Is Plain Object:", plain);

  const uniqueArray = uniqueBy([{ id: 1 }, { id: 2 }, { id: 1 }], "id");
  console.log("Unique Array:", uniqueArray);
}

initializeApp();

/**
 * Mock function to simulate fetching data from an API.
 * Replace this with actual API call logic.
 */
async function fetchDataFromAPI(): Promise<any> {
  // Simulate a network request with a possibility of failure
  if (Math.random() < 0.7) {
    throw new Error("Network Error");
  }
  return { data: "Sample Data" };
}
```

#### Example Breakdown

1. **Environment Handling:**

   - **Reading Environment Variables:**
     ```typescript
     const envContent = await orIfFileNotExist(
       fs.readFile(".env", "utf-8"),
       ""
     );
     const envVars = parseEnvFile(envContent);
     console.log(envVars);
     ```
     - Attempts to read a `.env` file.
     - If the file doesn't exist, returns an empty string as a fallback.
     - Parses the environment variables and logs them.

2. **Cryptographic Hashing:**

   - **Generating a Hash:**
     ```typescript
     const passwordHash = generateHash("my_secure_password");
     console.log(`Password Hash: ${passwordHash}`);
     ```
     - Creates a SHA-256 hash of the input string.

3. **Data Formatting:**

   - **Formatting Bytes:**

     ```typescript
     const formattedBytes = formatBytes(2048);
     console.log(`Formatted Bytes: ${formattedBytes}`);
     ```

     - Converts `2048` bytes to a human-readable format (`2 kB`).

   - **Truncating Strings:**
     ```typescript
     const longString =
       "This is an exceptionally long string that needs to be truncated.";
     const shortString = truncate(longString, 30);
     console.log(`Truncated String: ${shortString}`);
     ```
     - Shortens a long string to `30` characters, appending an ellipsis.

4. **Logging Enhancements:**

   - **Colored Logging:**
     ```typescript
     coloredLog("info", "Application initialized successfully.");
     coloredLog("warn", "Low disk space detected.");
     coloredLog("error", "Failed to connect to the database.");
     ```
     - Logs messages with colors based on severity (`info` in blue, `warn` in yellow, `error` in red).

5. **Retry Mechanism:**

   - **Retrying an Operation:**
     ```typescript
     try {
       const data = await retryAsync(() => fetchDataFromAPI(), {
         retries: 3,
         minTimeout: 1000,
       });
       console.log("Data fetched:", data);
     } catch (error) {
       console.error("Failed to fetch data after retries:", error);
     }
     ```
     - Attempts to fetch data from an API.
     - Retries up to `3` times with a minimum timeout of `1` second between attempts.

6. **Lodash Utilities:**

   - **Debounce and Throttle:**

     ```typescript
     const debouncedFunction = debounce(() => {
       console.log("Debounced Function Executed");
     }, 300);

     debouncedFunction();

     const throttledFunction = throttle(() => {
       console.log("Throttled Function Executed");
     }, 1000);

     throttledFunction();
     ```

     - Debounces and throttles functions to control their execution frequency.

   - **Deep Merge:**

     ```typescript
     const mergedObject = deepMerge({ a: 1, b: { c: 2 } }, { b: { d: 3 } });
     console.log("Merged Object:", mergedObject);
     ```

     - Deeply merges two objects.

   - **Type Checking:**

     ```typescript
     const plain = isPlainObject(mergedObject);
     console.log("Is Plain Object:", plain);
     ```

     - Checks if `mergedObject` is a plain JavaScript object.

   - **Unique By Property:**
     ```typescript
     const uniqueArray = uniqueBy([{ id: 1 }, { id: 2 }, { id: 1 }], "id");
     console.log("Unique Array:", uniqueArray);
     ```
     - Removes duplicate objects from an array based on the `id` property.

#### **Summary**

The `@qi/core/utils` module is a comprehensive collection of utility functions designed to streamline common tasks within the application. By providing robust environment handling, secure cryptographic operations, flexible data formatting, reliable retry mechanisms, and convenient Lodash re-exports (the re-export mechanism can be thought of adaptor pattern), this module enhances both the development experience and the application's reliability.

Implementing these utilities can significantly reduce boilerplate code, improve error handling, and ensure consistent data processing across different parts of the application.

If one requires further customization or additional utilities, consider extending this module to fit the specific project needs.
