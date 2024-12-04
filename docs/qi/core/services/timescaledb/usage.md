# TimescaleDB Module Documentation

## Overview

The TimescaleDB module provides configuration management and connectivity for TimescaleDB integration using Sequelize ORM. It handles connection details, pool configuration, and error management while delegating ORM functionality to Sequelize.

## Installation

```bash
npm install @qi/core sequelize pg pg-hstore
```

## Basic Usage

```typescript
import { TimescaleDBClient } from '@qi/core/services/timescaledb';
import { Sequelize, DataTypes } from 'sequelize';

// Initialize client
const client = new TimescaleDBClient({
  connection: postgresConnection,
  pool: {
    max: 20,
    min: 5
  }
});

// Create Sequelize instance
const sequelize = new Sequelize(client.getConnectionDetails());

// Define models
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: DataTypes.STRING,
  createdAt: DataTypes.DATE
});

// Sync models
await sequelize.sync();
```

## Configuration

### Pool Configuration

```typescript
interface PoolConfig {
  max?: number;              // Maximum connections (default: 5)
  min?: number;              // Minimum connections (default: 0)
  acquireTimeout?: number;   // Max time to acquire connection (default: 30000ms)
  idleTimeout?: number;      // Max idle time (default: 10000ms)
  connectionTimeoutMillis?: number;  // Connection timeout
  statementTimeout?: number; // Query timeout
  idleInTransactionSessionTimeout?: number;  // Transaction timeout
}
```

### Example Configuration

```typescript
const client = new TimescaleDBClient({
  connection: postgresConnection,
  pool: {
    max: 20,
    min: 5,
    acquireTimeout: 25000,
    connectionTimeoutMillis: 5000,
    statementTimeout: 30000
  }
});
```

## Working with Sequelize

### Model Definition

```typescript
// Define a TimescaleDB hypertable
const Metrics = sequelize.define('Metrics', {
  time: {
    type: DataTypes.DATE,
    primaryKey: true
  },
  sensor_id: {
    type: DataTypes.INTEGER,
    primaryKey: true
  },
  temperature: DataTypes.FLOAT,
  humidity: DataTypes.FLOAT
}, {
  tableName: 'metrics',
  timestamps: false
});

// Create hypertable
await sequelize.query(`
  SELECT create_hypertable(
    'metrics', 
    'time',
    chunk_time_interval => INTERVAL '1 day'
  );
`);
```

### Time-Series Queries

```typescript
// Time bucketing
const hourlyAvg = await Metrics.findAll({
  attributes: [
    [sequelize.literal("time_bucket('1 hour', time)"), 'bucket'],
    [sequelize.fn('AVG', sequelize.col('temperature')), 'avg_temp']
  ],
  where: {
    time: {
      [Op.gte]: startDate,
      [Op.lt]: endDate
    }
  },
  group: ['bucket'],
  order: ['bucket']
});

// Continuous aggregates
await sequelize.query(`
  CREATE MATERIALIZED VIEW metrics_daily AS
  SELECT 
    time_bucket('1 day', time) AS bucket,
    sensor_id,
    AVG(temperature) as avg_temp,
    MAX(temperature) as max_temp,
    MIN(temperature) as min_temp
  FROM metrics
  GROUP BY bucket, sensor_id;
`);
```

### Repositories Pattern

```typescript
class MetricsRepository {
  private model: typeof Metrics;

  constructor(sequelize: Sequelize) {
    this.model = Metrics;
  }

  async addMetric(data: MetricInput) {
    return this.model.create(data);
  }

  async getHourlyAverages(sensorId: number, start: Date, end: Date) {
    return this.model.findAll({
      attributes: [
        [sequelize.literal("time_bucket('1 hour', time)"), 'bucket'],
        [sequelize.fn('AVG', sequelize.col('temperature')), 'avg_temp']
      ],
      where: {
        sensor_id: sensorId,
        time: { [Op.between]: [start, end] }
      },
      group: ['bucket'],
      order: ['bucket']
    });
  }
}
```

### Transactions

```typescript
async function recordMetrics(metrics: MetricInput[]) {
  const transaction = await sequelize.transaction();
  
  try {
    await Metrics.bulkCreate(metrics, { transaction });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

### Error Handling

```typescript
try {
  await sequelize.authenticate();
} catch (error) {
  throw new ApplicationError(
    "Database connection failed",
    ErrorCode.POSTGRES_CONNECTION_ERROR,
    500,
    { error: error.message }
  );
}
```

### Migrations

```typescript
// migrations/20241203000000-create-metrics.js
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('metrics', {
      time: {
        type: Sequelize.DATE,
        primaryKey: true
      },
      sensor_id: {
        type: Sequelize.INTEGER,
        primaryKey: true
      },
      temperature: Sequelize.FLOAT,
      humidity: Sequelize.FLOAT
    });

    await queryInterface.sequelize.query(`
      SELECT create_hypertable('metrics', 'time');
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('metrics');
  }
};
```

## Best Practices

### Connection Management

1. Use pool configuration appropriate for your workload
2. Monitor connection pool metrics
3. Implement proper connection error handling
4. Use transactions for atomic operations

```typescript
// Health check
async function checkDatabaseHealth() {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    logger.error("Database health check failed", { error });
    return false;
  }
}
```

### Query Optimization

1. Use appropriate indexes
2. Leverage continuous aggregates for frequent queries
3. Implement proper time partitioning
4. Use compression when applicable

```typescript
// Create indexes
await sequelize.query(`
  CREATE INDEX ON metrics (sensor_id, time DESC);
  
  -- Compression policy
  ALTER TABLE metrics 
    SET (timescaledb.compress = true);
  
  SELECT add_compression_policy('metrics', 
    INTERVAL '7 days');
`);
```

### Environment Specific Configuration

```typescript
const config = {
  development: {
    pool: {
      max: 5,
      min: 0
    }
  },
  production: {
    pool: {
      max: 50,
      min: 10,
      acquireTimeout: 60000
    },
    dialectOptions: {
      statement_timeout: 30000,
      idle_in_transaction_session_timeout: 60000
    }
  }
};

const client = new TimescaleDBClient({
  connection: postgresConnection,
  pool: config[process.env.NODE_ENV || 'development'].pool
});
```

## Common Patterns

### Service Layer

```typescript
class MetricsService {
  private repository: MetricsRepository;

  constructor(client: TimescaleDBClient) {
    const sequelize = new Sequelize(client.getConnectionDetails());
    this.repository = new MetricsRepository(sequelize);
  }

  async recordMetrics(metrics: MetricInput[]) {
    try {
      await this.repository.bulkCreate(metrics);
    } catch (error) {
      throw new ApplicationError(
        "Failed to record metrics",
        ErrorCode.POSTGRES_OPERATION_ERROR,
        500,
        { error: error.message }
      );
    }
  }
}
```

## Testing

### Unit Tests

```typescript
describe('MetricsService', () => {
  let service: MetricsService;
  let mockClient: TimescaleDBClient;

  beforeEach(() => {
    mockClient = createMockClient();
    service = new MetricsService(mockClient);
  });

  it('should record metrics successfully', async () => {
    const metrics = [
      { time: new Date(), sensor_id: 1, temperature: 20 }
    ];
    
    await expect(service.recordMetrics(metrics))
      .resolves.not.toThrow();
  });
});
```

### Integration Tests

```typescript
describe('MetricsRepository Integration', () => {
  let sequelize: Sequelize;
  let repository: MetricsRepository;

  beforeAll(async () => {
    const client = new TimescaleDBClient({
      connection: testConnection
    });
    sequelize = new Sequelize(client.getConnectionDetails());
    repository = new MetricsRepository(sequelize);
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should store and retrieve metrics', async () => {
    const metric = {
      time: new Date(),
      sensor_id: 1,
      temperature: 20
    };
    
    await repository.addMetric(metric);
    const result = await repository.getLatestMetric(1);
    expect(result.temperature).toBe(20);
  });
});
```