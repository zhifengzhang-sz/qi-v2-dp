# Axios Installation and Setup Guide

## Installation

### Using npm
```bash
npm install axios
```

### Using yarn
```bash
yarn add axios
```

### Using pnpm
```bash
pnpm add axios
```

## Additional TypeScript Types

If you're using TypeScript, the types are included with the package - no need for separate @types installation.

## Project Integration

### 1. Basic Usage
```typescript
import axios from 'axios';

// Making a GET request
const response = await axios.get('https://api.example.com/data');

// Making a POST request
const data = await axios.post('https://api.example.com/data', {
  key: 'value'
});
```

### 2. Creating an Instance
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### 3. Type Definitions
```typescript
// Response type
interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

// Request config type
interface RequestConfig {
  url?: string;
  method?: 'get' | 'post' | 'put' | 'delete';
  baseURL?: string;
  headers?: Record<string, string>;
  params?: Record<string, string | number>;
  data?: unknown;
  timeout?: number;
  timeoutErrorMessage?: string;
  withCredentials?: boolean;
}
```

## Dependencies Required in package.json

```json
{
  "dependencies": {
    "axios": "^1.6.2"  // Use latest stable version
  }
}
```

## Error Handling

```typescript
try {
  const response = await axios.get('https://api.example.com/data');
  // Handle success
} catch (error) {
  if (axios.isAxiosError(error)) {
    // Handle Axios specific errors
    console.error('Axios Error:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
  } else {
    // Handle other errors
    console.error('Error:', error);
  }
}
```

## Interceptors Setup

```typescript
// Request interceptor
axios.interceptors.request.use(
  (config) => {
    // Modify request config
    return config;
  },
  (error) => {
    // Handle request error
    return Promise.reject(error);
  }
);

// Response interceptor
axios.interceptors.response.use(
  (response) => {
    // Handle successful response
    return response;
  },
  (error) => {
    // Handle response error
    return Promise.reject(error);
  }
);
```

## Environment Setup

### .env Configuration
```env
API_BASE_URL=https://api.example.com
API_TIMEOUT=5000
```

### Configuration File (config.ts)
```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.API_BASE_URL,
  timeout: Number(process.env.API_TIMEOUT) || 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

## Recommended VSCode Extensions

- ESLint
- Prettier
- TypeScript and JavaScript Language Features

## Testing Setup

### Jest Configuration
```typescript
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

const mock = new MockAdapter(axios);

describe('API Tests', () => {
  beforeEach(() => {
    mock.reset();
  });

  it('should fetch data', async () => {
    mock.onGet('/data').reply(200, { message: 'success' });
    const response = await axios.get('/data');
    expect(response.data).toEqual({ message: 'success' });
  });
});
```

## Common Issues and Solutions

### CORS Issues
If encountering CORS errors, ensure your server allows cross-origin requests or use a proxy in development:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://api.example.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
```

### SSL Certificate Issues
For self-signed certificates in development:

```typescript
const api = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false
  })
});
```

### Timeout Issues
Configure timeouts appropriately:

```typescript
const api = axios.create({
  timeout: 5000, // 5 seconds
  timeoutErrorMessage: 'Request timed out'
});
```

## Best Practices

1. Always use type definitions for requests and responses
2. Implement proper error handling
3. Use interceptors for common operations like authentication
4. Configure reasonable timeouts
5. Use environment variables for configuration
6. Implement request cancellation for long-running requests
7. Add proper logging for debugging
8. Use mock adapters for testing

## Resources

- [Axios Documentation](https://axios-http.com/docs/intro)
- [Axios GitHub Repository](https://github.com/axios/axios)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)