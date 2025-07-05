# Data Stream Documentation Guide

This directory contains documentation for the QiCore Crypto Data Platform's data streaming architecture.

## How to Read These Docs

### Start Here
1. **[architecture.md](./architecture.md)** - Complete Agent/MCP centric architecture specification
   - Platform functionality and agent types
   - Implementation diagrams and workflows
   - Official MCP integration patterns

### Reference Documents
2. **[mcp.integration.md](./mcp.integration.md)** - MCP integration details
3. **[kafka.mcp.repanda.md](./kafka.mcp.repanda.md)** - Kafka/Redpanda MCP specifics
4. **[timescaledb.mcp.md](./timescaledb.mcp.md)** - TimescaleDB MCP integration
5. **[coingecko.mcp.md](./coingecko.mcp.md)** - CoinGecko MCP server details
6. **[ready-to-use-mcps.md](./ready-to-use-mcps.md)** - Available official MCP servers

### Additional Resources
7. **[deployment.md](./deployment.md)** - Deployment configuration
8. **[kafka.tech.comparison.md](./kafka.tech.comparison.md)** - Technical comparisons

## Quick Reference

**Platform Purpose**: Get data from data source → Data pushed to data stream → Users get data and do their jobs

**Agent Types**:
- **Publisher Agents**: Get data from data source → Publish data into data stream
- **Consumer Agents**: Get data from data stream → Store data into data store

**Architecture Pattern**: Agent → MCP Client → {Official MCP Servers + Custom Tools} → Services