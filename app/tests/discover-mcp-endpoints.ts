#!/usr/bin/env bun

// Discover CoinGecko MCP endpoints to understand the dynamic tools

import { createCoinGeckoActor } from '../lib/src/publishers/sources/coingecko/coingecko-actor';

async function discoverMCPEndpoints() {
  console.log('🔍 Discovering CoinGecko MCP Endpoints...\n');

  const coinGeckoActor = createCoinGeckoActor({
    name: 'endpoint-discovery',
    coinGeckoConfig: {
      debug: true,
      useRemoteServer: false,
      environment: 'demo',
    }
  });

  try {
    // Initialize the actor
    console.log('🚀 Initializing CoinGecko Actor...');
    await coinGeckoActor.initialize();
    
    // Get the DSL instance to access MCP client directly
    const dsl = (coinGeckoActor as any).dsl;
    const mcpClient = (dsl as any).mcpClient;
    
    if (!mcpClient) {
      throw new Error('MCP Client not available');
    }
    
    // Step 1: List available endpoints
    console.log('\n📋 Step 1: Listing all available API endpoints...');
    const endpoints = await mcpClient.callTool('coingecko', 'list_api_endpoints', {});
    console.log('Available endpoints:', JSON.stringify(endpoints, null, 2));
    
    // Step 2: Get schema for specific endpoints
    const testEndpoints = ['simple_price', 'ping', 'simple/price', '/simple/price', 'coins_markets'];
    
    for (const endpoint of testEndpoints) {
      try {
        console.log(`\n🔧 Step 2: Getting schema for endpoint '${endpoint}'...`);
        const schema = await mcpClient.callTool('coingecko', 'get_api_endpoint_schema', {
          endpoint: endpoint
        });
        console.log(`Schema for ${endpoint}:`, JSON.stringify(schema, null, 2));
      } catch (error) {
        console.log(`❌ Endpoint '${endpoint}' not found or error:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Discovery failed:', error);
    return false;
  } finally {
    console.log('\n🧹 Cleaning up...');
    try {
      await coinGeckoActor.cleanup();
      console.log('✅ Cleanup completed');
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup warning:', cleanupError);
    }
  }
}

if (import.meta.main) {
  const success = await discoverMCPEndpoints();
  process.exit(success ? 0 : 1);
}