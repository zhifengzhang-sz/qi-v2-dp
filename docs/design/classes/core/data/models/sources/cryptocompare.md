<blockquote>

we need  to make sure the storage data schema is the same structure of the data source (the model should depends oon data source, in other words, each data source requires its own db data model, same for kafka)

</blockquote>

---

I understand now - we need to maintain data source fidelity in storage. Let me revise the approach:

1. Each data source should have its own storage models that exactly match its data structure
2. Store raw data source format rather than transforming to base types for storage
3. Transform to base types only when retrieving/using the data
4. Each data source needs its own database tables and Kafka topics



```typescript
/**
 * CryptoCompare-specific models and schemas
 */
// core/data/models/sources/cryptocompare/types.ts
export interface CryptoCompareOHLCV {
  UNIT: string;             // Time unit (MINUTE, HOUR, DAY)
  TIMESTAMP: number;        // Unix timestamp in seconds
  TYPE: string;            // Message type identifier
  MARKET: string;          // Exchange identifier
  INSTRUMENT: string;      // Trading pair 
  MAPPED_INSTRUMENT: string; // Standardized instrument ID
  BASE: string;            // Base currency
  QUOTE: string;           // Quote currency
  OPEN: number;
  HIGH: number;
  LOW: number;
  CLOSE: number;
  VOLUME: number;
  QUOTE_VOLUME: number;
  TOTAL_TRADES: number;
}

// core/data/models/storage/sequelize/cryptocompare/models.ts
import { Model, DataTypes } from 'sequelize';

export class CryptoCompareOHLCVModel extends Model implements CryptoCompareOHLCV {
  public UNIT!: string;
  public TIMESTAMP!: number;
  public TYPE!: string;
  public MARKET!: string;
  public INSTRUMENT!: string;
  public MAPPED_INSTRUMENT!: string;
  public BASE!: string;
  public QUOTE!: string;
  public OPEN!: number;
  public HIGH!: number;
  public LOW!: number;
  public CLOSE!: number;
  public VOLUME!: number;
  public QUOTE_VOLUME!: number;
  public TOTAL_TRADES!: number;

  // Metadata fields
  public id!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
  public sourceTimestamp!: number; // When data was fetched
}

export const CryptoCompareOHLCVSchema = {
  UNIT: {
    type: DataTypes.STRING,
    allowNull: false
  },
  TIMESTAMP: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  TYPE: {
    type: DataTypes.STRING,
    allowNull: false
  },
  MARKET: {
    type: DataTypes.STRING,
    allowNull: false
  },
  INSTRUMENT: {
    type: DataTypes.STRING,
    allowNull: false
  },
  MAPPED_INSTRUMENT: {
    type: DataTypes.STRING,
    allowNull: false
  },
  BASE: {
    type: DataTypes.STRING,
    allowNull: false
  },
  QUOTE: {
    type: DataTypes.STRING,
    allowNull: false  
  },
  OPEN: {
    type: DataTypes.DECIMAL(24, 8),
    allowNull: false
  },
  HIGH: {
    type: DataTypes.DECIMAL(24, 8),
    allowNull: false
  },
  LOW: {
    type: DataTypes.DECIMAL(24, 8),
    allowNull: false
  },
  CLOSE: {
    type: DataTypes.DECIMAL(24, 8),
    allowNull: false
  },
  VOLUME: {
    type: DataTypes.DECIMAL(24, 8),
    allowNull: false
  },
  QUOTE_VOLUME: {
    type: DataTypes.DECIMAL(24, 8),
    allowNull: false
  },
  TOTAL_TRADES: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sourceTimestamp: {
    type: DataTypes.BIGINT,
    allowNull: false
  }
};

// core/data/models/storage/avro/cryptocompare/schemas.ts
export const CryptoCompareOHLCVAvroSchema = {
  type: 'record',
  name: 'CryptoCompareOHLCV',
  namespace: 'market.data.cryptocompare',
  fields: [
    { name: 'UNIT', type: 'string' },
    { name: 'TIMESTAMP', type: 'long' },
    { name: 'TYPE', type: 'string' },
    { name: 'MARKET', type: 'string' },
    { name: 'INSTRUMENT', type: 'string' },
    { name: 'MAPPED_INSTRUMENT', type: 'string' },
    { name: 'BASE', type: 'string' },
    { name: 'QUOTE', type: 'string' },
    { name: 'OPEN', type: 'double' },
    { name: 'HIGH', type: 'double' },
    { name: 'LOW', type: 'double' },
    { name: 'CLOSE', type: 'double' },
    { name: 'VOLUME', type: 'double' },
    { name: 'QUOTE_VOLUME', type: 'double' },
    { name: 'TOTAL_TRADES', type: 'int' },
    { name: 'sourceTimestamp', type: 'long' }
  ]
};

/**
 * Transform stored CryptoCompare data to base type when needed
 */
// core/data/transforms/cryptocompare.ts
import { OHLCV } from "../../base/types";

export function cryptoCompareToBase(data: CryptoCompareOHLCV): OHLCV {
  return {
    exchange: data.MARKET.toLowerCase(),
    symbol: data.MAPPED_INSTRUMENT,
    timestamp: data.TIMESTAMP * 1000,
    open: data.OPEN,
    high: data.HIGH,
    low: data.LOW, 
    close: data.CLOSE,
    volume: data.VOLUME,
    quoteVolume: data.QUOTE_VOLUME,
    trades: data.TOTAL_TRADES
  };
}

/**
 * Database migration for CryptoCompare OHLCV table
 */
// core/data/models/storage/sequelize/cryptocompare/migrations/01_create_ohlcv.ts
export const createCryptoCompareOHLCVTable = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cryptocompare_ohlcv', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      // Add all fields from CryptoCompareOHLCVSchema
      ...CryptoCompareOHLCVSchema,
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE, 
        allowNull: false
      }
    }, {
      indexes: [
        {
          fields: ['MARKET', 'INSTRUMENT', 'TIMESTAMP']
        },
        {
          fields: ['TIMESTAMP']
        }
      ],
      // TimescaleDB specific
      hypertableDef: {
        timeDimension: 'TIMESTAMP',
        chunkTimeInterval: '1 day'
      }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('cryptocompare_ohlcv');
  }
};

```

Key changes in this approach:

1. Storage Models:
- Each data source has its own exact database schema
- Store data in original format with source-specific fields
- Add minimal metadata (ids, timestamps) for storage

2. Data Flow:
- Store raw API response format directly 
- Transform to base types only when needed for business logic
- Maintain source data fidelity

3. Database Structure:
- Separate tables per data source
- Source-specific indexes and constraints
- TimescaleDB hypertables per source

4. Kafka Topics:
- Source-specific Avro schemas
- Separate topics per data source
- Preserve original field names and types

This maintains data source fidelity while still allowing transformation to common base types when needed. Each source's data is isolated and stored in its original form.

Let me know if you want me to:
1. Add more data source models
2. Implement the data fetching layer
3. Set up database migrations
4. Add Kafka producers/consumers