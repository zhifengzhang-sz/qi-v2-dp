# Phase-2 Implementation Timeline (Weeks 1-4)

> **Note**: Supersedes the *Phase 2* rows of the master `docs/implementation.md`.

| Week | Deliverable | Key Tasks |
|------|-------------|-----------|
| 1 | Redpanda cluster up | Docker-Compose → optional K8s, TLS, ACLs, topic configs (`ohlcv-raw`, `ohlcv-validated`). |
| 2 | Ingestion → Redpanda | Modify Phase-1 ingestion service to publish raw messages; write exactly-once transactional producer tests. |
| 2 | Validation service | JSON-schema validation, deduplication, cross-source reconciliation; republish validated topic. |
| 3 | ClickHouse deployment | Single-replica instance, `ohlcv` table & daily/hourly materialised views; CDC job to replay history from TimescaleDB. |
| 3 | Streaming writers | Implement separate consumers for TimescaleDB + ClickHouse; idempotent upserts. |
| 4 | Multi-source feeds | Integrate CCXT WS/REST for Binance & Coinbase; source-tag messages. |
| 4 | Monitoring stack | Prometheus exporters for Redpanda & ClickHouse; Grafana dashboards; alert rules. |

**Exit criteria**
• Sustain ≥10 k msgs/s through Redpanda with <200 ms end-to-end latency.
• 24-hour slice query in ClickHouse returns in <1 s.
• Dual-source mismatch rate <0.5 % per 24 h. 