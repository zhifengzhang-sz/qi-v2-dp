# Proposed Architecture & Implementation Plan (o4)

This document provides a clear, dual-centric architecture and phased implementation plan without modifying existing docs.

## Contents

- [Phase 1: Data-Stream Platform](#phase-1-data-stream-platform)
  - [Env Configurations](env/data-stream.md)
    - [Schema Registry](env/schema-register.md)
  - [Topic Definitions](data-platform/topics.md)
- [CI/CD Validation](ci-cd/validation.md)
- [Operational Considerations](#operational-considerations)

## Architecture Overview

*See also [Global Architecture](../architecture.md) for baseline design and [Grok-3 Architecture Comparison](../grok-3/architecture/comparison.md) for more information.*


### Dual-Centric View

1. **Structural Framework**: Centered on a data-stream platform (Redpanda/Kafka)
   - Durable, scalable streaming backbone.

2. **Agent/MCP-Centric Framework**: All components around the data stream are agents of two primary types:
   - **Publisher Agents**: Ingest and publish data to the stream.
   - **Consumer Agents**: Subscribe and process data from the stream.

**Agent Definition**:
- **Tool Set** (via MCP, e.g., `qimcp` wrapper)
- **Process Executor/Workflow** (AI Orchestra via `qiagent`)
- **Prompt/LLM**

This tailored definition ensures practical, package-supported agents working hand-in-hand with MCP.

## Implementation Plan

### Phase 1: Data-Stream Platform
- Survey and evaluate existing public-domain streaming projects (see `docs/existing-projects.md`).
- Evaluate Redpanda vs Kafka: look for connector patterns, partition strategies, and durability settings.
- Extract the common connector layer (e.g., a generic `StreamConnector` interface in `src/streaming/*`) and isolate it for our baseline.

#### Phase 1 Action Plan: Locking Down Data-Stream Platform
0. **Public Domain Project Study**
   - Consolidate research and best practices from `docs/existing-projects.md` (no separate study file needed).
1. **Provision Dev Cluster**
   - Deploy a lightweight Redpanda cluster (Docker Compose or Kubernetes) and a Kafka cluster in a sandbox environment.
   - Capture versions, configs, and resource allocations in `docs/o4/env/data-stream.md`.

2. **Define Evaluation Matrix**
   - Throughput (msgs/sec), end-to-end latency (ms), fault recovery time.
   - Schema support: Avro vs. Protobuf, registry integration.
   - Connector availability: source (HTTP, files) and sink (database) connectors.

3. **Execute Benchmarks & POCs**
   - Create producer/consumer workloads using `src/streaming/StreamConnectorPoc.ts`.
   - Measure and compare metrics across Redpanda and Kafka under realistic load.

4. **Finalize Connector Interface**
   - Design and implement `StreamConnector` interface in `src/streaming`.
   - Include methods for `connect()`, `publish()`, `subscribe()`, `close()`.
   - Write unit tests and integration tests in `tests/streaming/`.

5. **Document Configuration & Topics**
   - Draft topic definitions, retention policies, partitions in `docs/o4/data-platform/topics.md`.
   - Capture connector configs (Bootstrap servers, TLS settings).

6. **Automate CI/CD Validation**
   - Add integration tests in CI pipeline using Testcontainers (Java) or equivalent TypeScript Docker-based tests.
   - Fail builds on regression in throughput or latency thresholds.

### Phase 2: Publisher Agents
- Reference implementations:
  - **CryptoStreamer** in `src/streaming/crypto-streamer.ts`
  - **MarketMonitoringAgent** in `src/agents/market-monitoring-agent.ts`
- Steps:
  1. Scaffold a new publisher agent based on `MarketMonitoringAgent` pattern.
  2. Implement CryptoCompareAgent and TwelveDataAgent using the same base class.
  3. Integrate MCP toolset with `qimcp` wrapper; extend tools in `src/utils/` as needed.
  4. Define a reusable workflow in AI Orchestra (e.g., `qiagent/workflows/publisher.ts`) and wire it into each agent.

### Phase 3: Consumer Agents
- Reference implementations:
  - **TimeScaleAgent** (to be created) following the `MarketMonitoringAgent` skeleton.
  - **ClickHouseAgent** (to be created) similarly.
- Steps:
  1. Copy the publisher scaffold, switch to consumer logic: subscribe to streams and batch inserts.
  2. Leverage existing pipeline infrastructure (`src/pipeline` and `src/database/index.ts`).
  3. Use MCP toolsets for stateful operations (e.g., table creation, data modeling) with `qimcp`.
  4. Share the same AI Orchestra workflow pattern, adjusted for consumer tasks.

## Operational Considerations

### Schema Management
- Employ Avro or Protobuf schemas stored in a centralized registry (e.g., Confluent Schema Registry).
- Enforce backward- and forward-compatibility rules on topic schemas.
- Automate schema validation in CI/CD before agent deployment.

### Connector Lifecycle & Topic Management
- Define connectors declaratively (YAML/JSON) and version-control them alongside code.
- Use Kubernetes Operators or Debezium connectors for lifecycle (install/upgrade/rollback).
- Apply topic policies (retention, compaction, partitions) via GitOps workflows.

### Packaging, Deployment & Versioning
- Package each agent as a Docker image with semantic version tags.
- Use CI pipelines to build, test, and push images; deploy via Helm charts or Kubernetes manifests.
- Maintain a lightweight service registry for agent discovery and health checks.

### Observability & Monitoring
- Expose metrics (Prometheus) for stream lag, agent throughput, LLM latency.
- Create Grafana dashboards and alert rules for SLA breaches.
- Centralize logs (ELK/EFK) with structured JSON and correlation IDs.

### Failure Handling & Retries
- Implement retry policies and exponential backoff in AI Orchestra workflows.
- Route poisoned messages to a dead-letter topic for manual inspection.
- Apply circuit-breaker patterns for unstable external dependencies.

### Security & Compliance
- Encrypt data at rest (Kafka encryption) and in transit (TLS for streams and gRPC/HTTP).
- Store secrets securely (Vault, Kubernetes secrets) and restrict MCP tool access with ACLs.
- Sanitize and audit LLM prompts to prevent data leaks.

### Scaling & Runtime Patterns
- Autoscale agents based on topic lag or custom metrics (HPA in Kubernetes).
- Shard workloads by partition key or logical grouping.
- Use a shared `StreamConnector` library to abstract reconnection, batching, and concurrency.
