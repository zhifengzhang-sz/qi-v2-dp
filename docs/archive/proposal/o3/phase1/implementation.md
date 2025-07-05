# MVP Implementation Timeline (Weeks 1-8)

> **Note**: This timeline supersedes the *Phase 1* section of the master `docs/implementation.md`. Later-phase tasks remain in the original document.

| Week | Deliverable | Notes |
|------|-------------|-------|
| 1 | Repository fork & TypeScript scaffolding | Fork crypto-streaming, set up lint/test, CI. |
| 2 | Docker-compose with TimescaleDB | Expose port 5432, enable Timescale extension. |
| 3 | CryptoCompare REST client | Fetch 90-day daily candles → seed DB. |
| 4 | CryptoCompare WebSocket client | Stream real-time ticks → insert into `ohlcv`. |
| 5 | DB schema & aggregates | `ohlcv` hypertable + hourly roll-up materialised view. |
| 6 | Market-Monitoring Agent | Simple price-alert (hard-coded thresholds). |
| 7 | Load & latency tests | Target 2 k msgs/s, <100 ms ingest latency. |
| 8 | Docs & cleanup | Run-book, docker-compose instructions, CI badge. |

**Success criteria**: continuous data flow `CryptoCompare → TimescaleDB → alert emitted` with green CI pipeline. 