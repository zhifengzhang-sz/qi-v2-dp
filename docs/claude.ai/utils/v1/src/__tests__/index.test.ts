/**
 * @fileoverview
 * @module index.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-19
 * @modified 2024-11-19
 */

import {
  debounce,
  //throttle,
  merge as deepMerge,
  //isPlainObject,
  uniqBy as uniqueBy
} from 'lodash';
import {
  hash,
  formatBytes,
  truncate,
  retryOperation
} from '../index';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('Utils', () => {
  describe('hash', () => {
    it('should generate consistent SHA256 hash', () => {
      const input = 'password123';
      const expected = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f';
      expect(hash(input)).toBe(expected);
    });

    it('should generate different hashes for different inputs', () => {
      expect(hash('test1')).not.toBe(hash('test2'));
    });
  });

  describe('formatBytes', () => {
    it('should format bytes with default decimals', () => {
      expect(formatBytes(1234567)).toBe('1.18 MB');
    });

    it('should respect custom decimals', () => {
      expect(formatBytes(1234567, 1)).toBe('1.2 MB');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
    });

    it('should not truncate short strings', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });
  });

  describe('retryOperation', () => {
    beforeEach(() => {
      jest.useFakeTimers({
        legacyFakeTimers: true
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should retry failed operations', async () => {
      let attempts = 0;
      const operation = jest.fn().mockImplementation(async (): Promise<string> => {
        attempts++;
        if (attempts < 3) throw new Error('Temporary failure');
        return 'success';
      });

      const promiseResult = retryOperation(operation as () => Promise<string>, { 
        retries: 3, 
        minTimeout: 100,
      });

      // Fast-forward until all retries are done
      // Need to run timers and flush promises in sequence
      for (let i = 0; i < 3; i++) {
        await Promise.resolve(); // Let the current retry attempt execute
        jest.advanceTimersByTime(100); // Advance to the next retry
      }
      await Promise.resolve(); // Let the final attempt execute

      const result = await promiseResult;
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw after max retries', async () => {
      const operation = jest.fn().mockImplementation(async (): Promise<never> => {
        throw new Error('Permanent failure');
      });

      const promiseResult = retryOperation(operation as () => Promise<string>, { 
        retries: 2, 
        minTimeout: 100,
      });

      // Fast-forward until all retries are done
      // Need to run timers and flush promises in sequence
      for (let i = 0; i < 3; i++) {
        await Promise.resolve(); // Let the current retry attempt execute
        jest.advanceTimersByTime(100); // Advance to the next retry
      }
      await Promise.resolve(); // Let the final attempt execute

      await expect(promiseResult).rejects.toThrow('Permanent failure');
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Library function integration', () => {
    it('should debounce function calls correctly', () => {
      jest.useFakeTimers();
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();
      jest.runAllTimers();
      expect(fn).toHaveBeenCalledTimes(1);
      
      jest.useRealTimers();
    });

    it('should merge objects deeply', () => {
      const target = { a: 1, b: { x: 1 } };
      const source = { b: { y: 2 }, c: 3 };
      const expected = { a: 1, b: { x: 1, y: 2 }, c: 3 };

      expect(deepMerge(target, source)).toEqual(expected);
    });

    it('should filter unique objects by key', () => {
      const input = [
        { id: 1, name: 'John' },
        { id: 1, name: 'Johnny' },
        { id: 2, name: 'Jane' }
      ];
      const expected = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ];

      expect(uniqueBy(input, 'id')).toEqual(expected);
    });
  });
});