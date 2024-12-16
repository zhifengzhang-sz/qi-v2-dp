# HTTP Client Unit Testing - Learnings and Best Practices

## Key Challenges Encountered

### 1. Error Transformation Chain
- **Challenge**: Getting the error transformation to work properly through the Axios interceptor chain
- **Issues**:
  - Infinite recursion in mock implementations
  - Loss of error types during transformation
  - Inconsistent status code propagation
- **Learning**: Error transformation needs careful mocking and proper type preservation

### 2. Mock Setup Complexity
- **Challenge**: Setting up mocks that accurately represent Axios behavior
- **Issues**:
  - Recursive mock implementations causing stack overflow
  - Difficulty in maintaining error chain through interceptors
  - Complex interaction between request mocks and interceptors
- **Learning**: Simpler mock implementations often work better than trying to fully replicate axios behavior

### 3. Type Safety
- **Challenge**: Maintaining proper TypeScript types throughout the test
- **Issues**:
  - Type assertions needed for error handling
  - Private method access limitations
  - Interface compatibility with mocked objects
- **Learning**: Need to respect access modifiers and ensure type safety in mocks

## Best Practices Identified

### 1. Error Handling
```typescript
// DO: Simple error transformation mock
vi.mocked(transformAxiosError).mockImplementation((error) => {
  if (error instanceof AxiosError) {
    return new ApplicationError(
      error.message,
      ErrorCode.NETWORK_ERROR,
      error.response?.status || HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
  return createNetworkError("Unknown error", HttpStatusCode.INTERNAL_SERVER_ERROR);
});

// DON'T: Complex recursive implementations
mockRequest.mockImplementation(async (config) => {
  try {
    const result = await mockRequest.getMockImplementation()?.call(null, config);
    return result;
  } catch (error) {
    return errorHandler(error); // Can cause infinite recursion
  }
});
```

### 2. Mock Setup
```typescript
// DO: Simple mock structure
mockAxiosInstance = {
  request: mockRequest,
  interceptors: {
    request: { use: vi.fn(), eject: vi.fn() },
    response: { use: vi.fn(), eject: vi.fn() }
  }
} as unknown as AxiosInstance;

// DON'T: Overly complex mock chains
mockAxiosInstance = {
  request: async (config) => {
    try {
      return await mockRequest(config);
    } catch (error) {
      return errorInterceptor(error); // Complexity increases error potential
    }
  }
} as unknown as AxiosInstance;
```

### 3. Test Organization
```typescript
// DO: Clear test structure
it("should handle errors", async () => {
  // 1. Setup
  const error = new AxiosError(...);
  mockRequest.mockRejectedValueOnce(error);
  
  // 2. Execute
  try {
    await client.get("/test");
    fail("Expected error");
  } catch (error) {
    // 3. Assert
    expect(error).toBeInstanceOf(ApplicationError);
    expect(error.statusCode).toBe(expectedStatus);
  }
});
```

## Critical Requirements

1. **Error Transformation**
   - Must preserve error status codes
   - Must maintain proper error types
   - Must include relevant error context

2. **Mock Implementation**
   - Keep mocks simple and focused
   - Avoid recursive implementations
   - Properly type mock objects

3. **Test Structure**
   - Clear setup/execute/assert pattern
   - Proper error expectations
   - Consistent status code checking

## Common Pitfalls to Avoid

1. **Mock Implementation**
   - Recursive mock implementations
   - Over-complicated error chains
   - Missing type assertions

2. **Error Handling**
   - Lost error context
   - Incorrect status code mapping
   - Improper error transformation

3. **Test Structure**
   - Unclear test boundaries
   - Missing error cases
   - Incomplete assertions

## Moving Forward

### Recommendations
1. Start with simplified mocks
2. Build up complexity gradually
3. Test error cases explicitly
4. Maintain type safety
5. Keep error transformation clear
6. Document complex test setups

### Areas for Improvement
1. Mock structure simplification
2. Error handling clarity
3. Type safety enforcement
4. Test case organization
5. Documentation of complex scenarios