# HTTP Client Testing: A Comprehensive Guide

## Part 1: Foundation Setup

### 1.1 Basic Test Structure
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios, { AxiosInstance, AxiosError } from "axios";
import { HttpClient } from "./client";
import { ApplicationError, ErrorCode } from "./errors";

describe("HttpClient", () => {
  let client: HttpClient;
  let mockAxiosInstance: AxiosInstance;
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Setup code here
  });

  afterEach(() => {
    vi.resetAllMocks();
  });
});
```

### 1.2 Mock Setup
```typescript
// Clean mock setup pattern
beforeEach(() => {
  // 1. Reset all mocks first
  vi.resetAllMocks();

  // 2. Create mock request function
  mockRequest = vi.fn();

  // 3. Create mock Axios instance with interceptors
  mockAxiosInstance = {
    request: mockRequest,
    interceptors: {
      request: {
        use: vi.fn((interceptor) => {
          requestInterceptor = interceptor;
          return 0;
        }),
        eject: vi.fn(),
      },
      response: {
        use: vi.fn((success, error) => {
          responseInterceptor = success;
          errorInterceptor = error!;
          return 0;
        }),
        eject: vi.fn(),
      },
    },
  } as unknown as AxiosInstance;

  // 4. Mock axios.create
  vi.mocked(axios.create).mockReturnValue(mockAxiosInstance);

  // 5. Create client instance
  client = new HttpClient({
    retry: {
      limit: 3,
      delay: 100,
      enabled: true,
    },
    logger,
  });
});
```

## Part 2: Error Handling Setup

### 2.1 Error Transformation Mocks
```typescript
// 1. Mock error transformation module
vi.mock("@qi/core/networks", async () => {
  const actual = await vi.importActual<typeof import("@qi/core/networks")>(
    "@qi/core/networks"
  );
  
  return {
    ...actual,
    transformAxiosError: vi.fn((error: unknown) => {
      if (error instanceof AxiosError) {
        const status = error.response?.status || HttpStatusCode.INTERNAL_SERVER_ERROR;
        const errorCode = mapHttpStatusToErrorCode(status);
        
        return new ApplicationError(error.message, errorCode, status, {
          url: error.config?.url,
          method: error.config?.method,
          code: error.code,
          response: error.response && {
            data: error.response.data,
            headers: error.response.headers,
            status: error.response.status,
          },
        });
      }
      
      return createNetworkError(
        error instanceof Error ? error.message : "Unknown network error",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }),
  };
});
```

### 2.2 Error Code Mapping
```typescript
// In your error codes file
export enum ErrorCode {
  // Network-specific error codes
  NETWORK_ERROR = 1500,
  BAD_GATEWAY = 1502,
  SERVICE_UNAVAILABLE = 1503,
  NOT_FOUND_ERROR = 1404,
}

// Mapping function
export function mapHttpStatusToErrorCode(status: HttpStatusCodeType): ErrorCode {
  switch (status) {
    case HttpStatusCode.BAD_GATEWAY:
      return ErrorCode.BAD_GATEWAY;
    case HttpStatusCode.SERVICE_UNAVAILABLE:
      return ErrorCode.SERVICE_UNAVAILABLE;
    // Add other mappings...
    default:
      return ErrorCode.NETWORK_ERROR;
  }
}
```

## Part 3: Test Cases Implementation

### 3.1 Basic Request Testing
```typescript
describe("HTTP methods", () => {
  const mockResponse = {
    data: { result: "success" },
    status: 200,
    statusText: "OK",
    headers: {},
    config: { startTime: Date.now() },
  };

  it("should make GET request", async () => {
    mockRequest.mockResolvedValueOnce(mockResponse);
    const result = await client.get("/test");
    
    expect(result).toEqual(mockResponse.data);
    expect(mockRequest).toHaveBeenCalledWith({
      method: "GET",
      url: "/test",
    });
  });
});
```

### 3.2 Error Handling Tests
```typescript
describe("error handling", () => {
  it("should transform errors properly", async () => {
    // 1. Setup error scenario
    const testUrl = "https://api.example.com/test";
    const config = {
      url: testUrl,
      headers: new AxiosHeaders(),
      method: "GET",
      startTime: Date.now(),
    };

    const axiosError = new AxiosError(
      "Bad Gateway",
      "ERR_BAD_GATEWAY",
      config,
      undefined,
      {
        status: HttpStatusCode.BAD_GATEWAY,
        statusText: "Bad Gateway",
        data: null,
        headers: new AxiosHeaders(),
        config,
      }
    );

    // 2. Mock rejection
    mockRequest.mockRejectedValueOnce(axiosError);

    // 3. Test error handling
    try {
      await client.get(testUrl);
      fail("Expected error to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ApplicationError);
      const appError = error as ApplicationError;
      expect(appError.statusCode).toBe(HttpStatusCode.BAD_GATEWAY);
      expect(appError.code).toBe(ErrorCode.BAD_GATEWAY);
      expect(appError.message).toBe("Bad Gateway");
    }
  });
});
```

### 3.3 Retry Behavior Testing
```typescript
describe("retry behavior", () => {
  it("should retry failed requests", async () => {
    // 1. Setup network error
    const testUrl = "/test";
    const networkError = new AxiosError(
      "Network Error",
      "ERR_NETWORK",
      { url: testUrl },
      undefined,
      undefined
    );

    // 2. Setup success response after retry
    const successResponse = {
      data: { success: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config: { url: testUrl },
    };

    // 3. Mock sequence of responses
    mockRequest
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce(successResponse);

    // 4. Test retry behavior
    const response = await client.get(testUrl);
    
    expect(response).toEqual(successResponse.data);
    expect(mockRequest).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenCalledWith(
      "Retrying request",
      expect.objectContaining({
        url: testUrl,
        attempt: 1,
      })
    );
  });
});
```

## Part 4: Common Pitfalls and Solutions

### 4.1 Error Transformation Issues
```typescript
// WRONG: Recursive implementation
vi.mocked(transformAxiosError).mockImplementation(async (error) => {
  if (error instanceof AxiosError) {
    return await transformAxiosError(error); // Infinite recursion!
  }
});

// RIGHT: Direct implementation
vi.mocked(transformAxiosError).mockImplementation((error) => {
  if (error instanceof AxiosError) {
    return new ApplicationError(
      error.message,
      mapHttpStatusToErrorCode(error.response?.status || 500),
      error.response?.status || 500
    );
  }
});
```

### 4.2 Mock Cleanup
```typescript
// WRONG: Incomplete cleanup
afterEach(() => {
  vi.resetAllMocks();
});

// RIGHT: Complete cleanup
afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
  mockAxiosInstance = null!;
  mockRequest = null!;
  client = null!;
});
```

## Part 5: Best Practices Summary

### 5.1 Mock Implementation
- Keep mocks simple and direct
- Avoid recursive implementations
- Clear mock reset between tests
- Type-safe mock objects

### 5.2 Error Handling
- Complete error code mapping
- Preserve error context
- Test all error scenarios
- Proper error transformation

### 5.3 Test Organization
- Clear setup/teardown patterns
- Isolated test cases
- Meaningful assertions
- Proper type checking

## Part 6: Testing Checklist

### Before Writing Tests
- [ ] Error codes properly defined
- [ ] Mock implementations planned
- [ ] Test scenarios identified
- [ ] Required utilities imported

### During Test Implementation
- [ ] Clear test descriptions
- [ ] Proper mock setup
- [ ] Error scenarios covered
- [ ] Retry behavior tested
- [ ] Response handling verified

### After Test Implementation
- [ ] All tests pass
- [ ] No memory leaks
- [ ] Proper cleanup
- [ ] Documentation updated
- [ ] Edge cases covered

## Part 7: Debugging Tips

1. **Mock Issues**
   - Check mock implementation order
   - Verify mock reset between tests
   - Ensure proper type assertions

2. **Error Handling**
   - Verify error code mappings
   - Check error context preservation
   - Test error transformation chain

3. **Async Testing**
   - Use proper async/await
   - Handle promise rejections
   - Check retry timing

4. **Type Safety**
   - Proper interface implementations
   - Correct type assertions
   - Complete type definitions

Remember to keep your test code as clean and maintainable as your production code. Regular refactoring and review of test implementations help maintain code quality and catch potential issues early.