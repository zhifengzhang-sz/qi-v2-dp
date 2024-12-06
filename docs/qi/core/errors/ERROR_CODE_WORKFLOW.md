# Error Code Management Workflow

## 1. Error Code Categorization

### Understanding Error Ranges
Error codes are organized in specific ranges:
```typescript
1000-1999: Generic/Base errors
2000-2999: Configuration errors
3000-3999: Service lifecycle errors
4000-4999: CLI errors
5000-5999: Service configuration errors
6000-6999: Data/Cache errors
```

## 2. Adding New Error Codes

### Step 1: Identify the Category
- Determine which range the new error belongs to
- Check existing error codes to avoid duplication
- Ensure the error fits the category's purpose

### Step 2: Update ErrorCodes.ts
1. Add the new error code within the appropriate range
2. Include JSDoc comments explaining the error's purpose
3. Maintain sequential ordering within the range

Example:
```typescript
/** ErrorCodes.ts */

export enum ErrorCode {
  // Existing codes...

  // === Service Lifecycle Errors (3000-3999) ===
  // Add new service error codes here
  SERVICE_ERROR = 3000,
  SERVICE_INITIALIZATION_ERROR = 3001,
  
  // Adding new error code
  /**
   * Indicates a service connection pool exhaustion
   * Used when all available connections are in use
   * and new connections cannot be established
   */
  SERVICE_POOL_EXHAUSTED = 3005,  // New code
}
```

### Step 3: Document the Addition
1. Update the range documentation at the top of the file
2. Add the new error code to the relevant section
3. Include any specific handling requirements

```typescript
/**
 * @fileoverview Error Codes Enumeration
 * 
 * Ranges:
 * ...
 * 3000-3999: Service lifecycle errors
 *   - 3000-3049: General service errors
 *   - 3050-3099: Connection pool errors  // New section
 *   ...
 */
```

## 3. Creating Error Handlers

### Step 1: Create Specific Error Class (if needed)
If the new error code requires specific handling:

```typescript
// services/errors.ts
import { ApplicationError, ErrorCode } from "@qi/core/errors";

export interface ServicePoolErrorDetails extends ErrorDetails {
  poolSize: number;
  activeConnections: number;
  waitingRequests: number;
}

export class ServicePoolError extends ApplicationError {
  constructor(
    message: string,
    details?: ServicePoolErrorDetails
  ) {
    super(
      message,
      ErrorCode.SERVICE_POOL_EXHAUSTED,
      503, // Service Unavailable
      details
    );
    this.name = "ServicePoolError";
  }

  static create(
    poolSize: number,
    activeConnections: number,
    waitingRequests: number
  ): ServicePoolError {
    return new ServicePoolError(
      "Service connection pool exhausted",
      {
        poolSize,
        activeConnections,
        waitingRequests
      }
    );
  }
}
```

### Step 2: Implement Error Usage
```typescript
// service/pool.ts
class ConnectionPool {
  async getConnection(): Promise<Connection> {
    if (this.activeConnections >= this.maxPoolSize) {
      throw ServicePoolError.create(
        this.maxPoolSize,
        this.activeConnections,
        this.waitingRequests.length
      );
    }
    // ... connection logic
  }
}
```

## 4. Testing New Error Codes

### Step 1: Unit Tests
```typescript
describe('ServicePoolError', () => {
  it('should create error with correct code', () => {
    const error = ServicePoolError.create(10, 10, 5);
    expect(error.code).toBe(ErrorCode.SERVICE_POOL_EXHAUSTED);
    expect(error.statusCode).toBe(503);
  });

  it('should include pool details', () => {
    const error = ServicePoolError.create(10, 10, 5);
    expect(error.details).toEqual({
      poolSize: 10,
      activeConnections: 10,
      waitingRequests: 5
    });
  });
});
```

### Step 2: Integration Tests
```typescript
describe('ConnectionPool', () => {
  it('should throw SERVICE_POOL_EXHAUSTED when pool is full', async () => {
    const pool = new ConnectionPool({ maxSize: 1 });
    await pool.getConnection(); // First connection
    
    await expect(pool.getConnection())
      .rejects
      .toThrow(ServicePoolError);
  });
});
```

## 5. Best Practices

1. Error Code Organization
- Keep codes numerically ordered
- Maintain clear category boundaries
- Leave gaps for future codes
- Document category ranges

2. Error Code Documentation
- Include clear descriptions
- Document common causes
- Provide handling recommendations
- Include usage examples

3. Error Code Implementation
- Create specific error classes when needed
- Include relevant error details
- Use appropriate HTTP status codes
- Implement proper error handling

4. Maintenance
- Regularly review error categories
- Remove unused error codes
- Update documentation
- Maintain backwards compatibility