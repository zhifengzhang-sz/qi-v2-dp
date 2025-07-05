// lib/src/consumers/agents/index.ts
// Consumer Agents - Data processing and storage agents

// TODO: Implement when Data Store Agent is ready
// Condition: After TimescaleDB MCP tools are complete and tested
// export * from './data-store-agent';

// TODO: Implement when Analytics Agent is ready  
// Condition: After analytics MCP tools and data store agent are working
// export * from './analytics-agent';

// Placeholder export to prevent empty module errors
export const CONSUMER_AGENTS_TODO = {
  'data-store-agent': 'TODO: Consumer agent for storing streaming data to TimescaleDB',
  'analytics-agent': 'TODO: Consumer agent for processing analytics on stored data'
} as const;