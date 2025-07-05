// lib/index.ts
// QiCore Crypto Data Platform - Reorganized Architecture
// Following proper separation of concerns and Agent/MCP paradigm

// =============================================================================
// COMPLETE PLATFORM (Main Entry Point)
// =============================================================================
export * from "./src/streaming/platform";

// =============================================================================
// BASE LAYER (Low-level shared components - future qidb)
// =============================================================================
export * from "./src/base/database";
export * from "./src/base/networking";
export * from "./src/base/types";

// =============================================================================
// MCP TOOLS (Organized by data flow)
// =============================================================================
export * from "./src/mcp-tools/publisher";
export * from "./src/mcp-tools/consumer";
export * from "./src/mcp-tools/datastream";

// =============================================================================
// PUBLISHERS (Data acquisition and publishing)
// =============================================================================
export * from "./src/publishers/agents";
export * from "./src/publishers/sources/coingecko";
export * from "./src/publishers/sources/twelvedata";
export * from "./src/publishers";

// =============================================================================
// CONSUMERS (Data processing and storage)
// =============================================================================
export * from "./src/consumers/agents";
export * from "./src/consumers/sinks";
export * from "./src/consumers";

// =============================================================================
// STREAMING INFRASTRUCTURE
// =============================================================================
export * from "./src/streaming/redpanda";
export * from "./src/streaming/pipelines";

// =============================================================================
// MCP LAUNCHERS (Server management)
// =============================================================================
export * from "./src/mcp-launchers";

// =============================================================================
// ARCHITECTURE NOTES
// =============================================================================
// 
// This library follows the Agent/MCP paradigm:
// Agent = QiAgent + DSL + MCPWrapper
// 
// Data Flow Architecture:
// 1. Publishers: Data Sources → Publishers → Streaming
// 2. Streaming: Redpanda → Processing → Routing
// 3. Consumers: Streaming → Consumers → Storage
// 
// MCP Tools Bridge:
// - publisher/: Tools for data acquisition and publishing
// - consumer/: Tools for data processing and storage  
// - datastream/: Tools for streaming infrastructure
// 
// Base Layer (future qidb):
// - database/: Low-level database operations
// - networking/: Network utilities and connections
// - types/: Shared types and schemas
//