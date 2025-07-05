#!/usr/bin/env bun

/**
 * RESEARCH: MCP Response Format and Handler Issues
 * 
 * This test investigates the exact response format from CoinGecko MCP server
 * and identifies why our response handler is failing to extract data.
 */

import { createCoinGeckoActor } from '../lib/src/publishers/sources/coingecko/coingecko-actor';

async function researchMCPResponseFormat() {
  console.log('🔬 RESEARCH: MCP Response Format and Handler Issues\n');

  const coinGeckoActor = createCoinGeckoActor({
    name: 'mcp-research',
    coinGeckoConfig: {
      debug: true,
      useRemoteServer: false,
      environment: 'demo',
    }
  });

  try {
    await coinGeckoActor.initialize();
    
    // Get direct access to MCP client
    const dsl = (coinGeckoActor as any).dsl;
    const mcpClient = (dsl as any).mcpClient;
    
    if (!mcpClient) {
      throw new Error('MCP Client not available');
    }

    console.log('🔍 RESEARCH PHASE 1: Raw MCP Response Structure\n');

    // Test 1: Direct MCP tool call with detailed logging
    console.log('📋 Test 1: Direct invoke_api_endpoint call for get_global');
    console.log('Parameters: {}');
    
    const rawGlobalResponse = await mcpClient.callTool('coingecko', 'invoke_api_endpoint', {
      endpoint: 'get_global',
      parameters: {}
    });
    
    console.log('\n📊 Raw Response Structure:');
    console.log('Type:', typeof rawGlobalResponse);
    console.log('Keys:', Object.keys(rawGlobalResponse || {}));
    console.log('Full Response:', JSON.stringify(rawGlobalResponse, null, 2));

    // Test 2: Test with parameters
    console.log('\n\n📋 Test 2: invoke_api_endpoint with parameters for get_simple_price');
    console.log('Parameters: { ids: "bitcoin", vs_currencies: "usd" }');
    
    const rawPriceResponse = await mcpClient.callTool('coingecko', 'invoke_api_endpoint', {
      endpoint: 'get_simple_price',
      parameters: {
        ids: 'bitcoin',
        vs_currencies: 'usd'
      }
    });
    
    console.log('\n📊 Raw Price Response:');
    console.log('Type:', typeof rawPriceResponse);
    console.log('Keys:', Object.keys(rawPriceResponse || {}));
    console.log('Full Response:', JSON.stringify(rawPriceResponse, null, 2));

    console.log('\n\n🔍 RESEARCH PHASE 2: Response Handler Analysis\n');

    // Test 3: Analyze our handleMCPResult method behavior
    console.log('📋 Test 3: Testing our handleMCPResult method with raw responses');
    
    try {
      const handledGlobal = await (dsl as any).handleMCPResult(rawGlobalResponse);
      console.log('\n✅ Handled Global Response:');
      console.log('Type:', typeof handledGlobal);
      console.log('Keys:', Object.keys(handledGlobal || {}));
      console.log('Data:', JSON.stringify(handledGlobal, null, 2));
    } catch (error) {
      console.log('\n❌ Global Response Handler Error:', error instanceof Error ? error.message : String(error));
    }

    try {
      const handledPrice = await (dsl as any).handleMCPResult(rawPriceResponse);
      console.log('\n✅ Handled Price Response:');
      console.log('Type:', typeof handledPrice);
      console.log('Keys:', Object.keys(handledPrice || {}));
      console.log('Data:', JSON.stringify(handledPrice, null, 2));
    } catch (error) {
      console.log('\n❌ Price Response Handler Error:', error instanceof Error ? error.message : String(error));
    }

    console.log('\n\n🔍 RESEARCH PHASE 3: QiCore Result Pattern Analysis\n');

    // Test 4: Check if responses follow QiCore Result<T> pattern
    console.log('📋 Test 4: Analyzing QiCore Result<T> pattern');
    
    if (rawGlobalResponse && typeof rawGlobalResponse === 'object') {
      console.log('\nGlobal Response Analysis:');
      console.log('- Has _tag:', '_tag' in rawGlobalResponse);
      console.log('- _tag value:', (rawGlobalResponse as any)._tag);
      console.log('- Has right:', 'right' in rawGlobalResponse);
      console.log('- Has left:', 'left' in rawGlobalResponse);
      
      if ('right' in rawGlobalResponse) {
        const rightValue = (rawGlobalResponse as any).right;
        console.log('- Right type:', typeof rightValue);
        console.log('- Right keys:', Object.keys(rightValue || {}));
        if (rightValue && 'content' in rightValue) {
          console.log('- Content type:', typeof rightValue.content);
          console.log('- Content length:', Array.isArray(rightValue.content) ? rightValue.content.length : 'not array');
          if (Array.isArray(rightValue.content) && rightValue.content.length > 0) {
            console.log('- First content item:', JSON.stringify(rightValue.content[0], null, 2));
          }
        }
      }
    }

    console.log('\n\n🔍 RESEARCH PHASE 4: Parameter Format Testing\n');

    // Test 5: Try different parameter formats
    console.log('📋 Test 5: Testing different parameter formats');
    
    const parameterTests = [
      { name: 'String parameters', params: { ids: 'bitcoin', vs_currencies: 'usd' } },
      { name: 'Quoted parameters', params: { 'ids': 'bitcoin', 'vs_currencies': 'usd' } },
      { name: 'JSON string parameters', params: JSON.stringify({ ids: 'bitcoin', vs_currencies: 'usd' }) }
    ];

    for (const test of parameterTests) {
      try {
        console.log(`\n🧪 Testing ${test.name}:`, test.params);
        const response = await mcpClient.callTool('coingecko', 'invoke_api_endpoint', {
          endpoint: 'get_simple_price',
          parameters: test.params
        });
        console.log(`✅ ${test.name} - Success:`, !!response);
        if (response && typeof response === 'object' && 'right' in response) {
          const content = (response as any).right?.content;
          console.log(`   Content available:`, Array.isArray(content) && content.length > 0);
        }
      } catch (error) {
        console.log(`❌ ${test.name} - Error:`, error instanceof Error ? error.message : String(error));
      }
    }

    console.log('\n\n🔍 RESEARCH PHASE 5: Alternative Tool Testing\n');

    // Test 6: Try different endpoints to see if issue is endpoint-specific
    console.log('📋 Test 6: Testing different endpoints');
    
    const endpoints = ['get_search', 'get_global'];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`\n🧪 Testing endpoint: ${endpoint}`);
        let params = {};
        if (endpoint === 'get_search') {
          params = { query: 'bitcoin' };
        }
        
        const response = await mcpClient.callTool('coingecko', 'invoke_api_endpoint', {
          endpoint: endpoint,
          parameters: params
        });
        
        console.log(`✅ ${endpoint} - Response received`);
        if (response && typeof response === 'object' && 'right' in response) {
          const content = (response as any).right?.content;
          console.log(`   Content available:`, Array.isArray(content) && content.length > 0);
          if (Array.isArray(content) && content.length > 0 && content[0].text) {
            const textLength = content[0].text.length;
            console.log(`   Text length:`, textLength);
            if (textLength > 0) {
              console.log(`   First 200 chars:`, content[0].text.substring(0, 200));
            }
          }
        }
      } catch (error) {
        console.log(`❌ ${endpoint} - Error:`, error instanceof Error ? error.message : String(error));
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Research failed:', error);
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
  console.log('=' .repeat(80));
  console.log('🔬 MCP RESPONSE FORMAT RESEARCH');
  console.log('=' .repeat(80));
  
  const success = await researchMCPResponseFormat();
  
  console.log('\n' + '=' .repeat(80));
  console.log(success ? '✅ RESEARCH COMPLETED' : '❌ RESEARCH FAILED');
  console.log('=' .repeat(80));
  
  process.exit(success ? 0 : 1);
}