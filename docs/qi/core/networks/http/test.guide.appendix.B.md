# HTTP Client Testing: Refined Best Practices

## 1. Mock Setup Order Is Critical

```typescript
describe("HttpClient", () => {
  let client: HttpClient;
  let mockAxiosInstance: AxiosInstance;
  let mockRequest: ReturnType<typeof vi.fn>;
  let requestInterceptor: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
  let responseInterceptor: (response: AxiosResponse) => AxiosResponse;
  let errorInterceptor: (error: unknown) => Promise<never>;
  let mockRetryOperation: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // 1. Reset all mocks first
    vi.resetAllMocks();

    // 2. Create mock functions before any other setup
    mockRequest = vi.fn();
    mockRetryOperation = vi.fn().mockImplementation(async (fn, options) => {
      const maxAttempts = options?.retries || 3;
      let attempt = 0;
      while (attempt < maxAttempts) {
        try {
          return await fn();
        } catch (error) {
          attempt++;
          if (attempt < maxAttempts) {
            options?.onRetry?.(attempt);
            continue;
          }
          throw error;
        }
      }
    });

    // 3. Create mock Axios instance
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

    // 4. Setup module mocks
    vi.mocked(axios.create).mockReturnValue(mockAxiosInstance);
    vi.mocked(utils.retryOperation).mockImplementation(mockRetryOperation);

    // 5. Setup error transformation
    vi.mocked(transformAxiosError).mockImplementation((error: unknown) => {
      if (error instanceof AxiosError) {
        const status = error.response?.status || HttpStatusCode.INTERNAL_SERVER_ERROR;
        return new ApplicationError(
          error.message,
          mapHttpStatusToErrorCode(status),
          status,
          {
            url: error.config?.url,
            method: error.config?.method,
            code: error.code,
            response: error.response && {
              data: error.response.data,
              headers: error.response.headers,
              status: error.response.status,
            },
          }
        );
      }
      return createNetworkError(
        error instanceof Error ? error.message : "Unknown error",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    });

    // 6. Create client instance LAST
    client = new HttpClient({
      retry: {
        limit: 3,
        delay: 100,
        enabled: true,
      },
      logger,
    });
  });
});
```

## 2. Common Pitfalls

1. **Mock Order Dependency**
   - ❌ Creating client before mocks are ready
   - ❌ Setting up transformAxiosError after client creation
   - ✅ Setup all mocks before creating client
   - ✅ Clear order: reset → mock fns → axios instance → module mocks → client

2. **Error Transformation Chain**
   - ❌ Direct error throws without transformation
   - ❌ Missing error context in transformed errors
   - ✅ Proper error transformation in interceptors
   - ✅ Complete error context preservation

3. **Response Handling**
   - ❌ Undefined responses in HTTP method tests
   - ❌ Missing response data
   - ✅ Default success response setup
   - ✅ Proper response structure

## 3. Test Patterns

### Error Test Pattern
```typescript
it("should transform errors properly", async () => {
  const testUrl = "https://api.example.com/test";
  const config: InternalAxiosRequestConfig = {
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

  mockRequest.mockRejectedValue(axiosError);

  try {
    await client.get(testUrl);
    fail("Expected error to be thrown");
  } catch (error) {
    expect(error).toBeInstanceOf(ApplicationError);
    const appError = error as ApplicationError;
    expect(appError.statusCode).toBe(HttpStatusCode.BAD_GATEWAY);
    expect(appError.code).toBe(ErrorCode.NETWORK_ERROR);
  }
});
```

### Success Test Pattern
```typescript
it("should make successful request", async () => {
  const mockResponse = {
    data: { result: "success" },
    status: 200,
    statusText: "OK",
    headers: {},
    config: { startTime: Date.now() },
  };

  mockRequest.mockResolvedValue(mockResponse);
  const result = await client.get("/test");
  
  expect(result).toEqual(mockResponse.data);
  expect(mockRequest).toHaveBeenCalledWith({
    method: "GET",
    url: "/test",
  });
});
```

## 4. Testing Checklist

### Setup Phase
- [ ] Reset all mocks first
- [ ] Create mock functions
- [ ] Setup Axios instance
- [ ] Setup module mocks
- [ ] Setup error transformation
- [ ] Create client instance last

### Error Handling
- [ ] Transform all errors properly
- [ ] Preserve error context
- [ ] Test retry behavior
- [ ] Test error code mapping

### Response Handling
- [ ] Setup default responses
- [ ] Test different HTTP methods
- [ ] Verify response data
- [ ] Check interceptor behavior

## 5. Key Learnings

1. **Order Matters**
   - Mock setup order is critical
   - Client instantiation must come last
   - Error transformation setup must precede usage

2. **Complete Mocks**
   - Full mock implementation
   - Proper typing
   - Error and success scenarios
   - Interceptor behavior

3. **Error Chain**
   - Transform all errors
   - Preserve context
   - Map status codes correctly
   - Handle retry logic

4. **Test Isolation**
   - Reset between tests
   - Clean mock state
   - Independent test cases