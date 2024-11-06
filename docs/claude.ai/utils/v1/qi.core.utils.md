I'll create a complete downloadable project structure with all the files and configurations. I'll organize them in a way that makes it clear how they should be structured.



```typescript
// File: package.json
{
  "name": "utils-library",
  "version": "1.0.0",
  "description": "Utility functions with TypeScript",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint 'src/**/*.{js,ts}'",
    "format": "prettier --write 'src/**/*.{js,ts}'"
  },
  "keywords": ["utils", "typescript"],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "@types/node": "^20.11.24",
    "@typescript-eslint/eslint-plugin": "^7.1.0",
    "@typescript-eslint/parser": "^7.1.0",
    "eslint": "^8.57.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-jest": "^27.9.0",
    "jest": "^29.7.0",
    "prettier": "^3.2.5",
    "ts-jest": "^29.1.2",
    "typescript": "^5.3.3"
  }
}

// File: tsconfig.json
{
  "compilerOptions": {
    "target": "es2018",
    "module": "commonjs",
    "lib": ["es2018", "dom"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts", "**/*.spec.ts"]
}

// File: jest.config.js
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

// File: .eslintrc.json
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "jest"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:jest/recommended",
    "prettier"
  ],
  "env": {
    "node": true,
    "jest": true,
    "es6": true
  },
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "jest/no-disabled-tests": "warn",
    "jest/no-focused-tests": "error",
    "jest/no-identical-title": "error",
    "jest/prefer-to-have-length": "warn",
    "jest/valid-expect": "error"
  }
}

// File: .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}

// File: src/index.ts
import * as crypto from 'crypto';

export function hash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

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

export function isPlainObject(value: any): boolean {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  return Object.getPrototypeOf(value) === Object.prototype;
}

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

export function randomString(length: number): string {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

interface RetryOptions {
  maxAttempts: number;
  delay: number;
}

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

export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

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

// File: src/__tests__/index.test.ts
import { 
  hash,
  deepFreeze,
  isPlainObject,
  deepMerge,
  randomString,
  retry,
  isValidJson,
  formatBytes,
  truncate,
  debounce,
  throttle,
  uniqueBy
} from '../index';

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

  describe('deepFreeze', () => {
    it('should freeze nested objects', () => {
      const obj = {
        a: 1,
        b: {
          c: 2,
          d: { e: 3 }
        }
      };
      const frozen = deepFreeze(obj);
      
      expect(() => {
        (frozen as any).a = 2;
      }).toThrow();
      
      expect(() => {
        (frozen as any).b.c = 3;
      }).toThrow();
      
      expect(() => {
        (frozen as any).b.d.e = 4;
      }).toThrow();
    });

    it('should handle null values', () => {
      expect(deepFreeze(null)).toBeNull();
    });
  });

  describe('isPlainObject', () => {
    it('should identify plain objects', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ a: 1 })).toBe(true);
    });

    it('should reject non-plain objects', () => {
      expect(isPlainObject(null)).toBe(false);
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject(new Date())).toBe(false);
      expect(isPlainObject('string')).toBe(false);
    });
  });

  describe('deepMerge', () => {
    it('should merge objects deeply', () => {
      const target = { a: 1, b: { x: 1 } };
      const source = { b: { y: 2 }, c: 3 };
      const expected = { a: 1, b: { x: 1, y: 2 }, c: 3 };
      
      expect(deepMerge(target, source)).toEqual(expected);
    });

    it('should handle undefined values', () => {
      const target = { a: 1, b: 2 };
      const source = { b: undefined };
      
      expect(deepMerge(target, source)).toEqual({ a: 1, b: 2 });
    });
  });

  describe('randomString', () => {
    it('should generate string of correct length', () => {
      expect(randomString(16)).toHaveLength(16);
      expect(randomString(32)).toHaveLength(32);
    });

    it('should generate different strings', () => {
      const str1 = randomString(16);
      const str2 = randomString(16);
      expect(str1).not.toBe(str2);
    });
  });

  describe('retry', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      const fn = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) throw new Error('Fail');
        return Promise.resolve('success');
      });

      const result = await retry(fn, { maxAttempts: 3, delay: 100 });
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max attempts', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Fail'));
      
      await expect(retry(fn, { maxAttempts: 3, delay: 100 }))
        .rejects.toThrow('Fail');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('isValidJson', () => {
    it('should validate correct JSON', () => {
      expect(isValidJson('{"a":1}')).toBe(true);
      expect(isValidJson('[1,2,3]')).toBe(true);
    });

    it('should reject invalid JSON', () => {
      expect(isValidJson('{a:1}')).toBe(false);
      expect(isValidJson('invalid')).toBe(false);
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1.00 KB');
      expect(formatBytes(1234567)).toBe('1.18 MB');
    });

    it('should respect decimals parameter', () => {
      expect(formatBytes(1234567, 0)).toBe('1 MB');
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

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should debounce function calls', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 1000);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toBeCalled();

      jest.runAllTimers();

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
```