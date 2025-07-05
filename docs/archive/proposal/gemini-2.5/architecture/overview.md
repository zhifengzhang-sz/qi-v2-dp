# QiCore Crypto Data Platform: Unified Architecture

This document provides a consolidated view of the QiCore Crypto Data Platform architecture, reflecting the current state of the implementation and aligning the visions from `proposal-v2`, `o3`, and `grok-3`.

## 1. High-Level Overview

The platform is an AI-powered, event-driven system designed for real-time cryptocurrency data ingestion, analysis, and agent-based action. It is built on a foundation of modern, scalable open-source technologies and leverages the **Model Context Protocol (MCP)** to create a standardized, secure, and extensible framework for AI agents.

The core principles are:
- **Modularity**: Components are decoupled and communicate via a streaming backbone.
- **Scalability**: The architecture is designed to handle high-volume, real-time data streams.
- **Extensibility**: New data sources, analytical models, and AI agents can be added with minimal friction.
- **Standardization**: MCP provides a consistent interface for AI agents to interact with the platform's tools and data.

## 2. Current Implemented Architecture

The following diagram represents the components that are currently implemented and operational. It combines the MVP vision with the already-implemented Phase 2 components like Redpanda and ClickHouse.

```mermaid
graph TD
    subgraph "Data Sources"
        CC[CryptoCompare<br/>WebSocket + REST]
    end

    subgraph "Ingestion & Streaming"
        INGEST[Ingestion Service<br/>`crypto-streamer.ts`]
        RP[Redpanda<br/>(Kafka-compatible)]
    end

    subgraph "Storage Layer"
        TSDB[(TimescaleDB<br/>*For real-time data*)]
        CH[(ClickHouse<br/>*For analytics*)]
    end

    subgraph "Agent Layer (MCP-driven)"
        AGENT[Market Monitoring Agent<br/>`market-monitoring-agent.ts`]
    end

    subgraph "AI/ML"
        AI_MODEL{AI Model<br/>(Ollama, Claude, etc.)}
    end

    CC --> INGEST
    INGEST --> RP
    RP --> |ohlcv-raw| TSDB
    RP --> |ohlcv-raw| CH
    TSDB --> AGENT
    AGENT -->|Analyzes data via| AI_MODEL
    AI_MODEL -->|Returns insights to| AGENT
```

## 3. Component Breakdown

-   **Ingestion Service (`crypto-streamer.ts`)**: Connects to external data sources (currently CryptoCompare) via WebSockets and REST APIs. It normalizes the incoming data (e.g., OHLCV) and publishes it to the Redpanda streaming bus.

-   **Redpanda (Streaming Bus)**: Acts as the central nervous system of the platform. All real-time data flows through Redpanda topics, decoupling producers from consumers. This allows multiple services to consume the same data stream independently.

-   **TimescaleDB (Operational Database)**: A PostgreSQL extension optimized for time-series data. It stores the raw, real-time data and is used by agents for immediate operational queries (e.g., "what is the latest price?").

-   **ClickHouse (Analytical Database)**: A columnar database designed for high-performance analytics. It mirrors the data in TimescaleDB and is used for complex, historical queries and training machine learning models without impacting the operational database.

-   **Agent Layer (`market-monitoring-agent.ts`)**: This is where the intelligence resides. Agents are autonomous processes that consume data, apply logic, and perform actions. The current agent monitors the market, but this layer will be expanded with agents for trading, risk management, etc.

-   **AI Model Integration**: Agents leverage large language models (LLMs) and other AI/ML models to perform complex analysis, generate insights, and make decisions. This is done via a standardized interface that is moving towards full MCP compliance.

## 4. Data Flow

1.  The **Ingestion Service** fetches live data from CryptoCompare.
2.  Raw data is published as a message to a topic in **Redpanda**.
3.  Separate consumers listen to the Redpanda topic and write the data into both **TimescaleDB** and **ClickHouse**.
4.  The **Market Monitoring Agent** queries **TimescaleDB** for recent data.
5.  The agent sends this data, along with a prompt, to an **AI Model** for analysis.
6.  The AI model returns an insight, which the agent can then act upon (e.g., log an alert, trigger another process).

This architecture provides a robust and scalable foundation for building sophisticated, AI-driven financial applications.

