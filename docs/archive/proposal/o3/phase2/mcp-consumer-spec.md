# MCP Consumer Pipeline – Phase 2

This document clarifies how **MCP agents** replace bespoke services on the consumer side of the streaming stack, addressing the previously ambiguous part of the specification.

---

## Problem statement
Phase 2 requires:
1. Validation & enrichment of raw OHLCV messages (`ohlcv-raw`).
2. Dual–database persistence (TimescaleDB + ClickHouse).
3. Extensibility for future analytical/ML steps.

Earlier drafts talked about "validator service", "writer service", etc. but did not specify concrete implementation choices.

## Decision
Leverage **Model-Context Protocol (MCP)** to express consumer-side logic as *agent tool-chains* instead of separate micro-services.  This minimises code and maximises reuse.

## High-level flow
```text
Redpanda topic ohlcv-raw  ─▶  stream-runner  ─▶  MCP agent (ohlcv-validator)  ─▶  ⧉ timescaledb.insert
                                           │                                   └── clickhouse.insert
                                           └── validation / enrichment tools
```

1. `stream-runner.ts` – a tiny process that:
   • consumes from `ohlcv-raw`,
   • calls `ohlcv-validator.execute({payload})`,
   • commits offsets.
2. `ohlcv-validator` agent – declared via YAML (example below).
3. Standard MCP tools perform each pipeline step.

## Sample agent manifest
```yaml
id: ohlcv-validator
objective: "Clean & store raw OHLCV"
inputs:
  payload: any
steps:
  - use: schema.validate
    with:
      schema: schemas/ohlcv.json
  - use: deduplicate.recent
    with:
      cache: redis://validator-cache:6379
      ttlSeconds: 86400
  - use: enrich.exchangeMeta
  - use: timescaledb.insert
    when: "status == 'ok'"
  - use: clickhouse.insert
    when: "status == 'ok'"
  - emit: done
on_error:
  strategy: retry
  maxAttempts: 5
```

*All listed tools are commodity; only the schema file and Redis connection string are project-specific inputs.*

## Tool catalogue
| Tool | Responsibility | Notes |
|------|----------------|-------|
| `schema.validate` | Ensures message conforms to OHLCV schema | Can use Ajv under the hood |
| `deduplicate.recent` | Filters duplicates within 24 h via Redis Bloom or set | Generic implementation |
| `enrich.exchangeMeta` | Adds metadata (exchange name, symbol decimals, etc.) | Static lookup table |
| `timescaledb.insert` | Inserts into primary TimescaleDB hypertable | Wrapper around `TimescaleDBOperations.insertOHLCV` |
| `clickhouse.insert` | Inserts into ClickHouse analytics table | Wrapper around `ClickHouseOperations.insertOHLCVAnalytics` |

## Minimal code to write
1. **Tool wrappers** (`src/mcp-tools/`):
   * `timescaledb.ts` (≈15 LOC)
   * `clickhouse.ts` (≈15 LOC)
2. **stream-runner.ts** (≈50 LOC, see skeleton below).

### Skeleton: `stream-runner.ts`
```ts
import { createAgent } from 'qimcp';
import { Kafka } from 'kafkajs';
import { loadConfig } from '../config';

const cfg = loadConfig();
const kafka = new Kafka({ brokers: cfg.streaming.redpanda.brokers, clientId: 'ohlcv-stream-runner' });

const consumer = kafka.consumer({ groupId: 'ohlcv-validator' });
await consumer.connect();
await consumer.subscribe({ topic: cfg.streaming.redpanda.topics.marketData /* ohlcv-raw */ });

const validator = await createAgent('ohlcv-validator');

await consumer.run({
  eachMessage: async ({ message }) => {
    await validator.execute({ payload: JSON.parse(message.value!.toString()) });
  }
});
```

## Advantages
* **Minimal bespoke code** – ~100 LOC total.
* **Declarative pipeline** – changes via YAML, no redeploy.
* **Error & retry handling** – inherited from MCP runtime.
* **Composable future steps** – ML inference, alert generation, etc., become additional tools.

## Impact on docs
* Replaces ambiguous "validator service" & "writer service" bullets in Phase 2 with explicit *MCP-based consumer pipeline* description.
* No change to Phase 1; the runner can be disabled in the MVP configuration.

---
_Last updated: 2025-07-03_ 