// Base Streaming Infrastructure
// Core streaming capabilities and configurations (no agents/actors)

// =============================================================================
// INFRASTRUCTURE - Base Redpanda client only
// =============================================================================

export * from './redpanda';

// =============================================================================
// MODULE INFO
// =============================================================================

export const STREAMING_MODULE_INFO = {
  name: '@qicore/crypto-data-platform-base-streaming',
  version: '1.0.0',
  description: 'Base streaming infrastructure for factor-compositional architecture',
  components: {
    redpanda: 'Core Kafka-compatible streaming platform client',
  }
} as const;