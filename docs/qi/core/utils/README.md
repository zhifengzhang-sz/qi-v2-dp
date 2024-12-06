# Core Utilities Documentation

## Overview
The `@qi/core/utils` module provides essential utility functions for common operations, environment handling, data formatting, and enhanced error handling capabilities.

## Installation
```bash
npm install @qi/core/utils
```

## Features
- Environment file loading and parsing
- Secure cryptographic hashing
- Data formatting (bytes, JSON, truncation)
- Retry mechanisms for operations
- Lodash utility re-exports
- Color-coded JSON formatting

## API Reference

### Environment Handling

#### `loadEnv(envFile: string, options?: { override?: boolean }): Promise<Record<string, string> | null>`
Loads and parses environment variables from a file.

**Parameters:**
- `envFile`: Path to environment file
- `options`: Configuration options
  - `override`: Whether to override existing variables (default: false)

**Returns:** Parsed environment variables or null if file doesn't exist

**Example:**
```typescript
// Load without overriding existing vars
const vars = await loadEnv('.env');

// Load and override existing vars
const vars = await loadEnv('.env.local', { override: true });
```

### Cryptographic Functions

#### `hash(input: string): string`
Creates a SHA-256 hash of the input string.

**Parameters:**
- `input`: String to hash

**Returns:** Hexadecimal hash string

**Example:**
```typescript
const hashedPassword = hash('user-password');
```

### Data Formatting

#### `formatBytes(byteCount: number, decimals?: number): string`
Formats byte sizes into human-readable strings.

**Parameters:**
- `byteCount`: Number of bytes
- `decimals`: Number of decimal places (default: 2)

**Returns:** Formatted string with units (e.g., "1.5 MB")

**Example:**
```typescript
console.log(formatBytes(1536)); // "1.5 KB"
console.log(formatBytes(1048576, 1)); // "1.0 MB"
```

#### `truncate(str: string, length: number): string`
Truncates a string to specified length, adding ellipsis if needed.

**Parameters:**
- `str`: String to truncate
- `length`: Maximum length

**Returns:** Truncated string with ellipsis if needed

**Example:**
```typescript
console.log(truncate("Long text here", 8)); // "Long ..."
```

#### `formatJsonWithColor(obj: unknown): string`
Formats a JSON object with color-coded syntax highlighting.

**Color scheme:**
- Blue: Property keys
- Green: String values
- Yellow: Numbers, booleans, null
- White: Structural characters

**Parameters:**
- `obj`: Object to format

**Returns:** Color-formatted JSON string

**Example:**
```typescript
console.log(formatJsonWithColor({
  name: "test",
  count: 42,
  active: true
}));
```

### Operation Retrying

#### `retryOperation<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>`
Retries an asynchronous operation with exponential backoff.

**Parameters:**
- `fn`: Async function to retry
- `options`: Retry configuration
  - `retries`: Maximum number of attempts (default: 3)
  - `minTimeout`: Initial timeout in milliseconds (default: 1000)
  - `onRetry`: Optional callback function called on each retry

**Returns:** Promise resolving to function result

**Example:**
```typescript
const data = await retryOperation(
  () => fetchData(),
  { 
    retries: 3, 
    minTimeout: 1000,
    onRetry: (attempts) => console.log(`Retry attempt ${attempts}`)
  }
);
```

### Re-exported Lodash Utilities

The following utilities are re-exported from lodash-es:

#### `debounce(func: Function, wait?: number, options?: DebounceOptions)`
Creates a debounced function that delays invoking `func` until after `wait` milliseconds.

#### `throttle(func: Function, wait?: number, options?: ThrottleOptions)`
Creates a throttled function that only invokes `func` at most once per every `wait` milliseconds.

#### `deepMerge(...objects: any[])`
Recursively merges own and inherited enumerable string keyed properties of source objects into the destination object.

#### `isPlainObject(value: any)`
Checks if `value` is a plain object.

#### `uniqueBy(array: Array, iteratee: Function)`
Creates a duplicate-free version of an array based on the provided iteratee function.

## Error Handling

### File Not Found Handling
The module includes internal handling for missing files through the `orIfFileNotExist` function, which gracefully handles ENOENT and ENOTDIR errors.

### Environment File Parsing
The `parseEnvFile` function handles:
- Comments (lines starting with #)
- Empty lines
- Quoted values
- Key-value pairs with = separator

## Best Practices

### Environment Loading
1. Always use `loadEnv` with error handling:
```typescript
try {
  const env = await loadEnv('.env');
  if (!env) {
    console.warn('Environment file not found');
  }
} catch (error) {
  console.error('Failed to load environment:', error);
}
```

### Retry Operations
1. Set appropriate retry limits and timeouts:
```typescript
const result = await retryOperation(
  async () => {
    // Operation that might fail
  },
  {
    retries: 3,
    minTimeout: 1000,
    onRetry: (attempt) => {
      console.log(`Retry attempt ${attempt}`);
    }
  }
);
```

2. Consider using with exponential backoff for external services:
```typescript
const backoffOptions = {
  retries: 5,
  minTimeout: 1000, // Starts at 1 second
  onRetry: (attempt) => {
    console.log(`Retrying after ${Math.pow(2, attempt)} seconds`);
  }
};
```

### Data Formatting
1. Use appropriate decimal places for byte formatting:
```typescript
// For file sizes
console.log(formatBytes(fileSize, 2));

// For network speeds
console.log(formatBytes(bytesPerSecond, 1));
```

2. Consider context when truncating:
```typescript
// For display
const displayTitle = truncate(title, 50);

// For logging
const loggedContent = truncate(content, 200);
```

## Common Patterns

### Configuration Loading
```typescript
async function loadConfig() {
  // Load environment variables
  const env = await loadEnv('.env');
  
  // Load specific config based on environment
  const configFile = process.env.NODE_ENV === 'production' 
    ? '.env.production' 
    : '.env.development';
    
  await loadEnv(configFile, { override: true });
}
```

### Retry with Logging
```typescript
async function fetchWithRetry<T>(url: string): Promise<T> {
  return retryOperation(
    async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return response.json();
    },
    {
      retries: 3,
      minTimeout: 1000,
      onRetry: (attempt) => {
        console.log(`Retry ${attempt} for ${url}`);
      }
    }
  );
}
```

## TypeScript Support
The module is written in TypeScript and provides full type definitions. All functions and interfaces are properly typed for maximum IDE support and compile-time type checking.