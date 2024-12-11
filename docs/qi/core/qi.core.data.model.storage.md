# Project Source Code Documentation

## storage

### sequelize

#### index.ts

```typescript
/**
 * @fileoverview Base TimescaleDB storage types and utilities
 * @module @qi/core/data/models/storage/sequelize/index
 * @file @qi/core/data/models/storage/sequelize/index.ts
 *
 * @description
 * Provides core storage functionality for TimescaleDB including:
 * - Base model types and interfaces
 * - Storage manager implementation
 * - Model registration system
 * - TimescaleDB specific operations (hypertables, compression, retention)
 *
 * @author Zhifeng Zhang
 * @created 2024-12-11
 */

/**
 * @fileoverview Base TimescaleDB storage types and utilities
 * @module @qi/core/data/models/storage/sequelize/index
 */

import { Model, Optional, Sequelize, QueryTypes } from "sequelize";
import { ErrorCode } from "@qi/core/errors";
import { MarketDataError } from "@qi/core/data";

// Core model types
export interface BaseModelAttributes {
  id: number;
  created_at: Date;
  updated_at: Date;
}

export type BaseCreationAttributes = Optional<
  BaseModelAttributes,
  "id" | "created_at" | "updated_at"
>;

// Model registration options
export interface ModelRegistrationOptions {
  tableName: string;
  timeColumn?: string;
  chunkInterval?: string;
  retentionPeriod?: string;
  compression?: {
    segmentBy: string[];
    orderBy: string[];
    after?: string;
  };
}

// Static interface for time series models
export interface TimeSeriesModelClass<M extends Model = Model> {
  new (): M;
  _storage: TimescaleDBStorage;
  initModel(sequelize: Sequelize): void;
  register(
    storage: TimescaleDBStorage,
    options: ModelRegistrationOptions
  ): Promise<void>;
  getStorage(): TimescaleDBStorage;
  createHypertable(
    tableName: string,
    timeColumn?: string,
    chunkInterval?: string
  ): Promise<void>;
  addCompressionPolicy(
    tableName: string,
    segmentBy: string[],
    orderBy: string[],
    after?: string
  ): Promise<void>;
  addRetentionPolicy(tableName: string, period?: string): Promise<void>;
  createMatView(
    viewName: string,
    tableName: string,
    timeColumn: string,
    interval: string,
    aggregates: string[]
  ): Promise<void>;
}

// Base model implementation
export abstract class BaseTimeSeriesModel<
  TAttributes extends BaseModelAttributes,
  TCreation extends BaseCreationAttributes,
> extends Model<TAttributes, TCreation> {
  protected static _storage: TimescaleDBStorage;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static initModel(sequelize: Sequelize): void {
    throw new Error("Model must implement initModel");
  }

  static async register(
    storage: TimescaleDBStorage,
    options: ModelRegistrationOptions
  ): Promise<void> {
    this._storage = storage;
    this.initModel(storage.sequelize);

    await this.createHypertable(
      options.tableName,
      options.timeColumn,
      options.chunkInterval
    );

    if (options.compression) {
      await this.addCompressionPolicy(
        options.tableName,
        options.compression.segmentBy,
        options.compression.orderBy,
        options.compression.after
      );
    }

    if (options.retentionPeriod) {
      await this.addRetentionPolicy(options.tableName, options.retentionPeriod);
    }
  }

  static getStorage(): TimescaleDBStorage {
    if (!this._storage) {
      throw MarketDataError.createStorageError(
        "Model not initialized with storage instance"
      );
    }
    return this._storage;
  }

  protected static async executeQuery<T extends Record<string, unknown>>(
    sql: string,
    replacements?: Record<string, unknown>,
    type: QueryTypes = QueryTypes.SELECT
  ): Promise<T[]> {
    try {
      const results = await this.getStorage().sequelize.query<T>(sql, {
        type,
        replacements,
        logging: false,
      });
      return results as T[]; // We can safely assert this because of the QueryTypes.SELECT
    } catch (error) {
      throw MarketDataError.createStorageError("Query failed", {
        cause: error,
      });
    }
  }

  static async createHypertable(
    tableName: string,
    timeColumn = "created_at",
    chunkInterval = "1 day"
  ): Promise<void> {
    await this.executeQuery(`
      SELECT create_hypertable(
        '${tableName}',
        '${timeColumn}',
        chunk_time_interval => INTERVAL '${chunkInterval}',
        if_not_exists => TRUE
      );
    `);
  }

  static async addCompressionPolicy(
    tableName: string,
    segmentBy: string[],
    orderBy: string[],
    after = "30 days"
  ): Promise<void> {
    await this.executeQuery(`
      ALTER TABLE ${tableName} SET (
        timescaledb.compress,
        timescaledb.compress_segmentby = '${segmentBy.join(", ")}',
        timescaledb.compress_orderby = '${orderBy.join(", ")}'
      );

      SELECT add_compression_policy(
        '${tableName}',
        INTERVAL '${after}',
        if_not_exists => true
      );
    `);
  }

  static async addRetentionPolicy(
    tableName: string,
    period = "2 years"
  ): Promise<void> {
    await this.executeQuery(`
      SELECT add_retention_policy(
        '${tableName}',
        INTERVAL '${period}',
        if_not_exists => true
      );
    `);
  }

  static async createMatView(
    viewName: string,
    tableName: string,
    timeColumn: string,
    interval: string,
    aggregates: string[]
  ): Promise<void> {
    const aggregateColumns = aggregates.join(",\n      ");
    await this.executeQuery(
      `
      CREATE MATERIALIZED VIEW IF NOT EXISTS ${viewName}
      WITH (timescaledb.continuous) AS
      SELECT
        time_bucket(:interval, ${timeColumn}) AS bucket,
        ${aggregateColumns}
      FROM ${tableName}
      GROUP BY bucket;

      SELECT add_continuous_aggregate_policy(:viewName,
        start_offset => INTERVAL '1 month',
        end_offset => INTERVAL '1 hour',
        schedule_interval => INTERVAL '1 hour'
      );
    `,
      { interval, viewName }
    );
  }
}

// Storage manager
export class TimescaleDBStorage {
  constructor(readonly sequelize: Sequelize) {}
  private initialized = false;
  private models = new Map<string, TimeSeriesModelClass>();

  async initialize(): Promise<void> {
    if (this.initialized) {
      throw MarketDataError.createStorageError("Storage already initialized");
    }
    await this.verifyTimescaleDB();
    this.initialized = true;
  }

  async registerModel(
    ModelClass: TimeSeriesModelClass,
    options: ModelRegistrationOptions
  ): Promise<void> {
    if (!this.initialized) {
      throw MarketDataError.createStorageError("Storage not initialized");
    }

    await ModelClass.register(this, options);
    this.models.set(options.tableName, ModelClass);
  }

  private async verifyTimescaleDB(): Promise<void> {
    try {
      const result = await this.sequelize.query<{ installed_version: string }>(
        "SELECT installed_version FROM pg_available_extensions WHERE name = 'timescaledb'",
        {
          type: QueryTypes.SELECT,
          plain: true,
        }
      );

      if (!result?.installed_version) {
        throw MarketDataError.createStorageError(
          "TimescaleDB extension not available",
          { code: ErrorCode.STORAGE_CONNECTION_ERROR }
        );
      }
    } catch (error) {
      throw MarketDataError.createStorageError("Failed to verify TimescaleDB", {
        cause: error,
      });
    }
  }

  async close(): Promise<void> {
    if (this.initialized) {
      await this.sequelize.close();
      this.initialized = false;
      this.models.clear();
    }
  }
}

export default TimescaleDBStorage;

```

#### cryptocompare

##### types.ts

```typescript
/**
 * @fileoverview CryptoCompare storage types
 * @module @qi/core/data/models/storage/sequelize/cryptocompare/types
 *
 * @description
 * Shared type definitions for CryptoCompare storage models.
 * Includes base model attributes and query interfaces.
 *
 * @author Zhifeng Zhang
 * @created 2024-12-10
 */

import { Model, Optional, Sequelize } from "sequelize";
import type {
  CryptoCompareOHLCVData,
  CryptoCompareTickData,
} from "../../../sources/cryptocompare/response.js";
import { ApplicationError, ErrorCode } from "@qi/core/errors";

/**
 * Base attributes shared by all models
 */
export interface BaseModelAttributes {
  id: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Base creation attributes excluding auto-generated fields
 */
export type BaseCreationAttributes = Optional<
  BaseModelAttributes,
  "id" | "created_at" | "updated_at"
>;

/**
 * Time range query parameters
 */
export interface TimeRangeQuery {
  market: string;
  instrument: string;
  startTime: number;
  endTime: number;
  interval?: string;
}

/**
 * OHLCV model attributes
 */
export interface OHLCVAttributes extends BaseModelAttributes {
  raw_data: CryptoCompareOHLCVData;
}

export interface OHLCVCreationAttributes extends BaseCreationAttributes {
  raw_data: CryptoCompareOHLCVData;
}

/**
 * Tick model attributes
 */
export interface TickAttributes extends BaseModelAttributes {
  raw_data: CryptoCompareTickData;
}

export interface TickCreationAttributes extends BaseCreationAttributes {
  raw_data: CryptoCompareTickData;
}

/**
 * Base model with common functionality
 */
export abstract class BaseTimeSeriesModel<
  TModelAttributes extends BaseModelAttributes,
  TCreationAttributes extends BaseCreationAttributes,
> extends Model<TModelAttributes, TCreationAttributes> {
  declare id: number;
  declare created_at: Date;
  declare updated_at: Date;

  /**
   * Get sequelize instance with type safety
   */
  protected static getSequelize(): Sequelize {
    if (!this.sequelize) {
      throw new ApplicationError(
        "Model not initialized with Sequelize instance",
        ErrorCode.INITIALIZATION_ERROR,
        500
      );
    }
    return this.sequelize;
  }

  /**
   * Create TimescaleDB hypertable
   */
  static async createHypertable(tableName: string): Promise<void> {
    const sequelize = this.getSequelize();
    await sequelize.query(`
      SELECT create_hypertable(
        '${tableName}',
        'created_at',
        chunk_time_interval => INTERVAL '1 day',
        if_not_exists => TRUE
      );
    `);
  }

  /**
   * Create continuous aggregate view
   */
  static async createMatView(
    viewName: string,
    tableName: string,
    interval: string
  ): Promise<void> {
    const sequelize = this.getSequelize();
    await sequelize.query(
      `
      CREATE MATERIALIZED VIEW IF NOT EXISTS ${viewName}
      WITH (timescaledb.continuous) AS
      SELECT
        time_bucket(:interval, created_at) AS bucket,
        raw_data->>'MARKET' AS market,
        raw_data->>'INSTRUMENT' AS instrument,
        first(raw_data, created_at) AS raw_data
      FROM ${tableName}
      GROUP BY bucket, market, instrument;

      SELECT add_continuous_aggregate_policy(:viewName,
        start_offset => INTERVAL '1 month',
        end_offset => INTERVAL '1 hour',
        schedule_interval => INTERVAL '1 hour'
      );
    `,
      {
        replacements: { interval, viewName },
      }
    );
  }
}

```

##### migrations

###### ohlcv.ts

```typescript
/**
 * @fileoverview OHLCV hypertable migration for TimescaleDB
 * @module @qi/core/data/models/storage/sequelize/cryptocompare/migrations
 *
 * @description
 * Creates OHLCV hypertable with comprehensive indexes and retention policies.
 * Optimized for time-series queries with automatic data management.
 *
 * @author Zhifeng Zhang
 * @created 2024-12-10
 */

import { QueryInterface } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    // Create TimescaleDB extension if not exists
    await queryInterface.sequelize.query(
      "CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;"
    );

    // Create base table with JSONB for raw data storage
    await queryInterface.createTable("cryptocompare_ohlcv", {
      // Table schema omitted for brevity
    });

    // Create computed columns
    await queryInterface.sequelize.query(`
      // Computed column definitions omitted for brevity
    `);

    // Create hypertable
    await queryInterface.sequelize.query(`
      SELECT create_hypertable(
        'cryptocompare_ohlcv',
        'time_value',
        chunk_time_interval => INTERVAL '1 day',
        if_not_exists => TRUE
      );
    `);

    // Create indexes
    await queryInterface.sequelize.query(`
      // Index definitions omitted for brevity
    `);

    // Create continuous aggregate views
    await queryInterface.sequelize.query(`
      // Aggregate view definitions omitted for brevity
    `);

    // Add refresh policies for continuous aggregates
    await queryInterface.sequelize.query(`
      // Aggregate refresh policy definitions omitted for brevity
    `);

    // Add retention and compression policies
    await queryInterface.sequelize.query(`
      // Retention and compression policy definitions omitted for brevity
    `);
  },

  async down(queryInterface: QueryInterface) {
    // Remove policies
    await queryInterface.sequelize.query(`
      // Policy removal definitions omitted for brevity
    `);

    // Drop continuous aggregate views
    await queryInterface.sequelize.query(`
      // Aggregate view drop definitions omitted for brevity
    `);

    // Drop base table (hypertable)
    await queryInterface.dropTable("cryptocompare_ohlcv");
  },
};

```

###### tick.ts

```typescript
/**
 * @fileoverview Tick data hypertable migration for TimescaleDB
 * @module @qi/core/data/models/storage/sequelize/cryptocompare/migrations
 *
 * @description
 * Creates tick data hypertable with proper indexes for time-series data.
 * Implements TimescaleDB-specific features and ensures data integrity.
 *
 * @author Zhifeng Zhang
 * @created 2024-12-10
 */

import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    // Ensure TimescaleDB extension
    await queryInterface.sequelize.query(
      "CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;"
    );

    // Create base table with JSONB for raw data storage
    await queryInterface.createTable("cryptocompare_ticks", {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      raw_data: {
        type: DataTypes.JSONB,
        allowNull: false,
        comment: "Complete tick data from CryptoCompare API",
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    // Create computed columns for efficient querying
    await queryInterface.sequelize.query(`
      ALTER TABLE cryptocompare_ticks 
      ADD COLUMN time_value TIMESTAMP GENERATED ALWAYS AS (
        to_timestamp((raw_data->>'PRICE_LAST_UPDATE_TS')::bigint)
      ) STORED;
    `);

    // Create hypertable
    await queryInterface.sequelize.query(`
      SELECT create_hypertable(
        'cryptocompare_ticks',
        'time_value',
        chunk_time_interval => INTERVAL '1 hour',
        if_not_exists => TRUE
      );
    `);

    // Create indexes
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_ticks_market_instrument_time ON cryptocompare_ticks (
        ((raw_data->>'MARKET')::text),
        ((raw_data->>'INSTRUMENT')::text),
        time_value
      );

      CREATE UNIQUE INDEX idx_ticks_market_instrument_sequence ON cryptocompare_ticks (
        ((raw_data->>'MARKET')::text),
        ((raw_data->>'INSTRUMENT')::text),
        ((raw_data->>'CCSEQ')::bigint)
      );

      CREATE INDEX idx_ticks_price ON cryptocompare_ticks USING btree (
        ((raw_data->>'PRICE')::numeric)
      );
    `);

    // Create minutely continuous aggregate view
    await queryInterface.sequelize.query(`
      CREATE MATERIALIZED VIEW cryptocompare_ticks_minute
      WITH (timescaledb.continuous) AS
      SELECT
        time_bucket('1 minute', time_value) AS bucket,
        (raw_data->>'MARKET')::text AS market,
        (raw_data->>'INSTRUMENT')::text AS instrument,
        first(raw_data, time_value) AS first_tick,
        last(raw_data, time_value) AS last_tick,
        count(*) as tick_count
      FROM cryptocompare_ticks
      GROUP BY bucket, market, instrument;

      SELECT add_continuous_aggregate_policy('cryptocompare_ticks_minute',
        start_offset => INTERVAL '1 day',
        end_offset => INTERVAL '1 minute',
        schedule_interval => INTERVAL '1 minute'
      );
    `);
  },

  async down(queryInterface: QueryInterface) {
    // Drop continuous aggregate views
    await queryInterface.sequelize.query(
      "DROP MATERIALIZED VIEW IF EXISTS cryptocompare_ticks_minute CASCADE;"
    );

    // Drop base table (hypertable)
    await queryInterface.dropTable("cryptocompare_ticks");
  },
};

```

##### models

###### index.ts

```typescript
import { TimescaleDBStorage } from "../../index.js";
import { CryptoCompareOHLCV } from "./ohlcv.js";
import { CryptoCompareTick } from "./tick.js";

export async function registerCryptoCompareModels(
  storage: TimescaleDBStorage
): Promise<void> {
  // Register OHLCV model
  await storage.registerModel(CryptoCompareOHLCV, {
    tableName: "cryptocompare_ohlcv",
    timeColumn: "time_value",
    compression: {
      segmentBy: ["market", "instrument"],
      orderBy: ["time_value DESC"],
    },
    retentionPeriod: "2 years",
  });

  // Register Tick model
  await storage.registerModel(CryptoCompareTick, {
    tableName: "cryptocompare_ticks",
    timeColumn: "time_value",
    chunkInterval: "1 hour",
  });
}
```

###### ohlcv.ts

```typescript
/**
 * @fileoverview OHLCV storage model for TimescaleDB
 * @module @qi/core/data/models/storage/sequelize/cryptocompare/models/ohlcv
 *
 * @description
 * TimescaleDB model for CryptoCompare OHLCV data.
 * Implements hypertable support and efficient time-series queries.
 *
 * @example
 * ```typescript
 * const data = await CryptoCompareOHLCV.queryTimeRange({
 *   market: 'Binance',
 *   instrument: 'BTC-USD',
 *   startTime: Date.now() - 86400000,
 *   endTime: Date.now()
 * });
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-12-10
 */

import {
  DataTypes,
  ModelAttributes,
  InitOptions,
  Sequelize,
  QueryTypes,
  Transaction,
} from "sequelize";
import {
  BaseTimeSeriesModel,
  OHLCVAttributes,
  OHLCVCreationAttributes,
  TimeRangeQuery,
} from "../types.js";
import type { CryptoCompareOHLCVData } from "../../../../sources/cryptocompare/response.js";

/**
 * Raw query result type for OHLCV data
 */
interface OHLCVQueryResult {
  raw_data: CryptoCompareOHLCVData;
}

export class CryptoCompareOHLCV extends BaseTimeSeriesModel<
  OHLCVAttributes,
  OHLCVCreationAttributes
> {
  declare raw_data: CryptoCompareOHLCVData;

  /**
   * Query OHLCV data with time range and optional aggregation
   */
  static async queryTimeRange({
    market,
    instrument,
    startTime,
    endTime,
    interval,
  }: TimeRangeQuery): Promise<CryptoCompareOHLCVData[]> {
    const sequelize = this.getSequelize();
    const timeColumn = `((raw_data->>'TIMESTAMP')::bigint * 1000)::timestamp`;

    let query = `
      SELECT raw_data
      FROM cryptocompare_ohlcv
      WHERE raw_data->>'MARKET' = :market
        AND raw_data->>'INSTRUMENT' = :instrument
        AND ${timeColumn} >= :startTime
        AND ${timeColumn} < :endTime
      ORDER BY ${timeColumn}
    `;

    if (interval) {
      // Use continuous aggregate view if available
      const viewName = `cryptocompare_ohlcv_${interval}`;
      query = `
        SELECT raw_data
        FROM ${viewName}
        WHERE market = :market
          AND instrument = :instrument
          AND bucket >= :startTime
          AND bucket < :endTime
        ORDER BY bucket
      `;
    }

    const results = await sequelize.query<OHLCVQueryResult>(query, {
      type: QueryTypes.SELECT,
      replacements: {
        market,
        instrument,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
    });

    return results.map((r) => r.raw_data);
  }

  /**
   * Bulk upsert OHLCV data
   */
  static async bulkUpsert(
    data: CryptoCompareOHLCVData[],
    transaction?: Transaction
  ): Promise<CryptoCompareOHLCV[]> {
    const records = data.map((raw_data) => ({
      raw_data,
      created_at: new Date(raw_data.TIMESTAMP * 1000),
    }));

    return await this.bulkCreate(records, {
      transaction,
      updateOnDuplicate: ["raw_data", "updated_at"],
      returning: true,
    });
  }

  static initModel(sequelize: Sequelize): typeof CryptoCompareOHLCV {
    const attributes: ModelAttributes<CryptoCompareOHLCV, OHLCVAttributes> = {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      raw_data: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    };

    const options: InitOptions = {
      sequelize,
      tableName: "cryptocompare_ohlcv",
      modelName: "CryptoCompareOHLCV",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: [
            Sequelize.literal("((raw_data->>'MARKET')::text)"),
            Sequelize.literal("((raw_data->>'INSTRUMENT')::text)"),
            Sequelize.literal("((raw_data->>'TIMESTAMP')::bigint)"),
          ],
          unique: true,
          name: "idx_ohlcv_market_instrument_time",
        },
      ],
    };

    CryptoCompareOHLCV.init(attributes, options);
    return CryptoCompareOHLCV;
  }
}

```

###### tick.ts

```typescript
/**
 * @fileoverview Tick storage model for TimescaleDB
 * @module @qi/core/data/models/storage/sequelize/cryptocompare/models/tick
 *
 * @description
 * TimescaleDB model for CryptoCompare tick data.
 * Implements hypertable support and efficient time-series queries.
 *
 * @author Zhifeng Zhang
 * @created 2024-12-10
 */

import {
  DataTypes,
  ModelAttributes,
  InitOptions,
  Sequelize,
  QueryTypes,
  Transaction,
} from "sequelize";
import {
  BaseTimeSeriesModel,
  TickAttributes,
  TickCreationAttributes,
  TimeRangeQuery,
} from "../types.js";
import type { CryptoCompareTickData } from "../../../../sources/cryptocompare/response.js";

/**
 * Raw query result type for tick data
 */
interface TickQueryResult {
  raw_data: CryptoCompareTickData;
}

export class CryptoCompareTick extends BaseTimeSeriesModel<
  TickAttributes,
  TickCreationAttributes
> {
  declare raw_data: CryptoCompareTickData;

  /**
   * Query tick data with time range
   */
  static async queryTimeRange({
    market,
    instrument,
    startTime,
    endTime,
  }: TimeRangeQuery): Promise<CryptoCompareTickData[]> {
    const sequelize = this.getSequelize();
    const timeColumn = `((raw_data->>'PRICE_LAST_UPDATE_TS')::bigint * 1000)::timestamp`;

    const query = `
      SELECT raw_data
      FROM cryptocompare_ticks
      WHERE raw_data->>'MARKET' = :market
        AND raw_data->>'INSTRUMENT' = :instrument
        AND ${timeColumn} >= :startTime
        AND ${timeColumn} < :endTime
      ORDER BY raw_data->>'CCSEQ'
    `;

    const results = await sequelize.query<TickQueryResult>(query, {
      type: QueryTypes.SELECT,
      replacements: {
        market,
        instrument,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
    });

    return results.map((r) => r.raw_data);
  }

  /**
   * Bulk upsert tick data
   */
  static async bulkUpsert(
    data: CryptoCompareTickData[],
    transaction?: Transaction
  ): Promise<CryptoCompareTick[]> {
    const records = data.map((raw_data) => ({
      raw_data,
      created_at: new Date(raw_data.PRICE_LAST_UPDATE_TS * 1000),
    }));

    return await this.bulkCreate(records, {
      transaction,
      updateOnDuplicate: ["raw_data", "updated_at"],
      returning: true,
    });
  }

  static initModel(sequelize: Sequelize): typeof CryptoCompareTick {
    const attributes: ModelAttributes<CryptoCompareTick, TickAttributes> = {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      raw_data: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    };

    const options: InitOptions = {
      sequelize,
      tableName: "cryptocompare_ticks",
      modelName: "CryptoCompareTick",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: [
            Sequelize.literal("((raw_data->>'MARKET')::text)"),
            Sequelize.literal("((raw_data->>'INSTRUMENT')::text)"),
            Sequelize.literal("((raw_data->>'CCSEQ')::bigint)"),
          ],
          unique: true,
          name: "idx_tick_sequence",
        },
        {
          fields: [
            Sequelize.literal("((raw_data->>'PRICE_LAST_UPDATE_TS')::bigint)"),
            Sequelize.literal("((raw_data->>'MARKET')::text)"),
            Sequelize.literal("((raw_data->>'INSTRUMENT')::text)"),
          ],
          name: "idx_tick_time_series",
        },
      ],
    };

    CryptoCompareTick.init(attributes, options);
    return CryptoCompareTick;
  }
}

```

