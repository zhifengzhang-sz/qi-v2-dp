// Streaming Actors - A class of MCP clients that provide DSL tooling interfaces for streaming domains

// =============================================================================
// MAIN EXPORTS - Core Actor Classes
// =============================================================================

export { 
  MarketDataPublisherActor, 
  createMarketDataPublisherActor,
  type MarketDataPublisherConfig,
  type MarketDataInput,
  type PublishResult
} from './market-data-publisher-actor';

// =============================================================================
// MODULE METADATA
// =============================================================================

export const STREAMING_ACTORS_INFO = {
  name: '@qicore/crypto-data-platform-streaming-actors',
  version: '1.0.0',
  description: 'Streaming Actors for factor-compositional architecture',
  architecture: 'Actor = Special MCP Client that provides DSL tooling interfaces',
  features: [
    'MarketDataPublisherActor for crypto data streaming',
    'Business logic encapsulation for topic routing',
    'Domain-specific streaming interfaces',
    'Source-agnostic data ingestion',
    'Optimized message partitioning and serialization',
  ],
  patterns: {
    'Actor': 'A class of MCP client that provides DSL tooling interfaces',
    'DSL': 'Domain-specific tooling interfaces (the Actor\'s specialty)',
    'Business Logic': 'Encapsulated domain expertise for streaming patterns',
  },
} as const;