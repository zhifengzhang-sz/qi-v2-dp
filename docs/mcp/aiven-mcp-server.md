# Aiven MCP Server

Enterprise-grade MCP server for managing Aiven cloud services including Apache Kafka®, PostgreSQL®, ClickHouse®, and OpenSearch® with production-ready streaming capabilities.

## Overview

The Aiven MCP server provides unified access to managed cloud data services through a single MCP interface, enabling enterprise-grade streaming, database operations, and analytics workflows.

## Supported Services

### Apache Kafka® (Redpanda Compatible)
- **Fully managed Kafka clusters** with auto-scaling
- **Multi-zone deployment** for high availability  
- **Schema Registry** integration with Avro/JSON schemas
- **Kafka Connect** for data pipeline automation
- **Real-time stream processing** with sub-100ms latency

### PostgreSQL® (TimescaleDB Compatible)
- **Managed PostgreSQL** with TimescaleDB extension support
- **High-performance time-series** operations
- **Automatic backup** and point-in-time recovery
- **Connection pooling** and read replicas
- **Enterprise security** with encryption and compliance

### ClickHouse®
- **Real-time analytics** with column-oriented storage
- **Petabyte-scale** data processing
- **SQL interface** for complex analytics
- **Materialized views** for real-time aggregations
- **Compression ratios** up to 90%

### OpenSearch®
- **Full-text search** and log analytics
- **Real-time indexing** and querying
- **Kibana integration** for visualization
- **Security features** with fine-grained access control

## MCP Tools & Capabilities

### Project Management

```typescript
// List all Aiven projects and services
await mcpClient.callTool("list_projects", {});

// Get project details with service status
await mcpClient.callTool("get_project_details", {
  project: "qicore-production"
});

// Service health monitoring
await mcpClient.callTool("get_service_status", {
  project: "qicore-production",
  service: "kafka-cluster-01"
});
```

### Kafka Stream Management

```typescript
// Topic administration
await mcpClient.callTool("create_kafka_topic", {
  project: "qicore-production",
  service: "kafka-cluster-01",
  topic: "crypto-prices",
  partitions: 12,
  replication_factor: 3,
  config: {
    "retention.ms": "86400000",
    "compression.type": "lz4"
  }
});

// Real-time message production
await mcpClient.callTool("produce_kafka_message", {
  project: "qicore-production", 
  service: "kafka-cluster-01",
  topic: "crypto-prices",
  key: "BTC-USD",
  value: {
    price: 45000,
    timestamp: "2024-01-15T10:30:00Z",
    volume: 1.5
  }
});

// Stream consumption with offset management
await mcpClient.callTool("consume_kafka_messages", {
  project: "qicore-production",
  service: "kafka-cluster-01", 
  topic: "crypto-prices",
  consumer_group: "analytics-pipeline",
  max_messages: 100
});
```

### PostgreSQL/TimescaleDB Operations

```typescript
// Database query execution
await mcpClient.callTool("execute_postgresql_query", {
  project: "qicore-production",
  service: "timescaledb-01",
  database: "market_data",
  query: `
    SELECT time_bucket('1 minute', timestamp) as minute,
           symbol,
           first(price, timestamp) as open,
           max(price) as high,
           min(price) as low,
           last(price, timestamp) as close,
           sum(volume) as volume
    FROM crypto_prices 
    WHERE timestamp > NOW() - INTERVAL '1 hour'
    GROUP BY minute, symbol
    ORDER BY minute DESC
  `
});

// Hypertable management
await mcpClient.callTool("create_hypertable", {
  project: "qicore-production",
  service: "timescaledb-01",
  database: "market_data",
  table: "crypto_prices",
  time_column: "timestamp",
  chunk_time_interval: "1 day"
});

// Continuous aggregates for real-time views
await mcpClient.callTool("create_continuous_aggregate", {
  project: "qicore-production",
  service: "timescaledb-01",
  database: "market_data",
  view_name: "crypto_prices_1min",
  query: `
    SELECT time_bucket('1 minute', timestamp) as minute,
           symbol,
           avg(price) as avg_price,
           count(*) as trade_count
    FROM crypto_prices
    GROUP BY minute, symbol
  `,
  refresh_policy: "INTERVAL '1 minute'"
});
```

### ClickHouse Analytics

```typescript
// Real-time analytics queries
await mcpClient.callTool("execute_clickhouse_query", {
  project: "qicore-production", 
  service: "clickhouse-analytics",
  database: "market_analytics",
  query: `
    SELECT 
      symbol,
      toStartOfMinute(timestamp) as minute,
      avg(price) as avg_price,
      quantile(0.5)(price) as median_price,
      sum(volume) as total_volume,
      count() as trade_count
    FROM crypto_trades
    WHERE timestamp > now() - INTERVAL 1 HOUR
    GROUP BY symbol, minute
    ORDER BY minute DESC, total_volume DESC
    LIMIT 100
  `
});

// Materialized view management
await mcpClient.callTool("create_materialized_view", {
  project: "qicore-production",
  service: "clickhouse-analytics", 
  database: "market_analytics",
  view_name: "real_time_metrics",
  query: `
    SELECT 
      symbol,
      toStartOfMinute(timestamp) as minute,
      avgState(price) as avg_price_state,
      sumState(volume) as volume_state
    FROM crypto_trades
    GROUP BY symbol, minute
  `
});
```

## Integration with QiCore DSL

### Enhanced Stream Processing

```typescript
class AivenStreamProcessor extends BaseWriter {
  // Write to Kafka topic with Aiven MCP
  protected async writeToStreamHandler(
    topic: string, 
    data: CryptoPriceData
  ): Promise<void> {
    await this.mcpClient.callTool("produce_kafka_message", {
      project: this.config.project,
      service: this.config.kafkaService,
      topic: topic,
      key: data.coinId,
      value: {
        symbol: data.symbol,
        price: data.usdPrice,
        timestamp: data.lastUpdated.toISOString(),
        volume: data.volume24h,
        change: data.change24h
      }
    });
  }

  // Batch write for high-throughput scenarios
  protected async writeBatchToStreamHandler(
    topic: string,
    dataArray: CryptoPriceData[]
  ): Promise<void> {
    const messages = dataArray.map(data => ({
      key: data.coinId,
      value: {
        symbol: data.symbol,
        price: data.usdPrice,
        timestamp: data.lastUpdated.toISOString(),
        volume: data.volume24h,
        change: data.change24h
      }
    }));

    await this.mcpClient.callTool("produce_kafka_batch", {
      project: this.config.project,
      service: this.config.kafkaService,
      topic: topic,
      messages: messages
    });
  }
}
```

### TimescaleDB Integration

```typescript
class AivenTimescaleWriter extends BaseWriter {
  // Write time-series data to TimescaleDB
  protected async writeTimeSeriesHandler(
    table: string,
    data: CryptoOHLCVData
  ): Promise<void> {
    await this.mcpClient.callTool("execute_postgresql_query", {
      project: this.config.project,
      service: this.config.postgresService,
      database: this.config.database,
      query: `
        INSERT INTO ${table} (
          timestamp, coin_id, symbol, open, high, low, close, volume
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        )
        ON CONFLICT (timestamp, coin_id) 
        DO UPDATE SET
          open = EXCLUDED.open,
          high = EXCLUDED.high,
          low = EXCLUDED.low,
          close = EXCLUDED.close,
          volume = EXCLUDED.volume
      `,
      parameters: [
        data.timestamp.toISOString(),
        data.coinId,
        data.symbol,
        data.open,
        data.high,
        data.low,
        data.close,
        data.volume
      ]
    });
  }

  // Bulk insert for high-throughput ingestion
  protected async writeBulkTimeSeriesHandler(
    table: string,
    dataArray: CryptoOHLCVData[]
  ): Promise<void> {
    const values = dataArray.map(data => [
      data.timestamp.toISOString(),
      data.coinId,
      data.symbol,
      data.open,
      data.high,
      data.low,
      data.close,
      data.volume
    ]);

    await this.mcpClient.callTool("bulk_insert_postgresql", {
      project: this.config.project,
      service: this.config.postgresService,
      database: this.config.database,
      table: table,
      columns: ["timestamp", "coin_id", "symbol", "open", "high", "low", "close", "volume"],
      values: values
    });
  }
}
```

### Real-Time Analytics with ClickHouse

```typescript
class AivenAnalyticsReader extends BaseReader {
  // Real-time market analytics
  protected async getMarketAnalyticsHandler(): Promise<CryptoMarketAnalytics> {
    const result = await this.mcpClient.callTool("execute_clickhouse_query", {
      project: this.config.project,
      service: this.config.clickhouseService,
      database: this.config.analyticsDatabase,
      query: `
        SELECT 
          sum(market_cap) as total_market_cap,
          sum(volume_24h) as total_volume,
          avg(price_change_24h) as avg_change,
          countDistinct(symbol) as active_coins
        FROM crypto_market_data
        WHERE timestamp > now() - INTERVAL 5 MINUTE
      `
    });

    const row = result.data.rows[0];
    return {
      timestamp: new Date(),
      totalMarketCap: row.total_market_cap,
      totalVolume: row.total_volume,
      marketCapChange24h: row.avg_change,
      activeCryptocurrencies: row.active_coins,
      source: "aiven-clickhouse",
      attribution: "Real-time analytics via Aiven ClickHouse"
    };
  }

  // Performance metrics dashboard
  protected async getPerformanceMetricsHandler(
    timeRange: string = "1h"
  ): Promise<PerformanceMetrics[]> {
    const result = await this.mcpClient.callTool("execute_clickhouse_query", {
      project: this.config.project,
      service: this.config.clickhouseService,
      database: this.config.analyticsDatabase,
      query: `
        SELECT 
          symbol,
          toStartOfMinute(timestamp) as minute,
          avg(price) as avg_price,
          min(price) as min_price,
          max(price) as max_price,
          sum(volume) as total_volume,
          stddevPop(price) as volatility
        FROM crypto_trades
        WHERE timestamp > now() - INTERVAL ${timeRange}
        GROUP BY symbol, minute
        ORDER BY minute DESC, total_volume DESC
      `
    });

    return result.data.rows.map(row => ({
      symbol: row.symbol,
      timestamp: new Date(row.minute),
      avgPrice: row.avg_price,
      minPrice: row.min_price,
      maxPrice: row.max_price,
      volume: row.total_volume,
      volatility: row.volatility
    }));
  }
}
```

## Production Configuration

### Service Configuration

```typescript
interface AivenMCPConfig {
  // Authentication
  auth: {
    token: string;
    project: string;
  };

  // Service endpoints
  services: {
    kafka: {
      name: string;
      host: string;
      port: number;
      ssl: boolean;
    };
    postgresql: {
      name: string;
      host: string;
      port: number;
      database: string;
      ssl: boolean;
    };
    clickhouse: {
      name: string;
      host: string;
      port: number;
      database: string;
      ssl: boolean;
    };
  };

  // Performance tuning
  performance: {
    connectionPoolSize: number;
    queryTimeout: number;
    batchSize: number;
    retryAttempts: number;
  };
}
```

### High Availability Setup

```typescript
// Multi-zone deployment configuration
const productionConfig: AivenMCPConfig = {
  auth: {
    token: process.env.AIVEN_TOKEN!,
    project: "qicore-production"
  },
  services: {
    kafka: {
      name: "kafka-ha-cluster",
      host: "kafka-ha-qicore.a.aivencloud.com",
      port: 9092,
      ssl: true,
      config: {
        replication_factor: 3,
        min_insync_replicas: 2,
        zones: ["us-east-1a", "us-east-1b", "us-east-1c"]
      }
    },
    postgresql: {
      name: "timescaledb-ha",
      host: "timescaledb-ha-qicore.a.aivencloud.com", 
      port: 5432,
      database: "market_data",
      ssl: true,
      config: {
        read_replicas: 2,
        backup_retention: "30 days",
        point_in_time_recovery: true
      }
    }
  }
};
```

## Performance Characteristics

### Throughput & Latency

| Service | Write Throughput | Read Latency | Availability |
|---------|-----------------|--------------|--------------|
| Kafka | 100K msg/sec | < 100ms | 99.95% |
| PostgreSQL | 50K writes/sec | < 50ms | 99.9% |
| ClickHouse | 1M rows/sec | < 10ms | 99.9% |

### Auto-Scaling

```typescript
// Auto-scaling configuration for varying loads
const autoScalingConfig = {
  kafka: {
    min_brokers: 3,
    max_brokers: 12,
    scale_up_threshold: "80%", // CPU utilization
    scale_down_threshold: "30%",
    cooldown_period: "10m"
  },
  postgresql: {
    connection_pooling: true,
    max_connections: 200,
    read_replica_scaling: true
  }
};
```

## Cost Optimization

### Resource Management

```typescript
// Intelligent resource allocation
class AivenResourceManager {
  // Dynamic partition scaling based on load
  async optimizeKafkaPartitions(topic: string, load: number): Promise<void> {
    const currentPartitions = await this.getTopicPartitionCount(topic);
    const optimalPartitions = Math.ceil(load / 1000); // 1000 msg/sec per partition
    
    if (optimalPartitions > currentPartitions) {
      await this.mcpClient.callTool("increase_topic_partitions", {
        topic: topic,
        partitions: optimalPartitions
      });
    }
  }

  // TimescaleDB compression optimization
  async enableCompressionPolicies(): Promise<void> {
    await this.mcpClient.callTool("execute_postgresql_query", {
      query: `
        SELECT add_compression_policy('crypto_prices', INTERVAL '7 days');
        SELECT add_retention_policy('crypto_prices', INTERVAL '1 year');
      `
    });
  }
}
```

### Usage Monitoring

```typescript
// Cost tracking and alerts
interface UsageMetrics {
  kafka: {
    messages_per_hour: number;
    storage_gb: number;
    network_gb: number;
  };
  postgresql: {
    queries_per_hour: number;
    storage_gb: number;
    connection_hours: number;
  };
  clickhouse: {
    queries_per_hour: number;
    storage_gb: number;
    compute_hours: number;
  };
}
```

## Security & Compliance

### Enterprise Security Features

```typescript
// VPC peering and private networking
const securityConfig = {
  networking: {
    vpc_peering: true,
    private_link: true,
    ip_whitelist: ["10.0.0.0/8", "172.16.0.0/12"]
  },
  
  encryption: {
    at_rest: "AES-256",
    in_transit: "TLS 1.3",
    key_management: "customer_managed"
  },
  
  compliance: {
    certifications: ["SOC 2", "ISO 27001", "GDPR"],
    audit_logging: true,
    backup_encryption: true
  }
};
```

### Access Control

```typescript
// Role-based access control
const rbacConfig = {
  roles: {
    data_engineer: {
      kafka: ["topic:read", "topic:write", "consumer_group:*"],
      postgresql: ["database:connect", "table:select", "table:insert"],
      clickhouse: ["database:select"]
    },
    analyst: {
      postgresql: ["database:connect", "table:select"],
      clickhouse: ["database:select", "view:create"]
    },
    admin: {
      kafka: ["*"],
      postgresql: ["*"], 
      clickhouse: ["*"]
    }
  }
};
```

## Monitoring & Observability

### Built-in Metrics

```typescript
// Comprehensive service monitoring
interface AivenMetrics {
  kafka: {
    broker_count: number;
    topic_count: number;
    messages_per_second: number;
    consumer_lag: number;
    disk_usage_percent: number;
  };
  
  postgresql: {
    active_connections: number;
    queries_per_second: number;
    cache_hit_ratio: number;
    replication_lag: number;
    disk_usage_percent: number;
  };
  
  clickhouse: {
    queries_per_second: number;
    query_duration_avg: number;
    memory_usage_percent: number;
    compression_ratio: number;
  };
}
```

### Alerting Integration

```typescript
// Production alerting setup
const alertingConfig = {
  kafka: {
    consumer_lag: { threshold: 10000, severity: "warning" },
    disk_usage: { threshold: 85, severity: "critical" },
    broker_down: { threshold: 1, severity: "critical" }
  },
  
  postgresql: {
    connection_limit: { threshold: 180, severity: "warning" },
    replication_lag: { threshold: "5m", severity: "warning" },
    query_duration: { threshold: "30s", severity: "warning" }
  }
};
```

---

**Status**: Enterprise-ready MCP server providing unified access to managed cloud services, ideal for production streaming and analytics workloads in the QiCore platform.