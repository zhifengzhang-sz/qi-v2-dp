Yes, we should organize response schemas. Let me revise the data/models structure first:



```typescript
core/data/
└── models/
    ├── base/                    # Core domain types
    │   ├── types.ts            # OHLCV, Trade, etc.
    │   ├── errors.ts           # Domain-specific errors
    │   └── guards.ts           # Type guards and validation
    │
    ├── sources/                # Source-specific models
    │   └── cryptocompare/
    │       ├── responses/      # Raw API response types
    │       │   ├── ohlcv.ts    
    │       │   ├── trades.ts
    │       │   └── orderbook.ts
    │       ├── requests/       # API request parameter types
    │       │   ├── ohlcv.ts
    │       │   ├── trades.ts
    │       │   └── orderbook.ts
    │       ├── ws/             # WebSocket message types
    │       │   ├── messages.ts
    │       │   └── channels.ts
    │       └── types.ts        # Common types
    │
    └── storage/                # Storage models
        ├── sequelize/          # TimescaleDB models
        │   └── cryptocompare/  # Source-specific tables
        │       ├── ohlcv.ts
        │       ├── trades.ts
        │       └── types.ts
        └── avro/               # Kafka/Redpanda schemas
            └── cryptocompare/
                ├── ohlcv.avsc
                ├── trades.avsc
                └── raw.avsc    # For raw API responses

/**
 * Base Models Example
 */
// models/base/types.ts
export interface BaseMarketData {
  exchange: string;
  symbol: string;
  timestamp: number;
}

export interface OHLCV extends BaseMarketData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume?: number;
  trades?: number;
}

/**
 * CryptoCompare Response Types
 */
// models/sources/cryptocompare/responses/ohlcv.ts
export interface CryptoCompareOHLCVResponse {
  Response: string;
  Message?: string;
  Data: {
    Data: Array<{
      UNIT: string;
      TIMESTAMP: number;
      TYPE: string;
      MARKET: string;
      INSTRUMENT: string;
      MAPPED_INSTRUMENT: string;
      BASE: string;
      QUOTE: string;
      OPEN: number;
      HIGH: number;
      LOW: number;
      CLOSE: number;
      VOLUME: number;
      QUOTE_VOLUME: number;
      TOTAL_TRADES: number;
    }>;
  };
  Err?: CryptoCompareError;
}

// models/sources/cryptocompare/responses/trades.ts
export interface CryptoCompareTradeResponse {
  Response: string;
  Message?: string;
  Data: Array<{
    TYPE: string;
    MARKET: string;
    INSTRUMENT: string;
    SIDE: string;
    ID: string;
    TIMESTAMP: number;
    TIMESTAMP_NS: number;
    QUANTITY: number;
    PRICE: number;
    QUOTE_QUANTITY: number;
    // ... other fields
  }>;
  Err?: CryptoCompareError;
}

/**
 * Request Parameter Types
 */
// models/sources/cryptocompare/requests/ohlcv.ts
export interface OHLCVParams {
  market: string;
  instrument: string;
  limit?: number;
  aggregate?: number;
  fill?: boolean;
  apply_mapping?: boolean;
  response_format: "JSON";
}

/**
 * WebSocket Message Types
 */
// models/sources/cryptocompare/ws/messages.ts
export interface WSTradeMessage {
  TYPE: string;
  MARKET: string;
  INSTRUMENT: string;
  SIDE: string;
  QUANTITY: number;
  PRICE: number;
  TIMESTAMP: number;
  TIMESTAMP_NS: number;
  // ... other fields
}

// models/sources/cryptocompare/ws/channels.ts
export enum WSChannel {
  TRADES = "0",
  ORDERBOOK = "1",
  // ... other channels
}

/**
 * Storage Models
 */
// models/storage/sequelize/cryptocompare/ohlcv.ts
export interface OHLCVAttributes {
  id: number;
  exchange: string;
  symbol: string;
  timestamp: number;
  unit: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume: number;
  trades: number;
  raw: string; // Original response JSON
  createdAt: Date;
  updatedAt: Date;
}

// models/storage/avro/cryptocompare/raw.avsc
{
  "type": "record",
  "name": "CryptoCompareRawResponse",
  "namespace": "market.data.cryptocompare",
  "fields": [
    {"name": "type", "type": "string"},
    {"name": "exchange", "type": "string"},
    {"name": "symbol", "type": "string"},
    {"name": "timestamp", "type": "long"},
    {"name": "payload", "type": "string"}, // Raw JSON response
    {"name": "source", "type": "string"},
    {"name": "createdAt", "type": "long", "logicalType": "timestamp-millis"}
  ]
}

```

Key changes:
1. Added dedicated response schema types
2. Separated request parameter types
3. Added WebSocket message types
4. Storage models store raw responses

Next steps:
1. Complete response schemas for all endpoints
2. Implement type guards and validation
3. Create Avro schemas for all message types
4. Add Sequelize models with raw storage
