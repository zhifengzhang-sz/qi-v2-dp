# Data Platform Architecture Design

## 1. Core Infrastructure (`qi/core/src/`)

### 1.1 Network Layer (`networks/`)
Handles low-level network communication:

```
networks/
├── http/                    # HTTP client implementation
│   ├── client.ts           # Base HTTP client
│   ├── types.ts            # HTTP types
│   └── errors.ts           # HTTP specific errors
│
└── websocket/              # WebSocket implementation
    ├── client.ts           # Base WebSocket client
    ├── types.ts            # WebSocket types
    └── errors.ts           # WebSocket specific errors
```

Similar to services, provides base implementations:

```typescript
// networks/http/client.ts
export class HttpClient {
    constructor(config: HttpConfig) {}
    
    async get<T>(url: string, config?: RequestConfig): Promise<T>
    async post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>
    async put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>
    async delete<T>(url: string, config?: RequestConfig): Promise<T>
}

// networks/websocket/client.ts
export class WebSocketClient {
    constructor(config: WebSocketConfig) {}
    
    connect(url: string): Promise<void>
    subscribe(channel: string, handler: MessageHandler): void
    unsubscribe(channel: string): void
    send(data: unknown): Promise<void>
    close(): Promise<void>
}
```

### 1.2 Services Layer (`services/`)
Handles infrastructure service connections:

```
services/
├── timescaledb/            # TimescaleDB service
│   └── index.ts            # TimescaleDB client
├── redpanda/               # RedPanda service
│   └── index.ts            # RedPanda client
├── redis/                  # Redis service
│   └── index.ts            # Redis client
└── base/                   # Base service types
    ├── client.ts
    ├── types.ts
    └── errors.ts
```

### 1.3 Other Core Modules
- `config/`: Configuration management
- `errors/`: Error handling
- `logger/`: Structured logging
- `cache/`: Caching system
- `utils/`: Common utilities

## 2. Data Platform Structure (`qi/core/src/data/`)

### 2.1 Models Layer (`models/`)
Pure data structures and types:

```
models/
├── base/                   # Base interfaces
├── sources/               # Source-specific models
└── storage/              # Storage model definitions
```

### 2.2 Sources Layer (`sources/`)
Uses core network layer for external communication:

```typescript
// sources/cryptocompare/rest/client.ts
import { HttpClient } from '@qi/core/networks/http';

export class CryptoCompareRestClient {
    constructor(
        private readonly httpClient: HttpClient,
        private readonly config: CryptoCompareConfig
    ) {}

    async fetchOHLCV(symbol: string): Promise<CryptoCompareOHLCVData> {
        return this.httpClient.get<CryptoCompareOHLCVData>(
            `/data/v2/histominute`,
            { params: { symbol } }
        );
    }
}

// sources/cryptocompare/ws/client.ts
import { WebSocketClient } from '@qi/core/networks/websocket';

export class CryptoCompareWSClient {
    constructor(
        private readonly wsClient: WebSocketClient,
        private readonly config: CryptoCompareConfig
    ) {}

    async subscribeTickers(symbols: string[]): Promise<void> {
        await this.wsClient.connect(this.config.wsUrl);
        await this.wsClient.subscribe('tickers', {
            symbols,
            handler: this.handleTickerMessage
        });
    }
}
```

### 2.3 Repositories Layer (`repositories/`)
Uses core services layer for data persistence:

```typescript
// repositories/timescaledb/cryptocompare/ohlcv.ts
import { TimescaleDBService } from '@qi/core/services/timescaledb';

export class CryptoCompareOHLCVRepository {
    constructor(private readonly db: TimescaleDBService) {}
}

// repositories/redpanda/cryptocompare/producer.ts
import { RedPandaService } from '@qi/core/services/redpanda';

export class CryptoCompareProducer {
    constructor(private readonly messageQueue: RedPandaService) {}
}
```

## 3. Layer Interactions

### Network to Source Layer
```typescript
// Example of using HTTP client in source
const httpClient = new HttpClient(config);
const marketDataClient = new CryptoCompareRestClient(httpClient, config);
const data = await marketDataClient.fetchOHLCV('BTC-USD');
```

### Service to Repository Layer
```typescript
// Example of using TimescaleDB service in repository
const dbService = new TimescaleDBService(config);
const repository = new CryptoCompareOHLCVRepository(dbService);
await repository.save(data);
```

## 4. Key Responsibilities

### Network Layer (`qi/core/src/networks/`)
✅ DOES:
- Provide base HTTP client
- Provide base WebSocket client
- Handle low-level communication
- Manage connections
- Handle retries and timeouts
- Provide error handling

❌ DOES NOT:
- Handle business logic
- Transform data
- Know about specific APIs

### Services Layer (`qi/core/src/services/`)
✅ DOES:
- Manage infrastructure connections
- Handle service health checks
- Provide connection pooling
- Handle service-specific features

❌ DOES NOT:
- Handle business logic
- Know about specific data models
- Handle API communication

Next steps:
1. Implementations of the network layer for HTTP/WebSocket
2. Elaborate on specific interactions between layers
3. Finalizing the data/models, in particular making sure Sequelize models are in place
4. Implement the sources module, currently, we only consider cryptocompare, the implementation uses core network layer (core/networks) for external communication
4. Implement repository layer, including sequelize migrations and kafka produce/consumer, the implementation uses core services layer (core/services) for services communication
5. Set up integration tests
6. Add monitoring and metrics
7. Implement real-time processing