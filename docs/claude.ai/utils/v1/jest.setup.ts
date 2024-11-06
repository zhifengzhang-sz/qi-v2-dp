import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, jest } from '@jest/globals';

// Enable fake timers for all tests
beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

// Clear all mocks and timers after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});
