# How to Use This Documentation

This guide explains the relationship between the `docs/gemini/` documentation set and the main QiCore Crypto Data Platform codebase.

## The Core Principle: One Project, Better Docs

First, and most importantly:
-   **The codebase is the single project located at dp.** All your work—coding, running the application, etc.—happens there.
-   **The `docs/gemini/` directory is the new, official documentation *for that project*.** It is not a fork or a new project. It is meant to replace the older o3 and grok-3 documentation by providing a single, unified, and up-to-date source of truth.

Think of it this way: We are keeping the same "engine" (the code in src) but providing a much better "owner's manual" (the docs in `gemini/`).

## Recommended Workflow for a Developer

Here is the recommended path for getting started with the project and using these documents effectively.

### Step 1: Start with the Architecture

-   **Read this first**: `docs/gemini/architecture/overview.md`
-   **Purpose**: This gives you the "big picture." It explains what all the major pieces of the platform are (Redpanda, TimescaleDB, Agents, etc.) and how they fit together. Understanding this is essential before diving into the code.

### Step 2: Run the Platform

-   **Follow this guide**: `docs/gemini/guides/deployment.md`
-   **Purpose**: This guide walks you through using the docker-compose.yml file (located in the project root) to get the entire platform running on your local machine. This allows you to see the system in action.

### Step 3: Understand a Core Concept

-   **Read this reference**: `docs/gemini/reference/mcp-overview.md`
-   **Purpose**: The Model Context Protocol (MCP) is the key to our AI strategy. This document explains what it is and why it's important, which will help you understand the design of the agents.

### Step 4: Make Your First Code Change

-   **Follow this guide**: `docs/gemini/guides/adding-a-new-agent.md`
-   **Purpose**: This is a practical, hands-on tutorial. It will guide you through creating a new file in agents, writing the agent code, and integrating it into the main application in index.ts. This exercise will solidify your understanding of the project structure and development process.

### Summary of Your Workspace

-   **Your Code is Here**: `/home/zzhang/dev/qi/github/mcp-server/dp/src/`
-   **Your Docs are Here**: gemini
-   **You Run Commands From Here**: dp

By following this path, you will move from a high-level understanding of the architecture to hands-on coding, using the `gemini` documentation as your guide every step of the way.

