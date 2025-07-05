# Implementation Plan for Phase 2 (Storage & Streaming) - Grok-3

> **Note**: This document replaces `docs/o3/phase2/implementation.md` with a detailed execution timeline and pseudocode for key services.

This implementation plan outlines a four-week timeline to complete the Phase 2 architecture, focusing on the missing components identified in the codebase review: Validation & Enrichment service, dedicated DB writer services, CCXT multi-source ingestion, and basic monitoring.

## Timeline (4 Weeks)

### Week 1: Validation & Enrichment Service
- **Goal**: Implement a consumer that reads `ohlcv-raw`, validates data, and publishes to `ohlcv-validated`.
- **Tasks**:
  - Set up a Redpanda consumer in `src/pipeline/validation.ts`.
  - Define schema validation for OHLCV data (e.g., check for nulls, valid timestamps).
  - Implement deduplication logic based on timestamp and source.
  - Enrich data with source metadata (e.g., exchange name).
  - Publish validated data to `ohlcv-validated` topic.
- **Pseudocode**:
  ```typescript
  class ValidationService {
    private consumer: KafkaConsumer;
    private producer: KafkaProducer;

    constructor() {
      this.consumer = new KafkaConsumer('ohlcv-raw');
      this.producer = new KafkaProducer('ohlcv-validated');
    }

    async processMessages() {
      await this.consumer.subscribe(async (message) => {
        const ohlcv = JSON.parse(message.value);
        if (this.validate(ohlcv)) {
          const enriched = this.enrich(ohlcv);
          await this.producer.send(JSON.stringify(enriched));
        }
      });
    }

    validate(ohlcv: any): boolean {
      // Check required fields, ranges, etc.
      return ohlcv.timestamp && ohlcv.open >= 0 && ohlcv.source;
    }

    enrich(ohlcv: any): any {
      // Add metadata
      return { ...ohlcv, validatedAt: new Date().toISOString() };
    }
  }
  ```

### Week 2: DB Writer Services
- **Goal**: Implement consumers that read `ohlcv-validated` and insert into TimescaleDB and ClickHouse.
- **Tasks**:
  - Create `src/database/timescale-writer.ts` to batch-insert into TimescaleDB using existing `TimescaleDBOperations`.
  - Create `src/database/clickhouse-writer.ts` to batch-insert into ClickHouse using existing `ClickHouseOperations`.
  - Optimize for high-throughput with configurable batch sizes.
- **Pseudocode**:
  ```typescript
  class TimescaleDBWriter {
    private consumer: KafkaConsumer;
    private db: TimescaleDBOperations;
    private batch: any[] = [];
    private batchSize = 1000;

    constructor() {
      this.consumer = new KafkaConsumer('ohlcv-validated');
      this.db = new TimescaleDBOperations();
    }

    async start() {
      await this.consumer.subscribe(async (message) => {
        const ohlcv = JSON.parse(message.value);
        this.batch.push(ohlcv);
        if (this.batch.length >= this.batchSize) {
          await this.db.batchInsert(this.batch);
          this.batch = [];
        }
      });
    }
  }
  // Similar structure for ClickHouseWriter
  ```

### Week 3: CCXT Multi-Source Ingestion
- **Goal**: Add ingestion from multiple exchanges via CCXT.
- **Tasks**:
  - Implement `src/streaming/multi-exchange-streamer.ts` using CCXT library.
  - Support Binance, Coinbase, and Kraken initially.
  - Publish raw OHLCV to `ohlcv-raw` topic on Redpanda.
- **Pseudocode**:
  ```typescript
  import ccxt from 'ccxt';

  class MultiExchangeStreamer {
    private exchanges: ccxt.Exchange[];
    private producer: KafkaProducer;

    constructor() {
      this.exchanges = [new ccxt.binance(), new ccxt.coinbase(), new ccxt.kraken()];
      this.producer = new KafkaProducer('ohlcv-raw');
    }

    async streamOHLCV(symbol: string) {
      for (const exchange of this.exchanges) {
        try {
          const ohlcv = await exchange.fetchOHLCV(symbol, '1m');
          for (const candle of ohlcv) {
            await this.producer.send(JSON.stringify({
              ...candle,
              source: exchange.id
            }));
          }
        } catch (error) {
          console.error(`Error fetching from ${exchange.id}:`, error);
        }
      }
    }
  }
  ```

### Week 4: Basic Monitoring & Integration
- **Goal**: Add basic observability and integrate all components.
- **Tasks**:
  - Add Prometheus metrics to ingestion, validation, and writer services (`src/utils/metrics.ts`).
  - Create a `docker-compose.yml` to spin up Redpanda, TimescaleDB, ClickHouse, and all services.
  - Test end-to-end data flow from ingestion to database storage.
- **Pseudocode for Metrics**:
  ```typescript
  import { Counter, Histogram } from 'prom-client';

  class Metrics {
    private messagesProcessed = new Counter({
      name: 'messages_processed_total',
      help: 'Total messages processed by service'
    });
    private processingLatency = new Histogram({
      name: 'processing_latency_seconds',
      help: 'Processing latency in seconds'
    });

    trackMessageProcessed() {
      this.messagesProcessed.inc();
    }

    trackLatency(start: [number, number]) {
      const end = process.hrtime(start);
      const duration = (end[0] * 1000) + (end[1] / 1000000);
      this.processingLatency.observe(duration);
    }
  }
  ```

## Success Criteria
- Validation service processes `ohlcv-raw` to `ohlcv-validated` with <1% data loss.
- DB writers achieve >10,000 inserts/second to TimescaleDB and ClickHouse.
- CCXT integration streams data from at least 3 exchanges.
- Metrics are exposed for all services via `/metrics` endpoint.

## Notes
- All services should use consistent logging formats and error handling.
- Configuration should be externalized via environment variables or a config file (e.g., `src/config/index.ts`). 