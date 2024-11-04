/**
 * @module utils/index
 * @description Collection of utility functions for common operations
 */

import * as crypto from 'crypto';

/**
 * Generates a SHA256 hash of the input string
 * @param input String to hash
 * @returns Hexadecimal hash string
 * 
 * @example
 * const hash = hash('password123');
 * // Returns: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'
 */
export function hash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Deep freezes an object and all its properties
 * @param obj Object to freeze
 * @returns Frozen object (readonly)
 * 
 * @example
 * const config = deepFreeze({
 *   api: { url: 'https://api.example.com', timeout: 5000 }
 * });
 * // config is now deeply immutable
 */
export function deepFreeze<T>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  Object.keys(obj).forEach(key => {
    const value = (obj as any)[key];
    if (typeof value === 'object' && value !== null) {
      deepFreeze(value);
    }
  });
  
  return Object.freeze(obj);
}

/**
 * Checks if a value is a plain object
 * @param value Value to check
 * @returns True if value is a plain object, false otherwise
 */
export function isPlainObject(value: any): boolean {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  return Object.getPrototypeOf(value) === Object.prototype;
}

/**
 * Merges two objects deeply
 * @param target Target object
 * @param source Source object
 * @returns New merged object
 * 
 * @example
 * const result = deepMerge(
 *   { a: 1, b: { x: 1 } },
 *   { b: { y: 2 }, c: 3 }
 * );
 * // Returns: { a: 1, b: { x: 1, y: 2 }, c: 3 }
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const merged = { ...target };

  for (const key in source) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
    
    const targetValue = merged[key];
    const sourceValue = source[key];

    if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
      merged[key] = deepMerge(targetValue, sourceValue ?? {});
    } else if (sourceValue !== undefined) {
      merged[key] = sourceValue;
    }
  }

  return merged;
}

/**
 * Generates a random string of specified length
 * @param length Desired string length
 * @returns Random hexadecimal string
 * 
 * @example
 * const id = randomString(16);
 * // Returns: 'a1b2c3d4e5f6g7h8'
 */
export function randomString(length: number): string {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

/**
 * Options for retry function
 */
interface RetryOptions {
  maxAttempts: number;
  delay: number;
}

/**
 * Retries a function with exponential backoff
 * @param fn Function to retry
 * @param options Retry options
 * @returns Promise resolving to function result
 * 
 * @example
 * const result = await retry(
 *   async () => await fetch('https://api.example.com'),
 *   { maxAttempts: 3, delay: 1000 }  // Retry options
 * );
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = { maxAttempts: 3, delay: 1000 }
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt === options.maxAttempts) break;
      
      await new Promise(resolve => 
        setTimeout(resolve, options.delay * Math.pow(2, attempt - 1))
      );
    }
  }

  throw lastError;
}

/**
 * Checks if a string is a valid JSON
 * @param str String to validate
 * @returns True if string is valid JSON, false otherwise
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats bytes into human readable string
 * @param bytes Number of bytes
 * @param decimals Number of decimal places
 * @returns Formatted string (e.g., '1.5 MB')
 * 
 * @example
 * const size = formatBytes(1500000);
 * // Returns: '1.43 MB'
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`;
}

/**
 * Truncates a string to a specified length with ellipsis
 * @param str String to truncate
 * @param length Maximum length
 * @returns Truncated string
 * 
 * @example
 * const text = truncate('This is a long text', 10);
 * // Returns: 'This is a...'
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Debounces a function
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 * 
 * @example
 * const debouncedSearch = debounce(
 *   (query: string) => searchAPI(query),
 *   300
 * );
 */
export function debounce<F extends (...args: any[]) => any>(
  func: F,
  wait: number
): (...args: Parameters<F>) => void {
  let timeoutId: NodeJS.Timeout | undefined;

  return function executedFunction(this: any, ...args: Parameters<F>) {
    const later = () => {
      timeoutId = undefined;
      func.apply(this, args);
    };

    clearTimeout(timeoutId);
    timeoutId = setTimeout(later, wait);
  };
}

/**
 * Throttles a function
 * @param func Function to throttle
 * @param limit Time limit in milliseconds
 * @returns Throttled function
 * 
 * @example
 * const throttledScroll = throttle(
 *   () => console.log('scrolled'),
 *   1000
 * );
 */
export function throttle<F extends (...args: any[]) => any>(
  func: F,
  limit: number
): (...args: Parameters<F>) => void {
  let inThrottle = false;
  
  return function executedFunction(this: any, ...args: Parameters<F>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Creates a unique array based on a key
 * @param arr Array to process
 * @param key Object key to use for uniqueness
 * @returns Array with unique values
 * 
 * @example
 * const users = uniqueBy(
 *   [
 *     { id: 1, name: 'John' },
 *     { id: 1, name: 'John' },
 *     { id: 2, name: 'Jane' }
 *   ],
 *   'id'
 * );
 * // Returns: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
 */
export function uniqueBy<T, K extends keyof T>(arr: T[], key: K): T[] {
  return Array.from(
    arr.reduce((map, item) => {
      const keyValue = item[key];
      if (!map.has(keyValue)) {
        map.set(keyValue, item);
      }
      return map;
    }, new Map<T[K], T>()).values()
  );
}