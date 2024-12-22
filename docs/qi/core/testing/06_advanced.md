# Advanced Testing Techniques

As your project grows, so does the complexity of your tests. This section delves into advanced testing techniques using Vitest, enabling you to maintain a robust and efficient test suite.

## 1. Complex Mocks

Advanced mocking allows you to simulate intricate behaviors and dependencies, ensuring your tests remain isolated and reliable.

### Mocking Modules with Multiple Dependencies

When dealing with modules that have multiple dependencies, it's essential to mock each dependency accurately.

```typescript
// filepath: tests/unit/services/UserServiceAdvanced.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../../../src/services/UserService';
import { Database } from '../../../src/database';
import { EmailService } from '../../../src/email/EmailService';

// Mock the Database and EmailService modules
vi.mock('../../../src/database');
vi.mock('../../../src/email/EmailService');

describe('UserService Advanced', () => {
  let userService: UserService;
  let mockDatabase: jest.Mocked<Database>;
  let mockEmailService: jest.Mocked<EmailService>;

  beforeEach(() => {
    mockDatabase = new Database() as jest.Mocked<Database>;
    mockEmailService = new EmailService() as jest.Mocked<EmailService>;

    // Define mock implementations
    mockDatabase.saveUser.mockResolvedValue(true);
    mockEmailService.sendWelcomeEmail.mockResolvedValue(true);

    userService = new UserService(mockDatabase, mockEmailService);
  });

  it('should create a new user and send a welcome email', async () => {
    const user = { name: 'Charlie', email: 'charlie@example.com' };
    const result = await userService.createUser(user);

    expect(result).toBe(true);
    expect(mockDatabase.saveUser).toHaveBeenCalledWith(user);
    expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(user.email);
  });

  it('should handle database failures gracefully', async () => {
    mockDatabase.saveUser.mockRejectedValue(new Error('Database Error'));

    const user = { name: 'Dave', email: 'dave@example.com' };
    await expect(userService.createUser(user)).rejects.toThrow('Database Error');

    expect(mockDatabase.saveUser).toHaveBeenCalledWith(user);
    expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
  });
});
```

### Conditional Mocking Based on Test Cases

Sometimes, the behavior of mocks needs to change based on specific test conditions.

```typescript
// filepath: tests/unit/utils/conditionalMock.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchData } from '../../../src/utils/fetchData';

describe('fetchData with Conditional Mocks', () => {
  it('should return data when the API call is successful', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ data: 'Success' }), { status: 200 }));

    const data = await fetchData('/api/data');
    expect(data).toEqual({ data: 'Success' });
    expect(fetch).toHaveBeenCalledWith('/api/data');

    vi.restoreAllMocks();
  });

  it('should throw an error when the API call fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(null, { status: 500 }));

    await expect(fetchData('/api/data')).rejects.toThrow('API Error');
    expect(fetch).toHaveBeenCalledWith('/api/data');

    vi.restoreAllMocks();
  });
});
```

## 2. Nested Test Patterns

Organizing tests using nested `describe` blocks enhances readability and logical grouping.

### Structuring with Nested `describe`

```typescript
// filepath: tests/unit/controllers/UserController.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserController } from '../../../src/controllers/UserController';
import { UserService } from '../../../src/services/UserService';

vi.mock('../../../src/services/UserService');

describe('UserController', () => {
  let userController: UserController;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    mockUserService = new UserService() as jest.Mocked<UserService>;
    userController = new UserController(mockUserService);
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const user = { name: 'Eve', email: 'eve@example.com' };
      mockUserService.createUser.mockResolvedValue(true);

      const result = await userController.createUser(user);
      expect(result).toBe(true);
      expect(mockUserService.createUser).toHaveBeenCalledWith(user);
    });

    it('should handle user creation failure', async () => {
      const user = { name: 'Frank', email: 'frank@example.com' };
      mockUserService.createUser.mockRejectedValue(new Error('Creation Failed'));

      await expect(userController.createUser(user)).rejects.toThrow('Creation Failed');
      expect(mockUserService.createUser).toHaveBeenCalledWith(user);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
      const userId = 1;
      mockUserService.deleteUser.mockResolvedValue(true);

      const result = await userController.deleteUser(userId);
      expect(result).toBe(true);
      expect(mockUserService.deleteUser).toHaveBeenCalledWith(userId);
    });

    it('should handle deletion failure', async () => {
      const userId = 2;
      mockUserService.deleteUser.mockRejectedValue(new Error('Deletion Failed'));

      await expect(userController.deleteUser(userId)).rejects.toThrow('Deletion Failed');
      expect(mockUserService.deleteUser).toHaveBeenCalledWith(userId);
    });
  });
});
```

### Benefits of Nested Structures

- **Clarity:** Clearly delineates different functionalities and their respective tests.
- **Maintenance:** Easier to locate and update specific tests.
- **Scalability:** Facilitates the addition of more tests without cluttering the test suite.

## 3. Test Organization

Effective organization of test files and directories enhances maintainability and navigability.

### Best Practices for Organizing Test Files

- **Mirror Source Directory Structure:** Align your test directories with the source code structure.

```bash
my-project/
├── src/
│   ├── controllers/
│   │   └── UserController.ts
│   ├── services/
│   │   └── UserService.ts
│   └── utils/
│       └── fetchData.ts
├── tests/
│   ├── unit/
│   │   ├── controllers/
│   │   │   └── UserController.test.ts
│   │   ├── services/
│   │   │   └── UserService.test.ts
│   │   └── utils/
│   │       └── fetchData.test.ts
│   └── integration/
│       └── UserServiceIntegration.test.ts
├── package.json
└── vitest.config.ts
```

- **Naming Conventions:**
  - Use `.test.ts` or `.spec.ts` suffixes for test files.
  - Name test files after the modules they test (e.g., `UserService.test.ts`).

- **Separation of Concerns:**
  - **Unit Tests:** Test individual components in isolation.
  - **Integration Tests:** Test interactions between multiple components.
  - **End-to-End Tests:** Test the application flow from start to finish.

### Example: Organizing Tests for a Service Module

```bash
my-project/
├── src/
│   └── services/
│       └── PaymentService.ts
├── tests/
│   └── unit/
│       └── services/
│           └── PaymentService.test.ts
```

### Advantages of Structured Organization

- **Ease of Navigation:** Quickly locate tests corresponding to specific modules.
- **Consistency:** Maintains a uniform structure across the project.
- **Scalability:** Accommodates project growth without disorganization.

## 4. Performance Testing

Ensuring that your tests run efficiently is crucial for maintaining developer productivity and swift feedback loops.

### Measuring Test Performance

Vitest provides tools to measure the execution time of your tests.

```bash
vitest run --reporter=default --coverage --maxConcurrency=5
```

- **`--maxConcurrency=5`:** Limits the number of tests running in parallel to prevent resource exhaustion.
- **`--coverage`:** Generates coverage reports alongside performance metrics.

### Identifying Slow Tests

Use Vitest's built-in reporters to identify tests that take longer to execute.

```typescript
// filepath: tests/unit/performance.test.ts
import { describe, it, expect } from 'vitest';

describe('Performance Tests', () => {
  it('should complete a time-consuming operation', () => {
    const start = Date.now();
    // Simulate a long-running process
    for (let i = 0; i < 1e6; i++) {}
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100); // Adjust threshold as needed
  });
});
```

### Optimizing Slow Tests

- **Avoid Heavy Computations:** Refactor tests to eliminate unnecessary computations.
- **Use Mocks/Stubs:** Replace real implementations with mocks to reduce execution time.
- **Parallel Execution:** Utilize Vitest's concurrency features to run tests in parallel where possible.

## 5. Coverage Enhancement

Achieving comprehensive code coverage ensures that most of your codebase is tested, reducing the likelihood of undetected bugs.

### Advanced Coverage Configurations

Enhance your coverage settings in `vitest.config.ts` to include/exclude specific files and directories.

```typescript
// filepath: vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,js}'],
      exclude: ['src/**/*.spec.ts', 'tests/**', 'node_modules/**'],
      all: true, // Includes all files, even those without tests
    },
    coverageDirectory: 'coverage',
  },
});
```

### Analyzing Coverage Reports

- **Branches:** Ensure all decision points are tested.
- **Lines:** Verify that all executable lines are covered.
- **Functions:** Confirm that all functions are invoked by tests.
- **Statements:** Check that all statements execute during tests.

### Enforcing Coverage Thresholds

Prevent incomplete coverage by setting minimum coverage requirements.

```typescript
// filepath: vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html'],
      all: true,
      thresholds: {
        global: {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80,
        },
      },
    },
  },
});
```

- **Global Thresholds:** Defines minimum acceptable coverage percentages.
- **Failing Tests:** Tests will fail if coverage thresholds are not met, ensuring continuous coverage improvement.

## 6. Continuous Integration (CI) Integration

Automating your testing process within a CI pipeline ensures that tests run consistently and reliably with each code change.

### Setting Up Vitest with GitHub Actions

```yaml
# filepath: .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [14.x, 16.x, 18.x]

    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}

      - name: Install Dependencies
        run: npm install

      - name: Run Tests
        run: npm run test

      - name: Upload Coverage Report
        uses: actions/upload-artifact@v3
        with:
          name: coverage-report
          path: coverage/
```

### Benefits of CI Integration

- **Automated Testing:** Ensures tests run on every push and pull request.
- **Consistent Environments:** Tests run in standardized environments, reducing inconsistencies.
- **Immediate Feedback:** Developers receive prompt notifications on test results, facilitating quick fixes.

### Handling Test Failures in CI

Configure your CI pipeline to fail builds if tests fail or coverage thresholds are not met, maintaining code quality standards.

```yaml
- name: Run Tests with Coverage
  run: npm run test:coverage

- name: Check Coverage Thresholds
  run: npx c8 check-coverage --branches 75 --functions 80 --lines 80 --statements 80
```

## 7. Conclusion

Advanced testing techniques empower you to create a resilient and maintainable test suite. By implementing complex mocks, organizing tests efficiently, optimizing performance, enhancing coverage, and integrating with CI pipelines, you ensure that your application remains robust and reliable as it scales.

---

**Next Steps:**

Proceed to `07_mocking_deep.md` to explore deeper mocking strategies and advanced scenarios.

**Additional Resources:**

- [Vitest Advanced Features](https://vitest.dev/guide/)
- [C8 Coverage Tool Documentation](https://github.com/bcoe/c8)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

**Best Practices to Keep in Mind:**

- **Keep Tests Fast:** Optimize tests to run quickly, ensuring rapid feedback.
- **Maintain Test Clarity:** Write clear and concise tests that are easy to understand.
- **Regularly Review Coverage:** Use coverage reports to identify and address gaps.
- **Leverage CI Pipelines:** Automate testing to enforce consistency and reliability.
- **Continuously Refine Mocks:** Update mocks to reflect changes in dependencies and functionalities.

By adhering to these practices and utilizing Vitest's advanced features, you'll establish a comprehensive and efficient testing strategy that supports your project's growth and complexity.

