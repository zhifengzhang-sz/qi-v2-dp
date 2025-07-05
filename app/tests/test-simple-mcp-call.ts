#!/usr/bin/env bun

// Test simple MCP calls with proper parameter handling

import { createCoinGeckoActor } from '../lib/src/publishers/sources/coingecko/coingecko-actor';

async function testSimpleMCPCall() {
  console.log('🔍 Testing Simple MCP Calls...\n');

  const coinGeckoActor = createCoinGeckoActor({
    name: 'simple-test',
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
    
    // Test 1: Simple call to get_global (no params required)
    console.log('\n🧪 Test 1: get_global (no params)');
    try {
      const globalResult = await mcpClient.callTool('coingecko', 'invoke_api_endpoint', {
        endpoint: 'get_global',
        parameters: {}
      });
      console.log('✅ get_global succeeded');
      console.log('Result structure:', {
        hasContent: !!globalResult.content,
        contentLength: globalResult.content?.length || 0,
        firstContentType: globalResult.content?.[0]?.type
      });
    } catch (error) {
      console.log('❌ get_global failed:', error instanceof Error ? error.message : String(error));
    }
    
    // Test 2: Simple search with minimal required param
    console.log('\n🧪 Test 2: get_search with minimal params');
    try {
      const searchResult = await mcpClient.callTool('coingecko', 'invoke_api_endpoint', {
        endpoint: 'get_search',
        parameters: {
          query: 'bitcoin'
        }
      });
      console.log('✅ get_search succeeded');
      console.log('Result structure:', {
        hasContent: !!searchResult.content,
        contentLength: searchResult.content?.length || 0,
        firstContentType: searchResult.content?.[0]?.type
      });
    } catch (error) {
      console.log('❌ get_search failed:', error instanceof Error ? error.message : String(error));
    }
    
    // Test 3: Simple price call with minimal required params
    console.log('\n🧪 Test 3: get_simple_price with minimal params');
    try {
      const priceResult = await mcpClient.callTool('coingecko', 'invoke_api_endpoint', {
        endpoint: 'get_simple_price',
        parameters: {
          ids: 'bitcoin',
          vs_currencies: 'usd'
        }
      });
      console.log('✅ get_simple_price succeeded');
      console.log('Result structure:', {
        hasContent: !!priceResult.content,
        contentLength: priceResult.content?.length || 0,
        firstContentType: priceResult.content?.[0]?.type
      });
      
      // Try to parse the actual data
      if (priceResult.content?.[0]?.text) {
        try {
          const data = JSON.parse(priceResult.content[0].text);
          console.log('Parsed data:', data);
        } catch (parseError) {
          console.log('Parse error:', parseError);
          console.log('Raw text:', priceResult.content[0].text.substring(0, 200));
        }
      }
    } catch (error) {
      console.log('❌ get_simple_price failed:', error instanceof Error ? error.message : String(error));
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
  const success = await testSimpleMCPCall();
  process.exit(success ? 0 : 1);
}