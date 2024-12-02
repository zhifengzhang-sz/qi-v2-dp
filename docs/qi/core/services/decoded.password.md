The following is explanations of the password encoding/decoding flow in detail:

1. First in `RedisConnectionHandler`, we create a connection string:
```typescript
// handlers.ts
export class RedisConnectionHandler implements RedisConnection {
  constructor(
    private config: ServiceConfig["databases"]["redis"],
    private password: string  // Raw password from env: "my@pass#123"
  ) {}

  getConnectionString(): string {
    // We must encode the password for URL because special characters like @ # would break URL format
    const encodedPassword = encodeURIComponent(this.password);
    // e.g., password "my@pass#123" becomes "my%40pass%23123"
    return `redis://default:${encodedPassword}@${this.config.host}:${this.config.port}`;
    // Results in: "redis://default:my%40pass%23123@redis:6379"
  }
}
```

2. Then in `RedisClient`, we extract and decode the password:
```typescript
// client.ts
export class RedisClient {
  constructor(config: RedisClientConfig) {
    this.client = new Redis({
      host: config.connection.getHost(),
      port: config.connection.getPort(),
      password: this.extractPassword(config.connection.getConnectionString()),
      // other options...
    });
  }

  private extractPassword(connectionString: string): string {
    // Connection string looks like: "redis://default:my%40pass%23123@redis:6379"
    try {
      // Try to extract using URL parsing
      const url = new URL(connectionString);
      if (url.password) {
        // url.password gives us "my%40pass%23123"
        return decodeURIComponent(url.password); // Returns "my@pass#123"
      }

      // Fallback to regex if URL parsing fails
      const matches = connectionString.match(/redis:\/\/:([^@]+)@/);
      if (matches && matches[1]) {
        // matches[1] gives us "my%40pass%23123"
        return decodeURIComponent(matches[1]); // Returns "my@pass#123"
      }

      throw new Error("No password found in connection string");
    } catch (error) {
      throw new ApplicationError(
        "Invalid Redis connection string",
        ErrorCode.REDIS_CONFIG_INVALID,
        500,
        { error: String(error) }
      );
    }
  }
}
```

3. In the test, we verify this behavior:
```typescript
// client.test.ts
it("should parse connection string correctly", () => {
  const config = {
    connection: {
      getConnectionString: vi.fn().mockReturnValue(
        "redis://default:my%40pass%23123@localhost:6379"
      ),
      // other methods...
    }
  };

  new RedisClient(config);

  // We expect Redis client to receive the decoded password
  expect(Redis).lastCalledWith({
    host: "localhost",
    port: 6379,
    password: "my@pass#123", // The decoded version
    // other options...
  });
});
```

Why this is necessary:

1. **URL Safety**: Special characters in passwords need to be URL-encoded because:
   - `@` is used to separate credentials from host in URLs
   - `#` is used for URL fragments
   - Other special characters might have special meaning in URLs

2. **Real Password**: Redis server expects the actual password, not the URL-encoded version, so we must decode before passing to Redis client.

Example with a complex password:
```
Original Password: p@ssw#rd!
URL-encoded: p%40ssw%23rd%21
Connection String: redis://default:p%40ssw%23rd%21@redis:6379

When connecting:
1. RedisHandler encodes: p@ssw#rd! -> p%40ssw%23rd%21
2. RedisClient decodes: p%40ssw%23rd%21 -> p@ssw#rd!
3. Redis server receives: p@ssw#rd!
```

This ensures:
- URLs are properly formatted
- Passwords with special characters work correctly
- Redis server receives the correct password
