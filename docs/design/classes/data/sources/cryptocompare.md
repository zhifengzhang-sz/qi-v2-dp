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

---

Yes, we can add comprehensive JSDoc documentation as a final polish phase. Let's move forward with implementing the data fetching layer.

```typescript
// core/data/sources/cryptocompare/client.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { CryptoCompareConfig, CryptoCompareError } from './types';
import rateLimit from 'axios-rate-limit';
import { delay } from '@qi/core/utils';

export class CryptoCompareClient {
  private client: AxiosInstance;
  private config: CryptoCompareConfig;

  constructor(config: CryptoCompareConfig) {
    this.config = config;

    // Create base axios client
    const baseClient = axios.create({
      baseURL: config.baseUrl || 'https://data-api.cryptocompare.com',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Apikey ${config.apiKey}`
      }
    });

    // Add rate limiting
    this.client = rateLimit(baseClient, { 
      maxRequests: config.rateLimit.requestsPerSecond,
      perMilliseconds: 1000
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      this.handleError
    );
  }

  private async handleError(error: AxiosError) {
    if (error.response) {
      // API error response
      const errorData = error.response.data?.Err;
      if (errorData) {
        throw new CryptoCompareError(
          errorData.message || 'API Error',
          ErrorCode.API_ERROR,
          error.response.status,
          {
            type: errorData.type,
            details: errorData.other_info
          }
        );
      }
    } else if (error.request) {
      // Network error
      throw new CryptoCompareError(
        'Network error occurred',
        ErrorCode.CONNECTION_ERROR,
        StatusCode.BAD_GATEWAY
      );
    }
    throw error;
  }

  async fetchOHLCV(params: OHLCVParams, retries = 3): Promise<CryptoCompareOHLCVResponse> {
    const endpoint = `/spot/v1/historical/${getIntervalEndpoint(params.interval)}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.client.get(endpoint, { params });
        return response.data;
      } catch (error) {
        if (error instanceof CryptoCompareError) {
          if (error.code === ErrorCode.RATE_LIMIT_EXCEEDED) {
            // Back off and retry
            await delay(Math.pow(2, attempt) * 1000);
            continue;
          }
        }
        throw error;
      }
    }
    throw new CryptoCompareError(
      'Max retries exceeded',
      ErrorCode.OPERATION_TIMEOUT,
      StatusCode.GATEWAY_TIMEOUT
    );
  }

  async fetchTrades(params: TradeParams): Promise<CryptoCompareTradeResponse> {
    // Similar implementation for trades endpoint
  }
}

// core/data/sources/cryptocompare/fetcher.ts
export class CryptoCompareDataFetcher {
  private client: CryptoCompareClient;
  private cache: DataCache;

  constructor(config: CryptoCompareConfig) {
    this.client = new CryptoCompareClient(config);
    this.cache = new DataCache();
  }

  async fetchHistoricalOHLCV(query: MarketDataQuery): Promise<CryptoCompareOHLCVResponse> {
    const cacheKey = this.buildCacheKey(query);
    
    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Convert query params to API format
    const params = this.buildOHLCVParams(query);
    
    try {
      const response = await this.client.fetchOHLCV(params);
      
      // Validate response data
      this.validateOHLCVResponse(response);

      // Cache successful response
      await this.cache.set(cacheKey, response);

      return response;

    } catch (error) {
      // Log error details
      logger.error('Failed to fetch OHLCV data', {
        provider: 'cryptocompare',
        query,
        error: error instanceof Error ? error.message : error
      });

      throw error;
    }
  }

  private buildOHLCVParams(query: MarketDataQuery): OHLCVParams {
    return {
      market: query.exchange,
      instrument: query.symbol,
      limit: query.limit || 2000,
      aggregate: INTERVAL_AGGREGATION[query.interval] || 1,
      response_format: 'JSON'
    };
  }

  private validateOHLCVResponse(response: CryptoCompareOHLCVResponse) {
    if (!response.Data?.Data?.length) {
      throw new CryptoCompareError(
        'Invalid response: no data returned',
        ErrorCode.VALIDATION_ERROR,
        StatusCode.BAD_GATEWAY
      );
    }
    // Add more validation as needed
  }

  private buildCacheKey(query: MarketDataQuery): string {
    return `cryptocompare:ohlcv:${query.exchange}:${query.symbol}:${query.interval}:${query.start}:${query.end}`;
  }
}

```

Key components:

1. CryptoCompareClient:
- Handles HTTP requests with rate limiting
- Manages retries and error handling
- Transforms API errors into domain errors

2. CryptoCompareDataFetcher:
- Higher-level fetcher that implements business logic
- Handles caching and validation
- Converts between internal and API formats

Next steps:
1. Implement websocket client for real-time data
2. Set up database writer to store fetched data
3. Create Kafka producer to stream updates
4. Add monitoring and metrics

---

Yes, we can add comprehensive JSDoc documentation as a final polish phase. Let's move forward with implementing the data fetching layer.



```typescript
// core/data/sources/cryptocompare/client.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { CryptoCompareConfig, CryptoCompareError } from './types';
import rateLimit from 'axios-rate-limit';
import { delay } from '@qi/core/utils';

export class CryptoCompareClient {
  private client: AxiosInstance;
  private config: CryptoCompareConfig;

  constructor(config: CryptoCompareConfig) {
    this.config = config;

    // Create base axios client
    const baseClient = axios.create({
      baseURL: config.baseUrl || 'https://data-api.cryptocompare.com',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Apikey ${config.apiKey}`
      }
    });

    // Add rate limiting
    this.client = rateLimit(baseClient, { 
      maxRequests: config.rateLimit.requestsPerSecond,
      perMilliseconds: 1000
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      this.handleError
    );
  }

  private async handleError(error: AxiosError) {
    if (error.response) {
      // API error response
      const errorData = error.response.data?.Err;
      if (errorData) {
        throw new CryptoCompareError(
          errorData.message || 'API Error',
          ErrorCode.API_ERROR,
          error.response.status,
          {
            type: errorData.type,
            details: errorData.other_info
          }
        );
      }
    } else if (error.request) {
      // Network error
      throw new CryptoCompareError(
        'Network error occurred',
        ErrorCode.CONNECTION_ERROR,
        StatusCode.BAD_GATEWAY
      );
    }
    throw error;
  }

  async fetchOHLCV(params: OHLCVParams, retries = 3): Promise<CryptoCompareOHLCVResponse> {
    const endpoint = `/spot/v1/historical/${getIntervalEndpoint(params.interval)}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.client.get(endpoint, { params });
        return response.data;
      } catch (error) {
        if (error instanceof CryptoCompareError) {
          if (error.code === ErrorCode.RATE_LIMIT_EXCEEDED) {
            // Back off and retry
            await delay(Math.pow(2, attempt) * 1000);
            continue;
          }
        }
        throw error;
      }
    }
    throw new CryptoCompareError(
      'Max retries exceeded',
      ErrorCode.OPERATION_TIMEOUT,
      StatusCode.GATEWAY_TIMEOUT
    );
  }

  async fetchTrades(params: TradeParams): Promise<CryptoCompareTradeResponse> {
    // Similar implementation for trades endpoint
  }
}

// core/data/sources/cryptocompare/fetcher.ts
export class CryptoCompareDataFetcher {
  private client: CryptoCompareClient;
  private cache: DataCache;

  constructor(config: CryptoCompareConfig) {
    this.client = new CryptoCompareClient(config);
    this.cache = new DataCache();
  }

  async fetchHistoricalOHLCV(query: MarketDataQuery): Promise<CryptoCompareOHLCVResponse> {
    const cacheKey = this.buildCacheKey(query);
    
    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Convert query params to API format
    const params = this.buildOHLCVParams(query);
    
    try {
      const response = await this.client.fetchOHLCV(params);
      
      // Validate response data
      this.validateOHLCVResponse(response);

      // Cache successful response
      await this.cache.set(cacheKey, response);

      return response;

    } catch (error) {
      // Log error details
      logger.error('Failed to fetch OHLCV data', {
        provider: 'cryptocompare',
        query,
        error: error instanceof Error ? error.message : error
      });

      throw error;
    }
  }

  private buildOHLCVParams(query: MarketDataQuery): OHLCVParams {
    return {
      market: query.exchange,
      instrument: query.symbol,
      limit: query.limit || 2000,
      aggregate: INTERVAL_AGGREGATION[query.interval] || 1,
      response_format: 'JSON'
    };
  }

  private validateOHLCVResponse(response: CryptoCompareOHLCVResponse) {
    if (!response.Data?.Data?.length) {
      throw new CryptoCompareError(
        'Invalid response: no data returned',
        ErrorCode.VALIDATION_ERROR,
        StatusCode.BAD_GATEWAY
      );
    }
    // Add more validation as needed
  }

  private buildCacheKey(query: MarketDataQuery): string {
    return `cryptocompare:ohlcv:${query.exchange}:${query.symbol}:${query.interval}:${query.start}:${query.end}`;
  }
}

```

Key components:

1. CryptoCompareClient:
- Handles HTTP requests with rate limiting
- Manages retries and error handling
- Transforms API errors into domain errors

2. CryptoCompareDataFetcher:
- Higher-level fetcher that implements business logic
- Handles caching and validation
- Converts between internal and API formats

Next steps:
1. Implement websocket client for real-time data
2. Set up database writer to store fetched data
3. Create Kafka producer to stream updates
4. Add monitoring and metrics

Let me know which aspect you'd like to tackle next.