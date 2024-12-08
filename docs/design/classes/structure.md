Let's create a comprehensive directory structure that organizes all components clearly.



```typescript
qi/
├── core/
│   ├── src/
│   │   ├── data/
│   │   │   ├── models/                    # Data models
│   │   │   │   ├── base/                  # Base type definitions
│   │   │   │   │   └── types.ts
│   │   │   │   ├── sources/              # Source-specific types
│   │   │   │   │   └── cryptocompare/
│   │   │   │   │       ├── ohlcv.ts
│   │   │   │   │       ├── trades.ts
│   │   │   │   │       └── types.ts
│   │   │   │   └── storage/              # Storage models (DB/Queue)
│   │   │   │       ├── sequelize/
│   │   │   │       │   └── cryptocompare/
│   │   │   │       │       ├── ohlcv.ts
│   │   │   │       │       └── trades.ts
│   │   │   │       └── avro/
│   │   │   │           └── cryptocompare/
│   │   │   │               ├── ohlcv.avsc
│   │   │   │               └── trades.avsc
│   │   │   │
│   │   │   ├── access/                   # Data access layer
│   │   │   │   ├── http/                 # HTTP client
│   │   │   │   │   ├── client.ts
│   │   │   │   │   └── types.ts
│   │   │   │   ├── websocket/           # WebSocket base
│   │   │   │   │   ├── client.ts
│   │   │   │   │   └── types.ts
│   │   │   │   ├── queue/               # Queue access
│   │   │   │   │   ├── producer.ts
│   │   │   │   │   ├── consumer.ts
│   │   │   │   │   └── types.ts
│   │   │   │   └── db/                  # Database access
│   │   │   │       ├── repository.ts
│   │   │   │       └── types.ts
│   │   │   │
│   │   │   ├── sources/                 # Data source implementations
│   │   │   │   └── cryptocompare/
│   │   │   │       ├── rest/
│   │   │   │       │   ├── client.ts
│   │   │   │       │   └── types.ts
│   │   │   │       ├── ws/
│   │   │   │       │   ├── client.ts
│   │   │   │       │   └── types.ts
│   │   │   │       └── index.ts
│   │   │   │
│   │   │   └── repositories/            # Repository implementations
│   │   │       └── cryptocompare/
│   │   │           ├── ohlcv.ts
│   │   │           ├── trades.ts
│   │   │           └── types.ts
│   │   │
│   │   └── services/                    # Core services
│
├── producers/                           # Producer applications
│   ├── src/
│   │   ├── machines/                    # XState machines
│   │   │   ├── types.ts
│   │   │   ├── producer.ts
│   │   │   └── websocket.ts
│   │   │
│   │   ├── cryptocompare/              # CryptoCompare producer
│   │   │   ├── config/
│   │   │   │   ├── types.ts
│   │   │   │   └── schema.ts
│   │   │   ├── service.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── common/                     # Shared producer code
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── config/                         # Producer configs
│   │   ├── default.json
│   │   └── schema.json
│   │
│   └── package.json
│
├── consumers/                          # Consumer applications
│   ├── src/
│   │   ├── machines/                   # XState machines
│   │   │   ├── types.ts
│   │   │   └── consumer.ts
│   │   │
│   │   ├── timescale/                 # TimescaleDB consumer
│   │   │   ├── config/
│   │   │   │   ├── types.ts
│   │   │   │   └── schema.ts
│   │   │   ├── service.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── common/                    # Shared consumer code
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── config/                        # Consumer configs
│   │   ├── default.json
│   │   └── schema.json
│   │
│   └── package.json
│
└── package.json

```

Key aspects of this structure:

1. Core Layer:
- Clear separation of models, access, sources, and repositories
- Base implementations for HTTP, WebSocket, and data access
- Source-specific implementations isolated

2. Producer Layer:
- XState machines for flow control
- Source-specific implementations
- Configuration management
- Shared utilities

3. Consumer Layer:
- XState machines for consumption flow
- Storage-specific implementations
- Configuration management
- Shared utilities

Implementation order:
1. Core data access layer (HTTP, WebSocket, Queue)
2. CryptoCompare source implementation 
3. Producer state machines and service
4. Consumer state machines and service

Would you like me to start with any particular component?