## Lessons learned in testing

### From `qi/tests/unit/services/timescaledb/client.test.ts`

The key issue was indeed the retry functionality causing timeouts. By mocking the retry utility, we avoided the actual delays while still testing the error handling behavior.

Some key takeaways from this exercise:

1. Always mock time-based operations in tests to avoid timeouts and make tests run faster
2. Keep mocks as simple as possible - we just needed basic mock functions at module level
3. Remember to mock all dependencies, including utilities like retry operations
4. Clear mocks before each test to ensure test isolation
