// lib/index.ts
// QiCore Crypto Data Platform - Dual Architecture Implementation
// Compliant with docs/data-stream specification
// Complete Platform (Main Entry Point)
export * from "./src/platform";
// Physical Data Layer (High Performance)
export * from "./src/redpanda";
export * from "./src/publishers";
export * from "./src/consumers";
// AI Control Layer (MCP Integration)
export * from "./src/agents";
export * from "./src/mcp-launchers";
// MCP Tools (Bridge Layer)
export * from "./src/mcp-tools";
// Dual Architecture Pattern:
// 1. Physical Layer: CryptoData → Producer → Redpanda → Consumer → Database
// 2. Control Layer: AI Agent → MCP Client → Official MCP Server → External Service
//
// This implementation follows the specification in docs/data-stream/
// and fulfills the conceptual vision from docs/zz/notes.md
