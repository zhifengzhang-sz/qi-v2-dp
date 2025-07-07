# QiCore Crypto Data Platform Library

A production-ready library implementing the dual architecture pattern for cryptocurrency data processing with AI agent control via official MCP servers.

## Architecture Overview

This library implements the **dual architecture pattern** specified in `docs/data-stream/`:

### 1. Physical Data Layer (High Performance)
```
CryptoData → Producer → Redpanda → Consumer → Database
```
- **Purpose**: High-throughput data streaming with minimal latency
- **Components**: `CryptoDataProducer`, `RedpandaClient`, `CryptoDataConsumer`
- **Performance**: Direct connections, batching, connection pooling

### 2. AI Control Layer (MCP Integration)
```
AI Agent → MCP Client → Official MCP Server → External Service
```
- **Purpose**: AI-mediated control and orchestration
- **Components**: `CryptoPlatformAgent`, `MCPClient`, Official MCP Servers
- **Intelligence**: Real AI analysis, automated monitoring, dynamic responses

## Quick Start

### Basic Usage
```typescript
import { CryptoDataPlatform } from '@qicore/crypto-data-platform';

const platform = new CryptoDataPlatform({
  platform: {
    redpandaBrokers: ['localhost:9092'],
    postgresConnectionString: 'postgresql://user:pass@localhost:5432/crypto_data',
    coinGeckoApiKey: 'your_api_key'
  },
  mcpServers: {
    redpanda: { brokers: ['localhost:9092'] },
    postgres: { 
      connectionString: 'postgresql://user:pass@localhost:5432/crypto_data',
      readOnly: false 
    },
    coingecko: { 
      apiKey: 'your_api_key',
      useRemoteServer: true 
    }
  },
  publisher: {
    clientId: 'crypto-producer',
    brokers: ['localhost:9092']
  },
  consumer: {
    clientId: 'crypto-consumer',
    groupId: 'crypto-group',
    brokers: ['localhost:9092'],
    topics: ['crypto-ohlcv', 'crypto-prices']
  }
});

// Start the complete platform
await platform.start();

// Execute AI operations via control layer
await platform.executeAIOperation('collectCryptoData', {
  symbols: ['bitcoin', 'ethereum', 'cardano']
});

// Execute high-performance operations via physical layer
await platform.executePhysicalOperation('publishPrice', priceData);

// Graceful shutdown
platform.setupGracefulShutdown();
```

### Individual Components

#### Physical Layer Only (High Performance)
```typescript
import { CryptoDataProducer, CryptoDataConsumer, RedpandaClient } from '@qicore/crypto-data-platform';

// High-performance producer
const producer = new CryptoDataProducer({
  clientId: 'crypto-producer',
  brokers: ['localhost:9092']
});

await producer.start();
await producer.publishPrice(priceData);
```

#### AI Control Layer Only
```typescript
import { CryptoPlatformAgent, MCPServerManager } from '@qicore/crypto-data-platform';

// Start official MCP servers
const mcpManager = new MCPServerManager();
await mcpManager.startAll({
  coingecko: { useRemoteServer: true },
  postgres: { connectionString: 'postgresql://...' }
});

// AI agent with MCP integration
const agent = new CryptoPlatformAgent({
  redpandaBrokers: ['localhost:9092'],
  postgresConnectionString: 'postgresql://...'
});

await agent.initialize();
await agent.collectCryptoData(['bitcoin', 'ethereum']);
```

## Official MCP Servers

This library integrates with official vendor-built MCP servers:

### 1. CoinGecko MCP Server
```typescript
import { OfficialCoinGeckoMCPLauncher } from '@qicore/crypto-data-platform';

const coinGeckoMCP = new OfficialCoinGeckoMCPLauncher({
  apiKey: 'your_api_key',
  useRemoteServer: true  // Use public remote server
});

await coinGeckoMCP.start();
```

**Available Tools**: `get_price`, `get_ohlcv`, `get_trending`, `get_global`, `search`

### 2. Redpanda MCP Server
```typescript
import { OfficialRedpandaMCPLauncher } from '@qicore/crypto-data-platform';

const redpandaMCP = new OfficialRedpandaMCPLauncher({
  brokers: ['localhost:9092'],
  useCloudMCP: false  // Use local MCP server
});

await redpandaMCP.start();
```

**Available Tools**: `create_topic`, `list_topics`, `produce_message`, `cluster_info`

### 3. PostgreSQL MCP Server
```typescript
import { OfficialPostgresMCPLauncher } from '@qicore/crypto-data-platform';

const postgresMCP = new OfficialPostgresMCPLauncher({
  connectionString: 'postgresql://user:pass@localhost:5432/crypto_data',
  readOnly: false
});

await postgresMCP.start();
```

**Available Tools**: `read_schema`, `read_query`, `execute_query`, `describe_table`

## Configuration

### Environment Variables
```bash
# Database
POSTGRES_CONNECTION_STRING=postgresql://crypto_user:crypto_pass@localhost:5432/crypto_data

# Redpanda/Kafka
REDPANDA_BROKERS=localhost:9092

# CoinGecko (Optional for free tier)
COINGECKO_API_KEY=your_api_key

# MCP Server Settings
POSTGRES_READ_ONLY=false
COINGECKO_RATE_LIMIT=50
RPK_MCP_LOG_LEVEL=info
```

### Feature Flags
```typescript
const platform = new CryptoDataPlatform({
  // ... other config
  enablePhysicalLayer: true,   // High-performance streaming
  enableAIControl: true,       // AI agent orchestration
  enableMonitoring: true       // Platform monitoring
});
```

## Key Features

### ✅ Production Ready
- Comprehensive error handling and retry logic
- Health checks and monitoring
- Graceful shutdown and cleanup
- Connection pooling and resource management

### ✅ High Performance
- Direct streaming connections for data flow
- Batching and compression
- Minimal latency design
- Scalable architecture

### ✅ AI Integration
- Real AI analysis using official model providers
- MCP-standardized tool interfaces
- Automated monitoring and alerting
- Dynamic response to platform events

### ✅ No Fake Code
- All implementations are real and functional
- No mocks, stubs, or placeholder code
- Production-grade error handling
- Comprehensive test coverage

## Architecture Benefits

### Dual Architecture Pattern
1. **Separation of Concerns**: Data flow vs. control flow
2. **Performance Optimization**: Physical layer optimized for speed
3. **AI Integration**: Control layer provides standardized AI interfaces
4. **Scalability**: Each layer can be scaled independently

### Official MCP Servers
1. **Zero Maintenance**: No custom MCP server code to maintain
2. **Vendor Support**: Built and supported by service providers
3. **Future-proof**: Automatic updates with vendor releases
4. **Standards Compliant**: Follows MCP protocol specifications

## Compliance

This library is **fully compliant** with:
- **docs/data-stream** specification (detailed implementation)
- **docs/zz/notes.md** conceptual architecture (two-centric design)
- **Model Context Protocol** standards
- **QiCore agent-lib** integration patterns

## API Reference

### Main Platform Class
- `CryptoDataPlatform` - Main platform orchestrator

### Physical Layer
- `CryptoDataProducer` - High-performance data publisher
- `CryptoDataConsumer` - High-performance data consumer
- `RedpandaClient` - Direct Redpanda/Kafka client

### AI Control Layer
- `CryptoPlatformAgent` - AI agent with MCP integration
- `MCPServerManager` - Official MCP server lifecycle management
- `OfficialRedpandaMCPLauncher` - Redpanda MCP server
- `OfficialPostgresMCPLauncher` - PostgreSQL MCP server
- `OfficialCoinGeckoMCPLauncher` - CoinGecko MCP server

### Types
- `CryptoPrice`, `CryptoOHLCV`, `MarketAnalytics` - Data types
- `PublisherConfig`, `ConsumerConfig` - Configuration interfaces
- Platform and MCP configuration types

## Development

### Prerequisites
- Bun v1.2+ (native TypeScript execution)
- Docker (for Redpanda, PostgreSQL/TimescaleDB)
- rpk v25.1.2+ (for Redpanda MCP)

### Testing
```bash
bun test              # Run all tests
bun test:watch        # Watch mode
bun run typecheck     # TypeScript checks
```

### Building
```bash
bun run build        # Build library
bun run lint          # Lint code
bun run format        # Format code
```

## License

This library follows the same license as the parent QiCore project.
## TypeScript Path Alias Workaround

### The Problem
Individual file type checking with path aliases doesn't work:
```bash
bun tsc --noEmit lib/src/file.ts  # ❌ Error: Cannot find module '@qi/core/base'
```

### The Solution
Use our shell script workarounds:

**From root:**
```bash
bun run typecheck:file lib/src/publishers/sources/coingecko/CoinGeckoActor.ts
./check-single-file.sh lib/src/file1.ts lib/src/file2.ts
```

**From lib/:**
```bash
bun run lib:typecheck:file src/publishers/sources/coingecko/CoinGeckoActor.ts  
cd lib && ./check-file.sh src/file1.ts src/file2.ts
```

### Why This "Stupid" Approach
After research: tsx/ts-node are broken with fp-ts + ES modules. This workaround is the only thing that actually works with our functional programming stack.
EOF < /dev/null