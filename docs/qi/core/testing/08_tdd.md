# Test-Driven Development (TDD)

Test-Driven Development (TDD) is a software development methodology that emphasizes writing tests before writing the corresponding production code. By following TDD, developers can ensure that their code meets the desired specifications and behaves as expected from the outset.

## 1. Introduction to TDD

TDD revolves around a short, repetitive development cycle known as the "Red-Green-Refactor" loop:

1. **Red:** Write a failing test that defines the desired functionality.
2. **Green:** Write the minimal amount of code needed to make the test pass.
3. **Refactor:** Clean up the code, ensuring it remains efficient and maintainable without altering its behavior.

### Benefits of TDD

- **Improved Code Quality:** Ensures that all new code is tested from the start.
- **Better Design:** Encourages developers to write modular and loosely coupled code.
- **Faster Debugging:** Identifies issues early in the development process.
- **Comprehensive Documentation:** Tests serve as documentation for the codebase.

## 2. TDD Workflow

Implementing TDD involves adhering to a structured workflow that guides the development process.

### Step 1: Write a Failing Test (Red)

Begin by writing a test that specifies a new feature or functionality. Since the feature isn't implemented yet, the test should fail.

```typescript
// filepath: tests/unit/services/AuthService.test.ts
import { describe, it, expect } from 'vitest';
import { AuthService } from '../../../src/services/AuthService';

describe('AuthService', () => {
  it('should register a new user successfully', async () => {
    const authService = new AuthService();
    const user = { username: 'john_doe', password: 'password123' };
    const result = await authService.register(user);
    expect(result).toBe(true);
  });
});
```

### Step 2: Write Minimal Code to Pass the Test (Green)

Implement the simplest possible code to make the failing test pass.

```typescript
// filepath: src/services/AuthService.ts
export class AuthService {
  async register(user: { username: string; password: string }): Promise<boolean> {
    // Minimal implementation to pass the test
    return true;
  }
}
```

### Step 3: Refactor the Code

Improve the code structure and eliminate any redundancies while ensuring all tests still pass.

```typescript
// filepath: src/services/AuthService.ts
import { UserRepository } from '../repositories/UserRepository';

export class AuthService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  async register(user: { username: string; password: string }): Promise<boolean> {
    const exists = await this.userRepository.findByUsername(user.username);
    if (exists) {
      throw new Error('User already exists');
    }
    await this.userRepository.create(user);
    return true;
  }
}
```

## 3. Practical Example: Implementing User Registration

Let's walk through a complete TDD cycle by implementing a user registration feature.

### Step 1: Write the Failing Test

Define what the `register` method should achieve, including handling duplicate users.

```typescript
// filepath: tests/unit/services/AuthService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { AuthService } from '../../../src/services/AuthService';
import { UserRepository } from '../../../src/repositories/UserRepository';

describe('AuthService', () => {
  it('should register a new user successfully', async () => {
    const mockUserRepository = vi.fn().mockReturnValue({
      findByUsername: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(true),
    });
    const authService = new AuthService(new (mockUserRepository as any)());
    const user = { username: 'john_doe', password: 'password123' };
    const result = await authService.register(user);
    expect(result).toBe(true);
  });

  it('should throw an error if the user already exists', async () => {
    const mockUserRepository = vi.fn().mockReturnValue({
      findByUsername: vi.fn().mockResolvedValue({ username: 'john_doe' }),
      create: vi.fn(),
    });
    const authService = new AuthService(new (mockUserRepository as any)());
    const user = { username: 'john_doe', password: 'password123' };
    await expect(authService.register(user)).rejects.toThrow('User already exists');
  });
});
```

### Step 2: Write Minimal Code to Pass the Tests

Implement the `AuthService` to satisfy both test cases.

```typescript
// filepath: src/services/AuthService.ts
import { UserRepository } from '../repositories/UserRepository';

export class AuthService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async register(user: { username: string; password: string }): Promise<boolean> {
    const existingUser = await this.userRepository.findByUsername(user.username);
    if (existingUser) {
      throw new Error('User already exists');
    }
    await this.userRepository.create(user);
    return true;
  }
}
```

### Step 3: Refactor the Code

Improve the code by handling additional edge cases and optimizing logic.

```typescript
// filepath: src/services/AuthService.ts
import { UserRepository } from '../repositories/UserRepository';
import bcrypt from 'bcrypt';

export class AuthService {
  private userRepository: UserRepository;
  private saltRounds: number = 10;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async register(user: { username: string; password: string }): Promise<boolean> {
    const existingUser = await this.userRepository.findByUsername(user.username);
    if (existingUser) {
      throw new Error('User already exists');
    }
    const hashedPassword = await bcrypt.hash(user.password, this.saltRounds);
    await this.userRepository.create({ ...user, password: hashedPassword });
    return true;
  }
}
```

### Updated Tests to Reflect Refactored Code

Ensure that the existing tests still pass after refactoring.

```typescript
// filepath: tests/unit/services/AuthService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { AuthService } from '../../../src/services/AuthService';
import { UserRepository } from '../../../src/repositories/UserRepository';
import bcrypt from 'bcrypt';

vi.mock('bcrypt', () => ({
  hash: vi.fn().mockResolvedValue('hashedPassword123'),
}));

describe('AuthService', () => {
  it('should register a new user successfully', async () => {
    const mockUserRepository = {
      findByUsername: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(true),
    };
    const authService = new AuthService(mockUserRepository as any);
    const user = { username: 'john_doe', password: 'password123' };
    const result = await authService.register(user);
    expect(result).toBe(true);
    expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('john_doe');
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(mockUserRepository.create).toHaveBeenCalledWith({
      username: 'john_doe',
      password: 'hashedPassword123',
    });
  });

  it('should throw an error if the user already exists', async () => {
    const mockUserRepository = {
      findByUsername: vi.fn().mockResolvedValue({ username: 'john_doe' }),
      create: vi.fn(),
    };
    const authService = new AuthService(mockUserRepository as any);
    const user = { username: 'john_doe', password: 'password123' };
    await expect(authService.register(user)).rejects.toThrow('User already exists');
    expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('john_doe');
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(mockUserRepository.create).not.toHaveBeenCalled();
  });
});
```

## 4. TDD Best Practices

Adhering to best practices ensures that TDD remains effective and efficient.

### Write Small, Focused Tests

- **Single Responsibility:** Each test should verify a single behavior or functionality.
- **Clear Purpose:** Tests should be easy to understand, indicating what aspect of the code they are validating.

### Keep Tests Fast

- **Avoid Heavy Computations:** Ensure that tests run quickly to maintain rapid feedback loops.
- **Use Mocks Appropriately:** Replace slow dependencies with mocks to speed up tests.

### Maintain Test Independence

- **Isolate Tests:** Ensure that tests do not depend on each other and can run in any order.
- **Reset Mocks and State:** Use lifecycle hooks to reset mocks and state before each test.

### Refactor Tests Alongside Production Code

- **Consistent Maintenance:** Keep tests updated as production code evolves to prevent false positives or negatives.
- **Improve Readability:** Refactor tests to enhance clarity without altering their intent.

## 5. Integrating TDD with Existing Codebases

Implementing TDD in established projects requires careful planning to avoid disruption.

### Start with Critical Components

- **Prioritize High-Risk Areas:** Begin writing tests for parts of the application that are complex or prone to bugs.
- **Incremental Adoption:** Gradually integrate TDD practices into the development workflow.

### Refactor Legacy Code with Tests

- **Characterization Tests:** Write tests to capture the current behavior of legacy code before making changes.
- **Safe Refactoring:** Ensures that refactoring does not introduce regressions.

### Educate the Team

- **Training Sessions:** Conduct workshops or training to familiarize the team with TDD principles.
- **Pair Programming:** Encourage collaboration to reinforce TDD practices.

## 6. Conclusion

Test-Driven Development is a powerful methodology that enhances code quality, reliability, and maintainability. By writing tests before production code, developers can ensure that their applications behave as intended, handle edge cases gracefully, and remain robust against future changes. Adhering to TDD best practices and integrating it thoughtfully into existing workflows can significantly improve the development process and the overall quality of the software.

---

**Next Steps:**

Proceed to `09_integration.md` to explore Integration Testing techniques and how they complement unit tests in ensuring application reliability.

**Additional Resources:**

- [Official TDD Guide](https://www.agilealliance.org/glossary/tdd-test-driven-development/)
- [Vitest Documentation](https://vitest.dev/)
- [Effective TypeScript Testing](https://basarat.gitbook.io/typescript/testing)

**Best Practices to Keep in Mind:**

- **Embrace the Red-Green-Refactor Cycle:** Strictly follow the TDD cycle to maintain discipline and consistency.
- **Write Descriptive Test Names:** Clearly indicate what each test is verifying to enhance readability.
- **Avoid Overly Complex Tests:** Keep tests simple and focused to prevent unnecessary complexity.
- **Leverage Continuous Feedback:** Utilize tools and integrations that provide immediate feedback on test results.
- **Commit Tests with Code:** Ensure that tests are part of the codebase and evolve alongside production code.

By integrating TDD into your development workflow and following these best practices, you'll foster a culture of quality and accountability, leading to more robust and maintainable applications.
