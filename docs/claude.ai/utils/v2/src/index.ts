import {
  debounce,
  throttle,
  merge as deepMerge,
  isPlainObject,
  uniqBy as uniqueBy,
} from 'lodash-es';
import { createHash } from 'crypto';
import bytes from 'bytes';
import retry from 'retry';

export function hash(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function formatBytes(byteCount: number, decimals = 2): string {
  // Convert to human readable format
  const result = bytes.format(byteCount, {
    unitSeparator: ' ', // Use space between number and unit
    decimalPlaces: decimals,
  });
  return result;
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '...' : str;
}

export { debounce, throttle, deepMerge, isPlainObject, uniqueBy };

export async function retryOperation<T>(
  fn: () => Promise<T>,
  options = { retries: 3, minTimeout: 1000 }
): Promise<T> {
  const operation = retry.operation({
    ...options,
    randomize: false, // Make testing more predictable
  });

  return new Promise((resolve, reject) => {
    operation.attempt(async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (err) {
        if (!operation.retry(err as Error)) {
          reject(operation.mainError());
        }
      }
    });
  });
}
