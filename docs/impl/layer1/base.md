# Layer 1: Base Infrastructure

## Overview

Layer 1 provides the foundational infrastructure components for the QiCore Data Platform. This layer contains raw clients and low-level services that Layer 2 DSL actors build upon.

## Architecture

Layer 1 is the foundation that provides:
- **Database clients**: Direct connections to TimescaleDB and ClickHouse
- **Streaming clients**: Redpanda/Kafka client implementations
- **Base agent framework**: Core agent lifecycle and management
- **No DSL abstractions**: Raw functionality only

## Components

### Base Infrastructure (`lib/src/base/`)

```
lib/src/base/
├── base-agent.ts              # Core agent lifecycle management
├── database/                  # Database infrastructure
│   ├── drizzle-client.ts     # Drizzle ORM client
│   ├── index.ts              # Database interface
│   ├── schema.ts             # Database schemas
│   └── timescale-client.ts   # TimescaleDB client
└── streaming/                # Streaming infrastructure
    ├── index.ts
    └── redpanda/
        ├── index.ts
        ├── redpanda-client.ts    # KafkaJS wrapper
        ├── redpanda-config.ts    # Configuration
        └── types.ts              # Kafka message types
```

### Database Infrastructure

#### TimescaleDB Client
- **Purpose**: Direct connection to TimescaleDB for time-series data
- **Technology**: PostgreSQL with TimescaleDB extension
- **Usage**: Stores cryptocurrency price data with automatic partitioning

#### Drizzle Client  
- **Purpose**: Type-safe database ORM
- **Technology**: Drizzle ORM with TypeScript integration
- **Usage**: Schema management and type-safe queries

#### Database Schemas
- **Purpose**: Database table definitions and migrations
- **Technology**: SQL with TypeScript type generation
- **Usage**: Cryptocurrency data models (prices, OHLCV, analytics)

### Streaming Infrastructure

#### Redpanda Client
- **Purpose**: Kafka-compatible streaming client
- **Technology**: KafkaJS wrapper for Redpanda
- **Usage**: Real-time data streaming between components

#### Configuration Management
- **Purpose**: Environment-based configuration
- **Technology**: TypeScript configuration objects
- **Usage**: Broker connections, topic management, serialization

#### Message Types
- **Purpose**: Type definitions for streaming messages
- **Technology**: TypeScript interfaces
- **Usage**: Type safety for Kafka message payloads

### Base Agent Framework

#### Core Agent (`base-agent.ts`)
- **Purpose**: Foundation class for all agents
- **Features**: Lifecycle management, error handling, status tracking
- **Usage**: Extended by Layer 2 DSL actors

## Design Principles

### 1. Raw Infrastructure Only
- **No DSL abstractions**: Layer 1 provides raw clients only
- **Direct technology access**: Close to underlying databases/streams
- **Minimal abstractions**: Keep complexity in Layer 2

### 2. Technology-Specific Implementation
- **Database specifics**: TimescaleDB-optimized queries and schemas
- **Streaming specifics**: Kafka/Redpanda message handling
- **Performance focus**: Optimized for specific technology characteristics

### 3. Foundation for Layer 2
- **Composable components**: Layer 2 actors use these building blocks
- **Stable interfaces**: Changes here affect all Layer 2 components
- **Error handling**: Result<T> pattern integration

## Usage Patterns

### Database Access
```typescript
// Layer 1 usage - direct database operations
import { TimescaleClient } from '@qi/core/base/database';

const client = new TimescaleClient(config);
await client.insertPriceData(rawData);
const results = await client.queryPriceHistory(symbol, dateRange);
```

### Streaming Access
```typescript
// Layer 1 usage - direct streaming operations  
import { RedpandaClient } from '@qi/core/base/streaming';

const client = new RedpandaClient(config);
await client.produce(topic, message);
const messages = await client.consume(topic, options);
```

### Agent Foundation
```typescript
// Layer 1 usage - base agent functionality
import { BaseAgent } from '@qi/core/base';

class CustomAgent extends BaseAgent {
  async initialize(): Promise<Result<void>> {
    // Custom initialization logic
  }
  
  async cleanup(): Promise<Result<void>> {
    // Custom cleanup logic
  }
}
```

## Layer 1 ↔ Layer 2 Interface

### Data Flow Direction
```
Layer 2 DSL Actors
        ↓
Layer 1 Infrastructure
        ↓  
External Services (DB, Kafka, etc.)
```

### Integration Points
- **Database operations**: Layer 2 actors use TimescaleClient for data persistence
- **Streaming operations**: Layer 2 actors use RedpandaClient for message passing
- **Agent lifecycle**: Layer 2 actors extend BaseAgent for common functionality

### Error Handling
- **Result<T> pattern**: All Layer 1 operations return Result<T>
- **QiError types**: Consistent error handling throughout the stack
- **Functional composition**: Layer 2 can chain Layer 1 operations safely

## Performance Characteristics

### Database Performance
- **TimescaleDB optimization**: Automatic partitioning for time-series data
- **Connection pooling**: Efficient database connection management
- **Bulk operations**: Optimized for high-throughput data ingestion

### Streaming Performance
- **Kafka optimization**: Batch processing and compression support
- **Low latency**: Sub-50ms message processing for real-time data
- **Scalability**: Horizontal scaling through partitioning

## Future Considerations

### Layer 1 Stability
- **Stable interfaces**: Layer 1 changes affect entire platform
- **Performance focus**: Optimizations should be backward compatible
- **Technology evolution**: Plan for database/streaming technology upgrades

### Extension Points
- **New databases**: ClickHouse, MongoDB integration points
- **New streaming**: Additional streaming technology support
- **Monitoring**: Observability and metrics collection integration

---

**Layer 1 Principle**: Provide stable, high-performance infrastructure that Layer 2 DSL actors can build upon without worrying about low-level technology details.