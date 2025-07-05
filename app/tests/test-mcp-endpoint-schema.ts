#!/usr/bin/env bun

// Test specific MCP endpoint schemas to understand parameter format

import { createCoinGeckoActor } from '../lib/src/publishers/sources/coingecko/coingecko-actor';

async function testEndpointSchemas() {
  console.log('🔍 Testing CoinGecko MCP Endpoint Schemas...\n');

  const coinGeckoActor = createCoinGeckoActor({
    name: 'schema-test',
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
    
    // Test specific endpoints that we need
    const testEndpoints = [
      'get_simple_price',
      'get_search', 
      'get_global',
      'get_coins_markets',
      'get_range_coins_ohlc'
    ];
    
    for (const endpoint of testEndpoints) {
      try {
        console.log(`\n🔧 Testing endpoint: ${endpoint}`);
        const schema = await mcpClient.callTool('coingecko', 'get_api_endpoint_schema', {
          endpoint: endpoint
        });
        console.log(`Schema:`, JSON.stringify(schema, null, 2));
        
        // Try a simple call with empty params
        console.log(`\n🧪 Testing call with empty params...`);
        const result = await mcpClient.callTool('coingecko', 'invoke_api_endpoint', {
          endpoint: endpoint,
          parameters: {}
        });
        console.log(`Result:`, JSON.stringify(result, null, 2));
        
      } catch (error) {
        console.log(`❌ Error with '${endpoint}':`, error instanceof Error ? error.message : String(error));
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
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
  const success = await testEndpointSchemas();
  process.exit(success ? 0 : 1);
}