// lib/src/agents/index.ts
// Agents have been moved to their appropriate modules:
// - Publisher agents: ../publishers/agents/
// - Platform agents: ../streaming/platform/
// This module exists for backward compatibility

export { CryptoPlatformAgent } from '../publisher/streaming/platform/crypto-platform-agent';
export type { PlatformConfig } from '../publisher/streaming/platform/crypto-platform-agent';