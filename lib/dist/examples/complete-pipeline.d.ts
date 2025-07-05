/**
 * Complete Agent/MCP Centric Pipeline Example
 *
 * This demonstrates the two-centric architecture:
 * 1. Structural Framework: Data Stream Platform (Redpanda/Kafka)
 * 2. Agent/MCP Centric Framework: Agent → MCP Client → {Official MCP Servers + Custom Tools} → Services
 */
declare function runCompletePipeline(): Promise<void>;
/**
 * Development Testing Function
 * Tests individual components of the Agent/MCP architecture
 */
declare function testAgentMCPComponents(): Promise<void>;
export { runCompletePipeline, testAgentMCPComponents };
