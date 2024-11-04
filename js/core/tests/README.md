# Qi Core Tests

This directory contains unit and integration tests for the Qi core module.

## Structure

```
tests/
├── unit/               # Unit tests
│   ├── utils.test.ts      # Utility function tests
│   ├── errors.test.ts     # Error class tests
│   └── env.validator.test.ts  # Environment validator tests
├── integration/       # Integration tests
│   ├── database.test.ts   # Database model tests
│   └── redis.test.ts      # Redis cache tests
├── jest.config.js    # Jest configuration
├── jest.setup.ts     # Test setup file
└── README.md         # This file
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm test -- --coverage
```

## Configuration

The tests use a separate test configuration defined in `.env.test`. Ensure this file exists with the following variables:

```env
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qi_test
DB_USER=postgres
DB_PASSWORD=postgres
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Writing Tests

### Unit Tests

Unit tests should:
- Test individual functions and classes
- Mock external dependencies
- Focus on logic and edge cases

Example:
```typescript
describe('utils/hash', () => {
  it('should generate consistent hashes', () => {
    const input = 'test';
    expect(hash(input)).toBe(hash(input));
  });
});
```

### Integration Tests

Integration tests should:
- Test interactions between components
- Use real databases (test instances)
- Verify data persistence and retrieval

Example:
```typescript
describe('Market Model', () => {
  it('should create and retrieve a market', async () => {
    const market = await Market.create({
      name: 'Test Market',
      isActive: true
    });

    const found = await Market.findByPk(market.id);
    expect(found?.name).toBe('Test Market');
  });
});
```

## Best Practices

1. **Test Organization**
   - Group related tests using `describe`
   - Use clear, descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)

2. **Database Tests**
   - Clean database before each test
   - Use transactions when possible
   - Test model validations and constraints

3. **Redis Tests**
   - Clear cache before each test
   - Test TTL functionality
   - Verify data persistence

4. **Error Handling**
   - Test error cases explicitly
   - Verify error types and messages
   - Test boundary conditions

## Coverage Requirements

The project maintains minimum coverage requirements:

- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

## Continuous Integration

Tests are run automatically on:
- Pull requests
- Merges to main branch
- Release tags

## Troubleshooting

Common issues:

1. **Database Connection Failed**
   - Verify test database exists
   - Check database credentials
   - Ensure database service is running

2. **Redis Connection Failed**
   - Verify Redis server is running
   - Check Redis port configuration
   - Ensure no conflicting Redis instances

3. **Test Timeouts**
   - Increase timeout in `jest.config.js`
   - Check for hanging promises
   - Verify cleanup in `afterEach`/`afterAll`

## Contributing

When adding new tests:

1. Follow existing file structure
2. Add to relevant test suite
3. Update README if needed
4. Verify all tests pass
5. Check coverage report