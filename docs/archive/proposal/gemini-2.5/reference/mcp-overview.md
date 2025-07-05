# Reference: Model Context Protocol (MCP) Overview

This document provides a high-level reference for the Model Context Protocol (MCP) as it is used within the QiCore Crypto Data Platform.

## 1. What is MCP?

The Model Context Protocol (MCP) is a standardized set of rules and interfaces that govern how AI agents interact with the world around them. It is the glue that connects an agent's reasoning capabilities (the "brain") with its tools and memory.

Think of it as a universal USB standard for AI. Instead of building custom connections for every new tool or data source, we use a single, consistent protocol.

## 2. Core Concepts

MCP is built on three primary concepts: **Tools**, **Memory**, and **Agents**.

```mermaid
graph TD
    subgraph "Agent (The 'Brain')"
        A[AI Agent]
    end

    subgraph "MCP (The 'Standard Interface')"
        T[MCP Tools<br/>(e.g., Get Market Data, Execute Trade)]
        M[MCP Memory<br/>(e.g., Agent State, Past Actions)]
    end

    subgraph "External World"
        D[(Database)]
        S[(Streaming Platform)]
        E[(Exchange API)]
    end

    A -- "Uses" --> T
    A -- "Uses" --> M
    T -- "Connects to" --> D
    T -- "Connects to" --> S
    T -- "Connects to" --> E
    M -- "Persists in" --> D
```

### a. MCP Tools

-   **What they are**: Standardized wrappers around external systems. A tool exposes a simple, predictable interface for an agent to use.
-   **Example**: Instead of an agent needing to know how to write a complex SQL query to get market data, it simply calls the `marketData.getLatestPrice('BTC/USD')` tool. The tool handles the underlying complexity.
-   **Benefits**:
    -   **Security**: Tools provide a secure access layer. An agent can be granted access to a specific tool without having direct access to the underlying database or API.
    -   **Simplicity**: Agents can be written in a much more abstract, goal-oriented way.
    -   **Reusability**: The same tool can be used by many different agents.

### b. MCP Memory

-   **What it is**: A standardized way for an agent to store and retrieve its state, context, and history.
-   **Example**: An agent can use `memory.setState({ lastAction: 'BOUGHT' })` to remember its last action. Later, it can retrieve this with `memory.getState()`.
-   **Benefits**:
    -   **Statefulness**: Allows agents to have conversations, perform multi-step tasks, and learn over time.
    -   **Resilience**: If an agent restarts, it can reload its context from memory and continue where it left off.
    -   **Inter-Agent Communication**: One agent can leave a message in a shared memory space for another agent to find.

### c. MCP Agents

-   **What they are**: The AI-powered decision-makers. In our platform, agents are TypeScript classes that use MCP Tools and Memory to achieve their goals.
-   **How they work**: An agent's core logic involves a loop:
    1.  **Perceive**: Use an MCP tool to gather information about the environment (e.g., get market data).
    2.  **Reason**: Use an AI model to analyze this information and decide on the next action.
    3.  **Act**: Use another MCP tool to execute the action (e.g., log an alert, execute a trade).
    4.  **Remember**: Use MCP memory to store the outcome of the action.

## 3. The Future: Full MCP Integration

While the current platform uses the *principles* of MCP, the next phase of development is to refactor the existing agents and services to be fully compliant with the `@qicore/agent-lib` MCP implementation.

This will involve:
-   Wrapping all database and API interactions in formal MCP Tool classes.
-   Replacing direct state management with a dedicated MCP Memory service.
-   Refactoring agents to be pure MCP clients that are orchestrated by the `qiagent` framework.

This transition will unlock the full potential of the platform, enabling more complex, multi-agent systems and accelerating the development of new AI-driven trading strategies.

