# Mocking Tutorial

Mocking is a crucial technique in unit testing that allows you to isolate the unit of code you're testing by replacing its dependencies with controlled substitutes. This ensures that tests are reliable, fast, and focused solely on the functionality of the unit under test.

## 1. Introduction to Mocking

Mocking involves creating fake versions of dependencies that mimic the behavior of real components. By doing so, you can test components in isolation without relying on their actual dependencies, which might be slow, unreliable, or difficult to set up.

### Benefits of Mocking

- **Isolation:** Ensures tests are focused on the unit being tested.
- **Speed:** Mocks are typically faster than real implementations.
- **Control:** Allows you to simulate different scenarios and edge cases.
- **Reliability:** Reduces dependencies on external systems that might introduce flakiness.

## 2. Basic Mocking Patterns

Vitest provides powerful utilities to create and manage mocks. Understanding these basic patterns is essential for effective mocking.

### Function Mocks

Mocking standalone functions allows you to control their return values and track their usage.

```typescript
// filepath: tests/unit/basic-mock.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchData } from '../../src/api';

describe('fetchData', () => {
  it('should return mocked data', async () => {
    // Create a mock for the fetchData function
    const mockFetchData = vi.fn().mockResolvedValue({ data: 'mocked data' });

    // Replace the real fetchData with the mock
    vi.spyOn(require('../../src/api'), 'fetchData').mockImplementation(mockFetchData);

    const result = await fetchData();
    expect(result).toEqual({ data: 'mocked data' });
    expect(mockFetchData).toHaveBeenCalledTimes(1);
  });
});
```

### Module Mocks

Mocking entire modules allows you to replace all their exported functions or classes.

```typescript
// filepath: tests/unit/module-mock.test.ts
import { describe, it, expect, vi } from 'vitest';
import { processData } from '../../src/processor';
import * as api from '../../src/api';

// Mock the entire api module
vi.mock('../../src/api', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'mocked data' }),
}));

describe('processData', () => {
  it('should process mocked data correctly', async () => {
    const result = await processData();
    expect(result).toBe('processed mocked data');
    expect(api.fetchData).toHaveBeenCalled();
  });
});
```

## 3. Mock Implementations

Sometimes, you need more control over how mocks behave. Vitest allows you to define custom implementations for your mocks.

### Custom Implementation Example

```typescript
// filepath: tests/unit/custom-mock.test.ts
import { describe, it, expect, vi } from 'vitest';
import { calculate } from '../../src/calc';
import { getMultiplier } from '../../src/utils';

// Create a custom implementation for getMultiplier
vi.mock('../../src/utils', () => ({
  getMultiplier: vi.fn((value: number) => {
    if (value < 0) throw new Error('Negative value not allowed');
    return value * 2;
  }),
}));

describe('calculate', () => {
  it('should correctly calculate the result with positive values', () => {
    const result = calculate(5);
    expect(result).toBe(10);
    expect(getMultiplier).toHaveBeenCalledWith(5);
  });

  it('should throw an error for negative values', () => {
    expect(() => calculate(-3)).toThrow('Negative value not allowed');
    expect(getMultiplier).toHaveBeenCalledWith(-3);
  });
});
```

## 4. File System Mocks

Mocking file system operations is essential when your code interacts with the file system. This ensures tests do not perform actual read/write operations, making them faster and safer.

### Mocking the `fs` Module

```typescript
// filepath: tests/unit/fs-mock.test.ts
import { describe, it, expect, vi } from 'vitest';
import { readConfig } from '../../src/config';
import fs from 'fs';

// Mock the fs module
vi.mock('fs');

describe('readConfig', () => {
  it('should read and parse the configuration file', () => {
    const mockData = JSON.stringify({ port: 8080 });
    vi.mocked(fs.readFileSync).mockReturnValue(mockData);

    const config = readConfig('config.json');
    expect(config).toEqual({ port: 8080 });
    expect(fs.readFileSync).toHaveBeenCalledWith('config.json', 'utf-8');
  });

  it('should throw an error if the file does not exist', () => {
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory');
    });

    expect(() => readConfig('missing.json')).toThrow('ENOENT: no such file or directory');
    expect(fs.readFileSync).toHaveBeenCalledWith('missing.json', 'utf-8');
  });
});
```

## 5. Reset Patterns

Ensuring that mocks do not retain state between tests is vital for maintaining test isolation. Vitest provides methods to reset mocks effectively.

### Using Lifecycle Hooks to Reset Mocks

```typescript
// filepath: tests/unit/reset-mocks.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetchData } from '../../src/api';
import { processData } from '../../src/processor';

vi.mock('../../src/api');

describe('Data Processing', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
  });

  afterEach(() => {
    // Restore original implementations after each test
    vi.restoreAllMocks();
  });

  it('should process data correctly', async () => {
    vi.mocked(fetchData).mockResolvedValue({ data: 'mocked data' });
    const result = await processData();
    expect(result).toBe('processed mocked data');
    expect(fetchData).toHaveBeenCalledTimes(1);
  });

  it('should handle fetchData failure', async () => {
    vi.mocked(fetchData).mockRejectedValue(new Error('Network Error'));
    await expect(processData()).rejects.toThrow('Network Error');
    expect(fetchData).toHaveBeenCalledTimes(1);
  });
});
```

### Clearing Mock Histories

If you need to clear only the call histories of mocks without resetting their implementations, use `vi.clearAllMocks()`.

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

## 6. Advanced Mocking Techniques

For more complex scenarios, you might need to mock classes, specific methods, or even entire modules with dependencies.

### Mocking Classes

```typescript
// filepath: tests/unit/class-mock.test.ts
import { describe, it, expect, vi } from 'vitest';
import { Database } from '../../src/database';
import { UserService } from '../../src/userService';

// Mock the Database class
vi.mock('../../src/database');

describe('UserService', () => {
  it('should create a new user', () => {
    const mockDbInstance = new Database();
    mockDbInstance.saveUser = vi.fn().mockResolvedValue(true);
    const userService = new UserService(mockDbInstance);

    userService.createUser({ name: 'John Doe' });
    expect(mockDbInstance.saveUser).toHaveBeenCalledWith({ name: 'John Doe' });
  });

  it('should handle database errors', async () => {
    const mockDbInstance = new Database();
    mockDbInstance.saveUser = vi.fn().mockRejectedValue(new Error('DB Error'));
    const userService = new UserService(mockDbInstance);

    await expect(userService.createUser({ name: 'Jane Doe' })).rejects.toThrow('DB Error');
    expect(mockDbInstance.saveUser).toHaveBeenCalledWith({ name: 'Jane Doe' });
  });
});
```

---

**Additional Resources:**

- [Vitest Official Documentation](https://vitest.dev/)
- [Mockito Documentation](https://site.mockito.org/) (for Jest examples)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
```

---