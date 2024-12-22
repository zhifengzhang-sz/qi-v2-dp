# State Management in Tests

Managing state within your tests is essential for ensuring that each test runs in a controlled and predictable environment. Proper state management helps maintain test isolation, preventing tests from affecting each other and ensuring consistent results.

## 1. Environment State

Environment state includes any global variables or configurations that your application relies on. Managing environment state ensures that tests run with the correct settings and do not interfere with each other.

### Process Environment

Handling environment variables is crucial, especially when your application behavior changes based on different environments (e.g., development, testing, production).

```typescript
// filepath: tests/unit/utils/env.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadEnv } from '../../src/utils/env';

describe('Environment Variables', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Clone the original environment to prevent mutations
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore the original environment after each test
    process.env = originalEnv;
  });

  it('should load environment variables from a file', async () => {
    process.env.CONFIG_PATH = 'test.env';
    const config = await loadEnv(process.env.CONFIG_PATH);
    expect(config.TEST_VAR).toBe('test_value');
  });

  it('should handle missing environment variables gracefully', async () => {
    delete process.env.CONFIG_PATH;
    await expect(loadEnv(process.env.CONFIG_PATH)).rejects.toThrow('CONFIG_PATH is not defined');
  });
});
```

### Explanation

- **Cloning `process.env`:** Before each test, clone the original environment to ensure tests do not mutate global state.
- **Restoring `process.env`:** After each test, restore the original environment to maintain isolation.
- **Testing Scenarios:** Tests cover loading environment variables and handling missing configurations.

## 2. Component State

Component state refers to the state within individual components or instances of classes. Managing component state ensures that each test starts with a fresh instance, preventing state leakage between tests.

### Instance Management

Properly initializing and resetting instances before each test ensures that tests remain independent and do not interfere with one another.

```typescript
// filepath: tests/unit/services/UserService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { UserService } from '../../src/services/UserService';
import { Database } from '../../src/database';

describe('UserService', () => {
  let userService: UserService;
  let mockDatabase: Database;

  beforeEach(() => {
    // Initialize a new mock database instance before each test
    mockDatabase = new Database();
    mockDatabase.connect = vi.fn().mockResolvedValue(true);
    mockDatabase.saveUser = vi.fn().mockResolvedValue(true);

    // Initialize the UserService with the mock database
    userService = new UserService(mockDatabase);
  });

  it('should create a new user successfully', async () => {
    const user = { name: 'Alice' };
    const result = await userService.createUser(user);
    expect(result).toBe(true);
    expect(mockDatabase.saveUser).toHaveBeenCalledWith(user);
  });

  it('should handle database connection failure', async () => {
    // Mock database connection to fail
    mockDatabase.connect = vi.fn().mockRejectedValue(new Error('Connection Failed'));
    await expect(userService.createUser({ name: 'Bob' })).rejects.toThrow('Connection Failed');
    expect(mockDatabase.saveUser).not.toHaveBeenCalled();
  });
});
```

### Explanation

- **Fresh Instances:** A new `Database` and `UserService` instance are created before each test to ensure no shared state.
- **Mock Implementations:** Mock methods are reset and redefined as needed for each test scenario.
- **Test Isolation:** Tests verify both successful operations and error handling without affecting each other.

## 3. Mock State Reset

Ensuring that mocks do not retain state between tests is vital for maintaining test isolation. Vitest provides methods to reset and restore mocks effectively.

### Reset Patterns

Use lifecycle hooks to reset mocks before or after tests to prevent carry-over of mock states.

```typescript
// filepath: tests/unit/services/OrderService.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OrderService } from '../../src/services/OrderService';
import { PaymentGateway } from '../../src/payment/PaymentGateway';

vi.mock('../../src/payment/PaymentGateway');

describe('OrderService', () => {
  let orderService: OrderService;
  let mockPaymentGateway: PaymentGateway;

  beforeEach(() => {
    mockPaymentGateway = new PaymentGateway();
    mockPaymentGateway.processPayment = vi.fn().mockResolvedValue(true);
    orderService = new OrderService(mockPaymentGateway);
  });

  afterEach(() => {
    // Restore all mocks to their original implementations
    vi.restoreAllMocks();
  });

  it('should process payment successfully', async () => {
    const result = await orderService.placeOrder({ amount: 100 });
    expect(result).toBe(true);
    expect(mockPaymentGateway.processPayment).toHaveBeenCalledWith(100);
  });

  it('should handle payment failure', async () => {
    mockPaymentGateway.processPayment = vi.fn().mockRejectedValue(new Error('Payment Declined'));
    await expect(orderService.placeOrder({ amount: 200 })).rejects.toThrow('Payment Declined');
    expect(mockPaymentGateway.processPayment).toHaveBeenCalledWith(200);
  });
});
```

### Explanation

- **`beforeEach`:** Initializes fresh mock instances before each test.
- **`afterEach`:** Restores all mocks to their original state after each test to ensure no residual mock behavior affects subsequent tests.
- **Consistent Mocking:** Each test defines its own mock behavior, ensuring tests are predictable and isolated.

## 4. Best Practices for State Management

Adhering to best practices in state management enhances test reliability and maintainability.

### Test Isolation

Ensure that each test runs independently without relying on the outcomes or states of other tests.

- **Avoid Shared State:** Do not use shared variables that persist across tests.
- **Reset Mocks:** Always reset or restore mocks to prevent leakage of mock states.
- **Use Fresh Instances:** Initialize new instances of classes or components within `beforeEach` hooks.

### Controlled Environment

Maintain a controlled testing environment to ensure consistency and repeatability.

- **Set Environment Variables:** Define necessary environment variables within tests or setup files.
- **Mock External Dependencies:** Replace external services or APIs with mocks to avoid reliance on external systems.
- **Configure Setup Files:** Use setup files to configure global test settings and initializations.

### Minimal Side Effects

Design tests to have minimal side effects to prevent unexpected behaviors.

- **Clean Up After Tests:** Use `afterEach` hooks to clean up any changes made during tests.
- **Avoid Global Mutations:** Refrain from modifying global objects or states within tests.
- **Use Dependency Injection:** Inject dependencies into classes or functions to facilitate easier mocking and state management.

## 5. Example: Managing State in a Service Class

Let's apply state management best practices to a service class that depends on external modules.

### Source Code

```typescript
// filepath: src/services/NotificationService.ts
export class NotificationService {
  private emailClient: EmailClient;

  constructor(emailClient: EmailClient) {
    this.emailClient = emailClient;
  }

  async sendWelcomeEmail(user: { email: string; name: string }): Promise<boolean> {
    const message = `Welcome, ${user.name}!`;
    return this.emailClient.sendEmail(user.email, 'Welcome', message);
  }
}
```

### Test File

```typescript
// filepath: tests/unit/services/NotificationService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from '../../../src/services/NotificationService';
import { EmailClient } from '../../../src/email/EmailClient';

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockEmailClient: EmailClient;

  beforeEach(() => {
    mockEmailClient = new EmailClient();
    mockEmailClient.sendEmail = vi.fn().mockResolvedValue(true);
    notificationService = new NotificationService(mockEmailClient);
  });

  it('should send a welcome email successfully', async () => {
    const user = { email: 'user@example.com', name: 'Alice' };
    const result = await notificationService.sendWelcomeEmail(user);
    expect(result).toBe(true);
    expect(mockEmailClient.sendEmail).toHaveBeenCalledWith(
      'user@example.com',
      'Welcome',
      'Welcome, Alice!'
    );
  });

  it('should handle email sending failure', async () => {
    mockEmailClient.sendEmail = vi.fn().mockResolvedValue(false);
    const user = { email: 'user@example.com', name: 'Bob' };
    const result = await notificationService.sendWelcomeEmail(user);
    expect(result).toBe(false);
    expect(mockEmailClient.sendEmail).toHaveBeenCalledWith(
      'user@example.com',
      'Welcome',
      'Welcome, Bob!'
    );
  });
});
```

### Explanation

- **Mock Instances:** A new `EmailClient` mock is created before each test to ensure no shared state.
- **Mock Implementations:** The `sendEmail` method is mocked to return desired outcomes based on test scenarios.
- **Assertions:** Tests verify both successful email sending and handling of failures.
- **Isolation:** Each test runs with a fresh `NotificationService` instance, ensuring independence.

## 6. Summary

Effective state management in tests ensures that each test runs in a predictable and isolated environment. By managing environment state, component state, and mock states appropriately, you maintain test reliability and prevent flaky tests. Adhering to best practices in state management enhances the maintainability and scalability of your test suite.
