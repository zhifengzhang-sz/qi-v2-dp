// app/tests/timescaledb/timescaledb-mcp.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPClient } from '@qicore/agent-lib/qimcp/client';

describe('TimescaleDB MCP Integration Tests', () => {
  let postgresMCP: MCPClient;

  beforeAll(async () => {
    // Start PostgreSQL MCP server (for TimescaleDB)
    postgresMCP = new MCPClient('stdio://postgres-mcp-server');
    
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      await postgresMCP.call('execute_query', {
        query: 'DROP TABLE IF EXISTS test_crypto_prices CASCADE'
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Database Schema Operations', () => {
    it('should read database schema', async () => {
      const result = await postgresMCP.call('read_schema');

      expect(result.tables).toBeDefined();
      expect(Array.isArray(result.tables)).toBe(true);
      
      // Should have our crypto tables
      const tableNames = result.tables.map(t => t.name);
      expect(tableNames).toContain('ohlcv_data');
      expect(tableNames).toContain('market_data');
    });

    it('should describe existing table structure', async () => {
      const result = await postgresMCP.call('describe_table', {
        table_name: 'ohlcv_data'
      });

      expect(result.columns).toBeDefined();
      expect(Array.isArray(result.columns)).toBe(true);
      
      const columnNames = result.columns.map(c => c.name);
      expect(columnNames).toContain('timestamp');
      expect(columnNames).toContain('coin_id');
      expect(columnNames).toContain('symbol');
      expect(columnNames).toContain('open');
      expect(columnNames).toContain('high');
      expect(columnNames).toContain('low');
      expect(columnNames).toContain('close');
      expect(columnNames).toContain('volume');
    });
  });

  describe('Table Creation and Management', () => {
    it('should create a test hypertable', async () => {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS test_crypto_prices (
          timestamp TIMESTAMPTZ NOT NULL,
          coin_id TEXT NOT NULL,
          symbol TEXT NOT NULL,
          price DECIMAL(20,8) NOT NULL,
          volume DECIMAL(20,8),
          market_cap DECIMAL(20,2),
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;

      const result = await postgresMCP.call('execute_query', {
        query: createTableQuery
      });

      expect(result.success).toBe(true);
      expect(result.rowCount).toBe(0); // CREATE TABLE returns 0 rows
    });

    it('should convert table to hypertable', async () => {
      const hypertableQuery = `
        SELECT create_hypertable('test_crypto_prices', 'timestamp', 
                                if_not_exists => TRUE)
      `;

      const result = await postgresMCP.call('execute_query', {
        query: hypertableQuery
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Data Insertion', () => {
    it('should insert crypto price data', async () => {
      const insertQuery = `
        INSERT INTO test_crypto_prices (timestamp, coin_id, symbol, price, volume, market_cap)
        VALUES 
          (NOW() - INTERVAL '1 hour', 'bitcoin', 'BTC', 45000.50, 1000000, 850000000000),
          (NOW() - INTERVAL '30 minutes', 'bitcoin', 'BTC', 45100.75, 1200000, 852000000000),
          (NOW(), 'bitcoin', 'BTC', 45200.25, 950000, 854000000000),
          (NOW() - INTERVAL '1 hour', 'ethereum', 'ETH', 3000.25, 800000, 360000000000),
          (NOW() - INTERVAL '30 minutes', 'ethereum', 'ETH', 3050.50, 900000, 365000000000),
          (NOW(), 'ethereum', 'ETH', 3075.75, 750000, 368000000000)
      `;

      const result = await postgresMCP.call('execute_query', {
        query: insertQuery
      });

      expect(result.success).toBe(true);
      expect(result.rowCount).toBe(6);
    });

    it('should handle upsert operations', async () => {
      const upsertQuery = `
        INSERT INTO test_crypto_prices (timestamp, coin_id, symbol, price, volume, market_cap)
        VALUES (NOW(), 'bitcoin', 'BTC', 45300.00, 1100000, 856000000000)
        ON CONFLICT (timestamp, coin_id) DO UPDATE SET
          price = EXCLUDED.price,
          volume = EXCLUDED.volume,
          market_cap = EXCLUDED.market_cap,
          created_at = NOW()
      `;

      const result = await postgresMCP.call('execute_query', {
        query: upsertQuery
      });

      expect(result.success).toBe(true);
      expect(result.rowCount).toBe(1);
    });
  });

  describe('Data Querying', () => {
    it('should query recent crypto prices', async () => {
      const query = `
        SELECT coin_id, symbol, price, volume, timestamp
        FROM test_crypto_prices
        WHERE timestamp > NOW() - INTERVAL '2 hours'
        ORDER BY timestamp DESC
        LIMIT 10
      `;

      const result = await postgresMCP.call('read_query', {
        query: query
      });

      expect(result.rows).toBeDefined();
      expect(Array.isArray(result.rows)).toBe(true);
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.columns).toBeDefined();
      expect(result.rowCount).toBeGreaterThan(0);

      const firstRow = result.rows[0];
      expect(firstRow).toHaveProperty('coin_id');
      expect(firstRow).toHaveProperty('symbol');
      expect(firstRow).toHaveProperty('price');
      expect(firstRow).toHaveProperty('volume');
      expect(firstRow).toHaveProperty('timestamp');
    });

    it('should perform time-based aggregations', async () => {
      const query = `
        SELECT 
          coin_id,
          symbol,
          time_bucket('1 hour', timestamp) AS hour_bucket,
          AVG(price) as avg_price,
          MAX(price) as max_price,
          MIN(price) as min_price,
          SUM(volume) as total_volume,
          COUNT(*) as data_points
        FROM test_crypto_prices
        WHERE timestamp > NOW() - INTERVAL '24 hours'
        GROUP BY coin_id, symbol, hour_bucket
        ORDER BY hour_bucket DESC, coin_id
      `;

      const result = await postgresMCP.call('read_query', {
        query: query
      });

      expect(result.rows).toBeDefined();
      expect(result.rows.length).toBeGreaterThan(0);
      
      const firstRow = result.rows[0];
      expect(firstRow).toHaveProperty('coin_id');
      expect(firstRow).toHaveProperty('hour_bucket');
      expect(firstRow).toHaveProperty('avg_price');
      expect(firstRow).toHaveProperty('max_price');
      expect(firstRow).toHaveProperty('min_price');
      expect(firstRow).toHaveProperty('total_volume');
      expect(firstRow).toHaveProperty('data_points');
    });

    it('should query with parameters', async () => {
      const query = `
        SELECT coin_id, symbol, price, timestamp
        FROM test_crypto_prices
        WHERE coin_id = $1 AND timestamp > $2
        ORDER BY timestamp DESC
        LIMIT $3
      `;

      const result = await postgresMCP.call('read_query', {
        query: query,
        params: ['bitcoin', new Date(Date.now() - 2 * 60 * 60 * 1000), 5]
      });

      expect(result.rows).toBeDefined();
      expect(result.rows.length).toBeGreaterThan(0);
      
      // All rows should be for Bitcoin
      result.rows.forEach(row => {
        expect(row.coin_id).toBe('bitcoin');
      });
    });
  });

  describe('TimescaleDB Specific Features', () => {
    it('should use continuous aggregates', async () => {
      // Create a continuous aggregate view
      const createViewQuery = `
        CREATE MATERIALIZED VIEW IF NOT EXISTS test_crypto_hourly
        WITH (timescaledb.continuous) AS
        SELECT 
          coin_id,
          time_bucket('1 hour', timestamp) AS hour_bucket,
          AVG(price) as avg_price,
          MAX(price) as max_price,
          MIN(price) as min_price,
          LAST(price, timestamp) as last_price,
          SUM(volume) as total_volume
        FROM test_crypto_prices
        GROUP BY coin_id, hour_bucket
        WITH NO DATA
      `;

      const result = await postgresMCP.call('execute_query', {
        query: createViewQuery
      });

      expect(result.success).toBe(true);
    });

    it('should refresh continuous aggregate', async () => {
      const refreshQuery = `
        CALL refresh_continuous_aggregate('test_crypto_hourly', NULL, NULL)
      `;

      const result = await postgresMCP.call('execute_query', {
        query: refreshQuery
      });

      expect(result.success).toBe(true);
    });

    it('should query continuous aggregate', async () => {
      const query = `
        SELECT * FROM test_crypto_hourly
        WHERE hour_bucket > NOW() - INTERVAL '24 hours'
        ORDER BY hour_bucket DESC, coin_id
      `;

      const result = await postgresMCP.call('read_query', {
        query: query
      });

      expect(result.rows).toBeDefined();
      // May be empty if no data has been aggregated yet
    });
  });

  describe('Performance and Compression', () => {
    it('should check chunk information', async () => {
      const query = `
        SELECT 
          chunk_schema,
          chunk_name,
          table_name,
          primary_dimension,
          primary_dimension_type,
          range_start,
          range_end,
          chunk_size,
          compressed_chunk_size
        FROM timescaledb_information.chunks
        WHERE hypertable_name = 'test_crypto_prices'
        ORDER BY range_start DESC
        LIMIT 5
      `;

      const result = await postgresMCP.call('read_query', {
        query: query
      });

      expect(result.rows).toBeDefined();
      // May be empty for new tables
    });

    it('should enable compression on hypertable', async () => {
      const compressionQuery = `
        ALTER TABLE test_crypto_prices 
        SET (timescaledb.compress, 
             timescaledb.compress_segmentby = 'coin_id')
      `;

      const result = await postgresMCP.call('execute_query', {
        query: compressionQuery
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid SQL queries', async () => {
      await expect(postgresMCP.call('read_query', {
        query: 'SELECT * FROM non_existent_table'
      })).rejects.toThrow();
    });

    it('should handle syntax errors', async () => {
      await expect(postgresMCP.call('execute_query', {
        query: 'INVALID SQL SYNTAX'
      })).rejects.toThrow();
    });

    it('should handle constraint violations', async () => {
      const invalidInsert = `
        INSERT INTO test_crypto_prices (timestamp, coin_id, symbol, price)
        VALUES (NULL, 'bitcoin', 'BTC', 45000)
      `;

      await expect(postgresMCP.call('execute_query', {
        query: invalidInsert
      })).rejects.toThrow();
    });
  });

  describe('Connection Management', () => {
    it('should handle concurrent queries', async () => {
      const queries = [
        'SELECT COUNT(*) FROM test_crypto_prices WHERE coin_id = \'bitcoin\'',
        'SELECT COUNT(*) FROM test_crypto_prices WHERE coin_id = \'ethereum\'',
        'SELECT AVG(price) FROM test_crypto_prices WHERE coin_id = \'bitcoin\'',
        'SELECT MAX(timestamp) FROM test_crypto_prices'
      ];

      const promises = queries.map(query => 
        postgresMCP.call('read_query', { query })
      );

      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.rows).toBeDefined();
        expect(result.rowCount).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Data Validation', () => {
    it('should validate inserted data types', async () => {
      const query = `
        SELECT 
          coin_id,
          symbol,
          price,
          volume,
          market_cap,
          timestamp,
          pg_typeof(price) as price_type,
          pg_typeof(volume) as volume_type,
          pg_typeof(timestamp) as timestamp_type
        FROM test_crypto_prices
        LIMIT 1
      `;

      const result = await postgresMCP.call('read_query', {
        query: query
      });

      expect(result.rows.length).toBeGreaterThan(0);
      
      const row = result.rows[0];
      expect(row.price_type).toContain('numeric');
      expect(row.volume_type).toContain('numeric');
      expect(row.timestamp_type).toContain('timestamp');
    });

    it('should validate data integrity', async () => {
      const query = `
        SELECT 
          coin_id,
          COUNT(*) as record_count,
          MIN(price) as min_price,
          MAX(price) as max_price,
          AVG(price) as avg_price,
          MIN(timestamp) as earliest_timestamp,
          MAX(timestamp) as latest_timestamp
        FROM test_crypto_prices
        GROUP BY coin_id
        ORDER BY coin_id
      `;

      const result = await postgresMCP.call('read_query', {
        query: query
      });

      expect(result.rows.length).toBeGreaterThan(0);
      
      result.rows.forEach(row => {
        expect(row.record_count).toBeGreaterThan(0);
        expect(row.min_price).toBeGreaterThan(0);
        expect(row.max_price).toBeGreaterThanOrEqual(row.min_price);
        expect(row.avg_price).toBeGreaterThan(0);
        expect(new Date(row.latest_timestamp)).toBeInstanceOf(Date);
        expect(new Date(row.earliest_timestamp)).toBeInstanceOf(Date);
      });
    });
  });
});