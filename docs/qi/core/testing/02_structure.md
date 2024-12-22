# Test Structure Tutorial

Organizing your tests effectively is crucial for maintaining a scalable and readable codebase. This section will guide you through the fundamental patterns and best practices for structuring your tests using Vitest.

## 1. Basic Test Blocks

Understanding the basic building blocks of Vitest tests is essential. These blocks help you organize and define your tests clearly.

### Describe/It Pattern

- **`describe`:** Used to group related tests together. It helps in organizing tests into logical sections, making them easier to navigate and understand.
- **`it`:** Defines an individual test case. Each `it` block should test a specific behavior or functionality.
- **`expect`:** Used for assertions. It checks whether a value meets certain conditions.

#### Basic Example

```typescript
// filepath: tests/unit/example.test.ts
import { describe, it, expect } from 'vitest';

describe('Basic Math Operations', () => {
  it('should add two numbers correctly', () => {
    const sum = 1 + 1;
    expect(sum).toBe(2);
  });

  it('should subtract two numbers correctly', () => {
    const difference = 5 - 3;
    expect(difference).toBe(2);
  });
});
```

### Explanation

- **`describe('Basic Math Operations', () => { ... })`:** Groups all tests related to basic math operations.
- **`it('should add two numbers correctly', () => { ... })`:** A test case that verifies the addition functionality.
- **`expect(sum).toBe(2)`:** Asserts that the result of the addition is `2`.

## 2. Test Organization

As your project grows, organizing tests becomes more important. Proper organization enhances readability and maintainability.

### Single Feature Testing

Testing one feature or function within a single `describe` block keeps related tests together.

```typescript
// filepath: tests/unit/utils.test.ts
import { describe, it, expect } from 'vitest';
import { hash } from '../../src/utils';

describe('hash Function', () => {
  it('generates a consistent hash for the same input', () => {
    const input = "test";
    const hash1 = hash(input);
    const hash2 = hash(input);
    expect(hash1).toBe(hash2);
  });

  it('generates different hashes for different inputs', () => {
    const hash1 = hash("test1");
    const hash2 = hash("test2");
    expect(hash1).not.toBe(hash2);
  });
});
```

### Related Features

Grouping related features within nested `describe` blocks provides a clear hierarchy and context.

```typescript
// filepath: tests/unit/config/ConfigFactory.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigFactory } from '../../src/config/ConfigFactory';
import { ISchema, IConfigCache } from '../../src/config/types';

describe('ConfigFactory', () => {
  describe('Creation', () => {
    it('creates a loader with default options', () => {
      const factory = new ConfigFactory();
      const loader = factory.createLoader();
      expect(loader).toBeDefined();
    });

    it('creates a loader with custom schema', () => {
      const customSchema: ISchema = { /* schema details */ };
      const factory = new ConfigFactory(customSchema);
      const loader = factory.createLoader();
      expect(loader).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('validates the schema correctly', () => {
      const factory = new ConfigFactory();
      const isValid = factory.validateSchema();
      expect(isValid).toBe(true);
    });

    it('handles invalid schema appropriately', () => {
      const invalidSchema: ISchema = { /* invalid schema details */ };
      const factory = new ConfigFactory(invalidSchema);
      expect(() => factory.validateSchema()).toThrow();
    });
  });
});
```

### Explanation

- **`describe('ConfigFactory', () => { ... })`:** Groups all tests related to the `ConfigFactory` class.
- **Nested `describe` blocks (e.g., `describe('Creation', () => { ... })`):** Further categorize tests based on specific functionalities within `ConfigFactory`.
- **Individual `it` blocks:** Each test case focuses on a particular aspect of the feature being tested.

## 3. Setup and Teardown

Managing setup and teardown processes ensures that each test runs in a controlled and predictable environment.

### Test Lifecycle Hooks

Vitest provides lifecycle hooks that run at specific times during the testing process. These hooks help in setting up preconditions and cleaning up after tests.

```typescript
// filepath: tests/unit/lifecycle.test.ts
import { describe, it, beforeAll, beforeEach, afterEach, afterAll, expect } from 'vitest';

describe('Component Lifecycle', () => {
  beforeAll(() => {
    // Runs once before all tests in this block
    console.log('Test suite starting');
  });

  beforeEach(() => {
    // Runs before each test in this block
    console.log('Test starting');
  });

  afterEach(() => {
    // Runs after each test in this block
    console.log('Test finished');
  });

  afterAll(() => {
    // Runs once after all tests in this block
    console.log('Test suite finished');
  });

  it('should perform a sample test', () => {
    expect(true).toBe(true);
  });
});
```

### Real World Example

Managing instances and mock states in your tests ensures each test is independent and does not interfere with others.

```typescript
// filepath: tests/unit/config/ConfigFactory.test.ts
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { ConfigFactory } from '../../src/config/ConfigFactory';
import { ISchema, IConfigCache } from '../../src/config/types';

describe('ConfigFactory', () => {
  let factory: ConfigFactory;
  let mockSchema: ISchema;
  let mockCache: IConfigCache;

  beforeEach(() => {
    // Initialize mock schema and cache before each test
    mockSchema = {
      validate: vi.fn(),
      validateSchema: vi.fn(),
    };
    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
    };
    factory = new ConfigFactory(mockSchema, mockCache);
    vi.clearAllMocks(); // Clear mock histories
  });

  it('validates schema on creation', () => {
    expect(mockSchema.validateSchema).toHaveBeenCalled();
  });

  it('creates a new loader instance', () => {
    const loader = factory.createLoader();
    expect(loader).toBeDefined();
    expect(loader).toBeInstanceOf(SomeLoaderClass); // Replace with actual loader class
  });
});
```

### Explanation

- **`beforeEach`:** Runs before each test, setting up fresh instances of mocks and classes to ensure tests do not share state.
- **`vi.clearAllMocks()`:** Clears mock histories to prevent interactions from previous tests affecting the current one.
- **Independent Tests:** Each `it` block operates on a fresh instance of `ConfigFactory`, ensuring test isolation.

## 4. Best Practices for Test Structure

Adhering to best practices ensures your tests remain effective and maintainable as your project grows.

### Descriptive Naming

- **Test Suites (`describe`):** Use clear and descriptive names that convey the purpose of the tests.
- **Test Cases (`it`):** Clearly describe what the test is verifying. This makes it easier to understand test failures.

```typescript
describe('User Authentication', () => {
  it('should register a new user successfully', () => {
    // test implementation
  });

  it('should not register a user with an existing email', () => {
    // test implementation
  });
});
```

### Single Responsibility

Each test case should focus on a single aspect of the functionality. Avoid testing multiple behaviors in a single test.

```typescript
it('should return the correct user object', () => {
  const user = getUserById(1);
  expect(user).toEqual({ id: 1, name: 'John Doe' });
});

it('should throw an error for invalid user ID', () => {
  expect(() => getUserById(-1)).toThrow('Invalid user ID');
});
```

### DRY (Don't Repeat Yourself)

Extract common setup code using lifecycle hooks or helper functions to avoid repetition.

```typescript
describe('Product Service', () => {
  let productService: ProductService;

  beforeEach(() => {
    productService = new ProductService();
  });

  it('should create a new product', () => {
    const product = productService.createProduct('New Product');
    expect(product).toBeDefined();
  });

  it('should retrieve an existing product', () => {
    productService.createProduct('Existing Product');
    const product = productService.getProduct(1);
    expect(product.name).toBe('Existing Product');
  });
});
```

### Test Coverage

Aim for comprehensive test coverage, ensuring that all critical paths and edge cases are tested. Use coverage reports to identify untested areas.

- **Focus Areas:**
  - Core functionalities
  - Boundary conditions
  - Error handling
  - Integration points

## 5. Example: Organizing Tests for a Utility Module

Let's put everything together by organizing tests for a hypothetical utility module.

### Source Code

```typescript
// filepath: src/utils/hash.ts
export function hash(input: string): string {
  // Simple hashing implementation
  // In real scenarios, use a robust hashing algorithm
  let hashValue = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hashValue = (hashValue << 5) - hashValue + char;
    hashValue |= 0; // Convert to 32bit integer
  }
  return hashValue.toString();
}
```

### Test File

```typescript
// filepath: tests/unit/utils/hash.test.ts
import { describe, it, expect } from 'vitest';
import { hash } from '../../../src/utils/hash';

describe('hash Function', () => {
  it('should generate a consistent hash for the same input', () => {
    const input = "test";
    const hash1 = hash(input);
    const hash2 = hash(input);
    expect(hash1).toBe(hash2);
  });

  it('should generate different hashes for different inputs', () => {
    const hash1 = hash("test1");
    const hash2 = hash("test2");
    expect(hash1).not.toBe(hash2);
  });

  it('should handle empty strings', () => {
    const result = hash("");
    expect(result).toBe("0");
  });

  it('should handle special characters', () => {
    const result = hash("!@#$%^&*()");
    expect(result).not.toBe("0");
  });
});
```

### Explanation

- **Test Suite (`describe`):** Groups all tests related to the `hash` function.
- **Test Cases (`it`):**
  - **Consistency:** Ensures the same input produces the same hash.
  - **Uniqueness:** Different inputs produce different hashes.
  - **Edge Cases:** Tests how the function handles empty strings and special characters.
- **Assertions (`expect`):** Validates the expected outcomes using `toBe` and `not.toBe`.

## 6. Summary

Organizing your tests using the `describe` and `it` patterns, coupled with proper setup and teardown, enhances the readability and maintainability of your test suite. By following best practices and structuring your tests logically, you ensure that your tests effectively validate your code's functionality and reliability.

---
