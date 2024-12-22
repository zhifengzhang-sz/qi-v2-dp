# Error Handling in Tests

Handling and testing errors is a vital aspect of creating robust and reliable applications. Proper error testing ensures that your application can gracefully handle unexpected situations and provide meaningful feedback to users.

## 1. Introduction to Error Testing

Error testing involves verifying that your application correctly handles erroneous conditions, such as invalid inputs, failed network requests, or unexpected exceptions. By testing these scenarios, you can ensure that your application behaves predictably under adverse conditions.

### Benefits of Error Testing

- **Reliability:** Ensures that your application can handle errors gracefully without crashing.
- **User Experience:** Provides meaningful error messages to users, enhancing usability.
- **Maintainability:** Helps identify and fix potential issues early in the development process.
- **Security:** Prevents unexpected behaviors that could be exploited.

## 2. Testing Synchronous Errors

Synchronous errors occur immediately during the execution of a function. Testing these errors involves verifying that the appropriate exceptions are thrown under specific conditions.

### Example: Testing Throwing Errors

```typescript
// filepath: tests/unit/utils/validateInput.test.ts
import { describe, it, expect } from 'vitest';
import { validateInput } from '../../../src/utils/validateInput';

describe('validateInput', () => {
  it('should throw an error for null input', () => {
    expect(() => validateInput(null)).toThrow('Input cannot be null');
  });

  it('should throw a specific error type for invalid input', () => {
    expect(() => validateInput(undefined)).toThrow(TypeError);
  });
});
```

### Explanation

- **`expect(() => validateInput(null)).toThrow('Input cannot be null')`:** Verifies that calling `validateInput` with `null` throws an error with the specified message.
- **`expect(() => validateInput(undefined)).toThrow(TypeError)`:** Ensures that calling `validateInput` with `undefined` throws a `TypeError`.

## 3. Testing Asynchronous Errors

Asynchronous errors occur during the execution of asynchronous operations, such as promises or async functions. Testing these errors requires handling asynchronous behavior in your tests.

### Example: Testing Rejected Promises

```typescript
// filepath: tests/unit/services/fetchData.test.ts
import { describe, it, expect } from 'vitest';
import { fetchData } from '../../../src/services/fetchData';

describe('fetchData', () => {
  it('should throw an error when the network request fails', async () => {
    await expect(fetchData('invalid-url')).rejects.toThrow('Network Error');
  });

  it('should throw a specific error type on failure', async () => {
    await expect(fetchData('invalid-url')).rejects.toBeInstanceOf(Error);
  });
});
```

### Explanation

- **`await expect(fetchData('invalid-url')).rejects.toThrow('Network Error')`:** Asserts that the `fetchData` function rejects with an error message containing 'Network Error'.
- **`await expect(fetchData('invalid-url')).rejects.toBeInstanceOf(Error)`:** Checks that the rejected value is an instance of `Error`.

## 4. Mocking Errors

Mocking errors allows you to simulate error conditions without relying on actual failures. This approach provides control over the error scenarios you want to test.

### Example: Mocking a Failed API Call

```typescript
// filepath: tests/unit/services/apiService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { ApiService } from '../../../src/services/ApiService';
import axios from 'axios';

vi.mock('axios');

describe('ApiService', () => {
  it('should handle API failures gracefully', async () => {
    // Mock axios to reject the promise
    vi.mocked(axios.get).mockRejectedValue(new Error('API Error'));

    const apiService = new ApiService();
    await expect(apiService.getData()).rejects.toThrow('API Error');
  });

  it('should process data correctly on successful API call', async () => {
    const mockData = { data: 'Success' };
    vi.mocked(axios.get).mockResolvedValue(mockData);

    const apiService = new ApiService();
    const result = await apiService.getData();
    expect(result).toEqual('Success');
    expect(axios.get).toHaveBeenCalledWith('/api/data');
  });
});
```

### Explanation

- **`vi.mock('axios')`:** Mocks the `axios` module to control its behavior during tests.
- **`vi.mocked(axios.get).mockRejectedValue(new Error('API Error'))`:** Configures the mocked `axios.get` to reject with an error, simulating a failed API call.
- **`vi.mocked(axios.get).mockResolvedValue(mockData)`:** Sets up the mocked `axios.get` to resolve with mock data, simulating a successful API call.

## 5. Handling Multiple Error Scenarios

Testing multiple error scenarios ensures that your application can handle various types of failures appropriately.

### Example: Multiple Error Conditions

```typescript
// filepath: tests/unit/utils/parseData.test.ts
import { describe, it, expect } from 'vitest';
import { parseData } from '../../../src/utils/parseData';

describe('parseData', () => {
  it('should throw an error for invalid JSON string', () => {
    const invalidJson = "{ invalid: json ";
    expect(() => parseData(invalidJson)).toThrow(SyntaxError);
  });

  it('should throw an error when required fields are missing', () => {
    const jsonData = JSON.stringify({ name: 'Test' });
    expect(() => parseData(jsonData)).toThrow('Missing required fields');
  });

  it('should throw a custom error for empty input', () => {
    expect(() => parseData('')).toThrow('Input cannot be empty');
  });
});
```

### Explanation

- **Invalid JSON:** Ensures that `parseData` throws a `SyntaxError` when provided with malformed JSON.
- **Missing Fields:** Checks that the function throws an error when essential fields are missing from the input data.
- **Empty Input:** Verifies that an empty string input results in a custom error.

## 6. Summary

Effective error testing is essential for building resilient applications. By:

- **Testing Synchronous Errors:** Ensuring that functions throw appropriate exceptions for invalid inputs.
- **Testing Asynchronous Errors:** Verifying that async operations handle failures correctly.
- **Mocking Errors:** Simulating error conditions to test how your application responds.
- **Handling Multiple Error Scenarios:** Covering a wide range of potential failures to ensure comprehensive coverage.

You can confidently handle and test various error conditions, leading to more reliable and maintainable codebases.

