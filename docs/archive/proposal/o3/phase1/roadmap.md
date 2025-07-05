# Roadmap Overview

> **Note**: The table below restates Phase-1 status and defers other phases. It does not modify the comprehensive roadmap in `docs/proposal-v2.md` or other master docs.

| Phase | Scope | Key Tech | Status |
|-------|-------|----------|--------|
| 1 – MVP Foundation | Single source, TimescaleDB, basic agent | CryptoCompare, TimescaleDB | Current |
| 2 – Storage & Streaming | Add Redpanda + ClickHouse, multi-source ingest | Redpanda, ClickHouse, CCXT | Planned |
| 3 – Agent Intelligence | Analytical/ML agents, risk management | TechnicalIndicators, ML libs | Planned |
| 4 – Orchestration & Production | Multi-agent coordination, HA deployment | MCP orchestration, Kubernetes | Planned |

> **Deferral rationale**: later phases are independent add-ons.  None require re-architecting Phase 1 deliverables. 