# Deep Mocking Strategies

As applications grow in complexity, so do their dependencies. Deep mocking strategies are essential for effectively isolating and testing components that interact with intricate or multifaceted dependencies. This section delves into advanced mocking techniques using Vitest, enabling you to handle complex scenarios with ease.

## 1. Introduction to Deep Mocking

Deep mocking involves creating mocks for components that have multiple levels of dependencies or intricate internal behaviors. Unlike shallow mocks, which replace only the direct dependencies, deep mocks handle nested dependencies, allowing comprehensive isolation of the unit under test.

### Benefits of Deep Mocking

- **Comprehensive Isolation:** Ensures the unit under test is fully isolated from its dependencies.
- **Controlled Test Environment:** Allows precise control over the behavior of all dependencies.
- **Enhanced Test Reliability:** Reduces flakiness by eliminating external factors influencing test outcomes.

## 2. Mocking Classes and Their Methods More Deeply

When dealing with classes that have multiple methods or internal state, it's crucial to mock each method appropriately to simulate various scenarios.

### Example: Deep Mocking a Service Class

```typescript
// filepath: tests/unit/services/PaymentServiceDeep.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentService } from '../../../src/services/PaymentService';
import { PaymentGateway } from '../../../src/payment/PaymentGateway';

vi.mock('../../../src/payment/PaymentGateway');

describe('PaymentService Deep Mocking', () => {
  let paymentService: PaymentService;
  let mockPaymentGateway: jest.Mocked<PaymentGateway>;

  beforeEach(() => {
    mockPaymentGateway = new PaymentGateway() as jest.Mocked<PaymentGateway>;
    mockPaymentGateway.connect = vi.fn().mockResolvedValue(true);
    mockPaymentGateway.processPayment = vi.fn().mockResolvedValue('Success');

    paymentService = new PaymentService(mockPaymentGateway);
  });

  it('should process payment successfully', async () => {
    const result = await paymentService.process(100);
    expect(result).toBe('Success');
    expect(mockPaymentGateway.connect).toHaveBeenCalled();
    expect(mockPaymentGateway.processPayment).toHaveBeenCalledWith(100);
  });

  it('should handle payment gateway connection failure', async () => {
    mockPaymentGateway.connect.mockRejectedValueOnce(new Error('Connection Failed'));
    await expect(paymentService.process(100)).rejects.toThrow('Connection Failed');
    expect(mockPaymentGateway.connect).toHaveBeenCalled();
    expect(mockPaymentGateway.processPayment).not.toHaveBeenCalled();
  });
});
```

### Explanation

- **Comprehensive Mocking:** Both `connect` and `processPayment` methods of `PaymentGateway` are mocked to control their behavior.
- **Simulating Failures:** The second test case simulates a connection failure, ensuring `PaymentService` handles it gracefully.
- **Assertions:** Verifies that methods are called with expected arguments and that failures are correctly propagated.

## 3. Using Factory Functions for Mocks

Factory functions generate mock instances with predefined behaviors, promoting reusability and consistency across tests.

### Example: Mock Factory for a Repository

```typescript
// filepath: tests/unit/mocks/createMockRepository.ts
import { jest } from 'vitest';
import { UserRepository } from '../../../src/repositories/UserRepository';

export const createMockUserRepository = (): jest.Mocked<UserRepository> => {
  return {
    findUserById: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  };
};
```

```typescript
// filepath: tests/unit/services/UserServiceFactory.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { UserService } from '../../../src/services/UserService';
import { createMockUserRepository } from '../mocks/createMockRepository';

describe('UserService with Factory Mocks', () => {
  let userService: UserService;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    userService = new UserService(mockUserRepository);
  });

  it('should retrieve a user by ID', async () => {
    const user = { id: 1, name: 'Alice' };
    mockUserRepository.findUserById.mockResolvedValue(user);

    const result = await userService.getUser(1);
    expect(result).toEqual(user);
    expect(mockUserRepository.findUserById).toHaveBeenCalledWith(1);
  });

  it('should handle user not found', async () => {
    mockUserRepository.findUserById.mockResolvedValue(null);

    const result = await userService.getUser(2);
    expect(result).toBeNull();
    expect(mockUserRepository.findUserById).toHaveBeenCalledWith(2);
  });
});
```

### Explanation

- **Factory Function (`createMockUserRepository`):** Generates a mock `UserRepository` with all methods stubbed.
- **Reusability:** Ensures consistent mock behavior across multiple test cases.
- **Clarity:** Separates mock creation from test logic, enhancing readability.

## 4. Mocking with State and Side Effects

Some dependencies maintain internal state or have side effects that need to be simulated within tests. Managing these aspects ensures that tests accurately reflect real-world behaviors.

### Example: Mocking a Stateful Cache

```typescript
// filepath: tests/unit/services/CacheService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CacheService } from '../../../src/services/CacheService';
import { CacheStore } from '../../../src/cache/CacheStore';

vi.mock('../../../src/cache/CacheStore');

describe('CacheService with Stateful Mocks', () => {
  let cacheService: CacheService;
  let mockCacheStore: jest.Mocked<CacheStore>;

  beforeEach(() => {
    mockCacheStore = new CacheStore() as jest.Mocked<CacheStore>;
    mockCacheStore.get = vi.fn();
    mockCacheStore.set = vi.fn();

    cacheService = new CacheService(mockCacheStore);
  });

  it('should retrieve cached data if available', async () => {
    mockCacheStore.get.mockResolvedValue('cachedData');
    const result = await cacheService.fetchData('key1');
    expect(result).toBe('cachedData');
    expect(mockCacheStore.get).toHaveBeenCalledWith('key1');
    expect(mockCacheStore.set).not.toHaveBeenCalled();
  });

  it('should fetch and cache data if not available', async () => {
    mockCacheStore.get.mockResolvedValue(null);
    mockCacheStore.set.mockResolvedValue(true);

    const result = await cacheService.fetchData('key2');
    expect(result).toBe('fetchedData');
    expect(mockCacheStore.get).toHaveBeenCalledWith('key2');
    expect(mockCacheStore.set).toHaveBeenCalledWith('key2', 'fetchedData');
  });
});
```

### Explanation

- **Stateful Mock (`CacheStore`):** Mocks maintain an internal state to simulate cached vs. non-cached scenarios.
- **Side Effects:** The `set` method is mocked to reflect the action of caching new data.
- **Test Scenarios:** Covers both retrieval from cache and fetching & caching when data is absent.

## 5. Partial Mocking and Spies

Partial mocking allows you to mock only specific methods of a dependency while retaining the original behavior of others. Spies can track method calls without altering their implementations.

### Example: Partial Mocking with Spies

```typescript
// filepath: tests/unit/services/OrderService.spy.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderService } from '../../../src/services/OrderService';
import { PaymentGateway } from '../../../src/payment/PaymentGateway';

describe('OrderService with Partial Mocking and Spies', () => {
  let orderService: OrderService;
  let paymentGateway: PaymentGateway;

  beforeEach(() => {
    paymentGateway = new PaymentGateway();
    vi.spyOn(paymentGateway, 'processPayment').mockResolvedValue('Payment Successful');
    vi.spyOn(paymentGateway, 'refundPayment'); // No mock implementation
    orderService = new OrderService(paymentGateway);
  });

  it('should process payment and retain original refund behavior', async () => {
    const result = await orderService.placeOrder(150);
    expect(result).toBe('Payment Successful');
    expect(paymentGateway.processPayment).toHaveBeenCalledWith(150);
    expect(paymentGateway.refundPayment).not.toHaveBeenCalled();
  });

  it('should refund payment correctly', async () => {
    await orderService.cancelOrder(150);
    expect(paymentGateway.refundPayment).toHaveBeenCalledWith(150);
    // Assuming refundPayment has its original implementation or needs to be verified separately
  });
});
```

### Explanation

- **Spies (`vi.spyOn`):** Monitors calls to specific methods without changing their behavior unless explicitly mocked.
- **Partial Mocking:** Only the `processPayment` method is mocked to return a specific value, while `refundPayment` retains its original behavior.
- **Flexibility:** Allows selective control over dependency behaviors based on test requirements.

## 6. Mocking Asynchronous Functions with Complex Flows

Testing asynchronous functions that involve multiple steps or conditional flows requires precise control over mock behaviors to simulate various scenarios.

### Example: Mocking an Async Workflow

```typescript
// filepath: tests/unit/services/AsyncServiceDeep.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AsyncService } from '../../../src/services/AsyncService';
import { ExternalAPI } from '../../../src/api/ExternalAPI';

vi.mock('../../../src/api/ExternalAPI');

describe('AsyncService Deep Mocking', () => {
  let asyncService: AsyncService;
  let mockExternalAPI: jest.Mocked<ExternalAPI>;

  beforeEach(() => {
    mockExternalAPI = new ExternalAPI() as jest.Mocked<ExternalAPI>;
    mockExternalAPI.fetchData = vi.fn();
    mockExternalAPI.sendData = vi.fn();

    asyncService = new AsyncService(mockExternalAPI);
  });

  it('should fetch and send data successfully', async () => {
    mockExternalAPI.fetchData.mockResolvedValue('fetchedData');
    mockExternalAPI.sendData.mockResolvedValue('sendSuccess');

    const result = await asyncService.handleData();
    expect(result).toBe('sendSuccess');
    expect(mockExternalAPI.fetchData).toHaveBeenCalled();
    expect(mockExternalAPI.sendData).toHaveBeenCalledWith('fetchedData');
  });

  it('should handle fetchData failure', async () => {
    mockExternalAPI.fetchData.mockRejectedValue(new Error('Fetch Failed'));

    await expect(asyncService.handleData()).rejects.toThrow('Fetch Failed');
    expect(mockExternalAPI.fetchData).toHaveBeenCalled();
    expect(mockExternalAPI.sendData).not.toHaveBeenCalled();
  });

  it('should handle sendData failure', async () => {
    mockExternalAPI.fetchData.mockResolvedValue('fetchedData');
    mockExternalAPI.sendData.mockRejectedValue(new Error('Send Failed'));

    await expect(asyncService.handleData()).rejects.toThrow('Send Failed');
    expect(mockExternalAPI.fetchData).toHaveBeenCalled();
    expect(mockExternalAPI.sendData).toHaveBeenCalledWith('fetchedData');
  });
});
```

### Explanation

- **Sequential Mocking:** Mocks simulate the sequence of `fetchData` followed by `sendData`.
- **Error Simulation:** Tests both fetching and sending failures to ensure proper error handling.
- **Comprehensive Coverage:** Ensures that all potential failure points in the asynchronous workflow are tested.

## 7. Best Practices for Deep Mocking

Implementing deep mocking requires adherence to best practices to maintain test clarity and effectiveness.

### Maintain Clear Mock Definitions

- **Explicit Mocks:** Clearly define what each mock is simulating, avoiding ambiguous behaviors.
- **Documentation:** Comment mock configurations to explain their purpose within tests.

### Limit Mock Scope

- **Target Specific Dependencies:** Only mock dependencies critical to the unit under test.
- **Avoid Over-Mocking:** Refrain from mocking every dependency, which can lead to brittle tests.

### Use Factory Functions and Helpers

- **Reusable Mocks:** Utilize factory functions to create consistent mock instances across tests.
- **Helper Functions:** Abstract complex mock setups into helper functions to reduce repetition.

### Keep Tests Independent

- **Isolate Tests:** Ensure that mocks and their configurations do not leak between tests.
- **Reset Mocks:** Use lifecycle hooks to reset mocks, preventing shared states.

### Validate Mock Interactions

- **Comprehensive Assertions:** Verify that mocks are called with expected arguments and the correct number of times.
- **Behavior Verification:** Ensure that the unit under test interacts with dependencies as intended.

## 8. Conclusion

Deep mocking strategies empower you to test complex components with intricate dependencies effectively. By mastering advanced mocking techniques—such as comprehensive class mocking, factory-based mocks, stateful mocks, partial mocks, and sophisticated asynchronous mocks—you can ensure that your tests remain reliable, maintainable, and reflective of real-world scenarios. Adhering to best practices further enhances the quality and clarity of your test suites, fostering robust and scalable applications.

---

**Next Steps:**

Proceed to `08_tdd.md` to explore Test-Driven Development (TDD) practices and how to integrate them into your workflow.

**Additional Resources:**

- [Vitest Advanced Mocking](https://vitest.dev/guide/mock.html#mocking-classes)
- [Effective JavaScript Testing](https://martinfowler.com/articles/mocking.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

**Best Practices to Keep in Mind:**

- **Avoid Over-Mocking:** Only mock what is necessary to isolate the unit under test.
- **Keep Mocks Simple:** Ensure mocks do not introduce unnecessary complexity into tests.
- **Reuse Mock Configurations:** Utilize factories and helper functions to maintain consistency.
- **Regularly Review Mocks:** Update mocks to reflect changes in dependencies and functionalities.
- **Balance Mocking with Integration Testing:** Complement deep mocking with integration tests to validate interactions between components.

By implementing these strategies and adhering to best practices, you'll build a robust testing framework that scales alongside your application's complexity.

