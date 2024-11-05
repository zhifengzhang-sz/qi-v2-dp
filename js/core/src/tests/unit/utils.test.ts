/**
 * @module tests/unit/utils
 * @description Unit tests for utility functions
 */

import { jest } from '@jest/globals';
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
  uniqueBy,
} from "@qi/core/utils";

describe("hash", () => {
  it("should generate consistent SHA256 hashes", () => {
    const input = "test123";
    const expectedHash =
      "ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae";

    expect(hash(input)).toBe(expectedHash);
    expect(hash(input)).toBe(hash(input));
  });

  it("should generate different hashes for different inputs", () => {
    expect(hash("test1")).not.toBe(hash("test2"));
  });
});

describe("deepFreeze", () => {
  it("should freeze objects deeply", () => {
    const obj = {
      a: 1,
      b: {
        c: 2,
        d: { e: 3 },
      },
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

  it("should handle non-object values", () => {
    expect(deepFreeze(null)).toBe(null);
    expect(deepFreeze(undefined)).toBe(undefined);
    expect(deepFreeze(42)).toBe(42);
    expect(deepFreeze("test")).toBe("test");
  });
});

describe("isPlainObject", () => {
  it("should identify plain objects", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
  });

  it("should reject non-plain objects", () => {
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject(undefined)).toBe(false);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(new Date())).toBe(false);
    expect(isPlainObject(() => {})).toBe(false);
  });
});

describe("deepMerge", () => {
  it("should merge objects deeply", () => {
    const target = {
      a: 1,
      b: {
        c: 2,
        d: 3,
      },
    };

    const source = {
      b: {
        c: 2, // Add the missing property 'c'
        d: 4,
        e: 5,
      },
      f: 6,
    };

    const result = deepMerge(target, source);

    expect(result).toEqual({
      a: 1,
      b: {
        c: 2,
        d: 4,
        e: 5,
      },
      f: 6,
    });
  });

  it("should handle undefined properties", () => {
    const target = { a: 1, b: 2 };
    const source = { b: undefined, c: 3 };

    const result = deepMerge(target, source);

    expect(result).toEqual({
      a: 1,
      b: 2,
      c: 3,
    });
  });
});

describe("randomString", () => {
  it("should generate strings of specified length", () => {
    expect(randomString(10)).toHaveLength(10);
    expect(randomString(20)).toHaveLength(20);
  });

  it("should generate different strings", () => {
    const str1 = randomString(10);
    const str2 = randomString(10);
    expect(str1).not.toBe(str2);
  });
});

describe("retry", () => {
  it("should retry failed operations", async () => {
    let attempts = 0;
    const mockFn = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error("Failed attempt");
      }
      return "success";
    };

    const result = await retry(mockFn, { maxAttempts: 3, delay: 100 });
    expect(result).toBe("success");
    expect(attempts).toBe(3);
  });

  it("should throw after max attempts", async () => {
    const mockFn = async () => {
      throw new Error("Always fails");
    };

    await expect(retry(mockFn, { maxAttempts: 3, delay: 100 }))
      .rejects
      .toThrow("Always fails");
  });
});

describe("isValidJson", () => {
  it("should validate JSON strings", () => {
    expect(isValidJson("{}")).toBe(true);
    expect(isValidJson('{"a":1}')).toBe(true);
    expect(isValidJson("[1,2,3]")).toBe(true);
  });

  it("should reject invalid JSON", () => {
    expect(isValidJson("{")).toBe(false);
    expect(isValidJson("not json")).toBe(false);
    expect(isValidJson("")).toBe(false);
  });
});

describe("formatBytes", () => {
  it("should format bytes with default precision", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1.00 KB");
    expect(formatBytes(1234567)).toBe("1.18 MB");
  });

  it("should respect custom precision", () => {
    expect(formatBytes(1234567, 1)).toBe("1.2 MB");
    expect(formatBytes(1234567, 3)).toBe("1.177 MB");
  });
});

describe("truncate", () => {
  it("should truncate strings longer than specified length", () => {
    expect(truncate("Hello World", 5)).toBe("Hello...");
    expect(truncate("Testing", 10)).toBe("Testing");
  });
});

describe("debounce", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("should debounce function calls", () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, 1000);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);

    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("throttle", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("should throttle function calls", () => {
    const fn = jest.fn();
    const throttledFn = throttle(fn, 1000);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(fn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("uniqueBy", () => {
  it("should create array with unique values by key", () => {
    const input = [
      { id: 1, name: "John" },
      { id: 1, name: "John Updated" },
      { id: 2, name: "Jane" },
    ];

    const result = uniqueBy(input, "id");

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("John");
    expect(result[1].name).toBe("Jane");
  });
});
