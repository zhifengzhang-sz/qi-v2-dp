# Data Platform Topic Definitions

This file lists all streaming topics, policies, and configuration parameters for our data-stream platform.

## Topics

### PriceDataTopic
- Description: Raw price ticks for all monitored assets.
- Partitions: 6
- Replication Factor: 3
- Retention: 7 days
- Compaction: disabled

### OHLCVDataTopic
- Description: Aggregated OHLCV data at 1-minute intervals.
- Partitions: 4
- Replication Factor: 3
- Retention: 30 days
- Compaction: enabled (delete tombstone retention)

### AgentEventsTopic
- Description: Lifecycle events from agents (start, stop, error).
- Partitions: 3
- Replication Factor: 2
- Retention: 7 days
- Compaction: enabled

## Policies

- Encryption: TLS for all connections
- Schema Enforcement: Avro with Confluent Schema Registry
- Quotas: 10 MB/s per client
