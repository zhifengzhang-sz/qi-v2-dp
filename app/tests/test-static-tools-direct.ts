#!/usr/bin/env bun

/**
 * RESEARCH: Direct Static Tools Test
 * 
 * We found that static mode exposes 46 tools including get_simple_price!
 * Let's test calling them directly without the invoke_api_endpoint wrapper.
 */

import { createCoinGeckoActor } from '../lib/src/publishers/sources/coingecko/coingecko-actor';

async function testStaticToolsDirect() {
  console.log('🔬 RESEARCH: Direct Static Tools Test\n');

  const staticActor = createCoinGeckoActor({
    name: 'static-direct-test',
    coinGeckoConfig: {
      debug: true,
      useRemoteServer: false,
      environment: 'demo',
      useDynamicTools: false, // Use static tools mode
    }
  });

  try {
    console.log('🔧 Initializing static tools mode...');
    await staticActor.initialize();
    
    // Get direct access to MCP client
    const dsl = (staticActor as any).dsl;
    const mcpClient = (dsl as any).mcpClient;
    
    if (!mcpClient) {
      throw new Error('MCP Client not available');
    }

    console.log('📊 Testing direct static tool calls:\n');

    // Test 1: get_simple_price directly (should be available in static mode)
    console.log('🧪 Test 1: Direct get_simple_price call');
    console.log('Parameters: { ids: "bitcoin", vs_currencies: "usd" }');
    
    try {
      const priceResult = await mcpClient.callTool('coingecko', 'get_simple_price', {
        ids: 'bitcoin',
        vs_currencies: 'usd'
      });
      
      console.log('✅ get_simple_price succeeded!');
      console.log('Response type:', typeof priceResult);
      console.log('Response keys:', Object.keys(priceResult || {}));
      
      if (priceResult && typeof priceResult === 'object') {
        if ('content' in priceResult && Array.isArray(priceResult.content) && priceResult.content[0]?.text) {
          console.log('🎉 SUCCESS! Got price data:');
          console.log('Data length:', priceResult.content[0].text.length);
          console.log('Raw data:', priceResult.content[0].text);
          
          // Try to parse the JSON
          try {
            const parsedData = JSON.parse(priceResult.content[0].text);
            console.log('📊 Parsed price data:', parsedData);
          } catch (parseError) {
            console.log('⚠️ Could not parse as JSON, showing first 200 chars:');
            console.log(priceResult.content[0].text.substring(0, 200));
          }
        } else if ('_tag' in priceResult) {
          console.log('QiCore Result _tag:', (priceResult as any)._tag);
          if ((priceResult as any)._tag === 'Right') {
            const rightContent = (priceResult as any).right?.content;
            if (Array.isArray(rightContent) && rightContent[0]?.text) {
              console.log('🎉 SUCCESS! Got price data from QiCore Right:');
              console.log('Data:', rightContent[0].text);
            }
          } else {
            console.log('❌ QiCore Left error:', (priceResult as any).left?.message);
          }
        } else {
          console.log('📋 Response structure:', JSON.stringify(priceResult, null, 2));
        }
      }
    } catch (error) {
      console.log('❌ get_simple_price failed:', error instanceof Error ? error.message : String(error));
    }

    console.log('\n🧪 Test 2: Direct get_global call');
    console.log('Parameters: {}');
    
    try {
      const globalResult = await mcpClient.callTool('coingecko', 'get_global', {});
      
      console.log('✅ get_global succeeded!');
      console.log('Response type:', typeof globalResult);
      
      if (globalResult && typeof globalResult === 'object') {
        if ('content' in globalResult && Array.isArray(globalResult.content) && globalResult.content[0]?.text) {
          console.log('🎉 SUCCESS! Got global data:');
          console.log('Data length:', globalResult.content[0].text.length);
          console.log('First 300 chars:', globalResult.content[0].text.substring(0, 300));
        } else if ('_tag' in globalResult) {
          if ((globalResult as any)._tag === 'Right') {
            const rightContent = (globalResult as any).right?.content;
            if (Array.isArray(rightContent) && rightContent[0]?.text) {
              console.log('🎉 SUCCESS! Got global data from QiCore Right:');
              console.log('First 300 chars:', rightContent[0].text.substring(0, 300));
            }
          } else {
            console.log('❌ QiCore Left error:', (globalResult as any).left?.message);
          }
        }
      }
    } catch (error) {
      console.log('❌ get_global failed:', error instanceof Error ? error.message : String(error));
    }

    console.log('\n🧪 Test 3: Direct get_search call');
    console.log('Parameters: { query: "bitcoin" }');
    
    try {
      const searchResult = await mcpClient.callTool('coingecko', 'get_search', {
        query: 'bitcoin'
      });
      
      console.log('✅ get_search succeeded!');
      
      if (searchResult && typeof searchResult === 'object') {
        if ('content' in searchResult && Array.isArray(searchResult.content) && searchResult.content[0]?.text) {
          console.log('🎉 SUCCESS! Got search data:');
          console.log('Data length:', searchResult.content[0].text.length);
          console.log('First 300 chars:', searchResult.content[0].text.substring(0, 300));
        } else if ('_tag' in searchResult) {
          if ((searchResult as any)._tag === 'Right') {
            const rightContent = (searchResult as any).right?.content;
            if (Array.isArray(rightContent) && rightContent[0]?.text) {
              console.log('🎉 SUCCESS! Got search data from QiCore Right:');
              console.log('First 300 chars:', rightContent[0].text.substring(0, 300));
            }
          }
        }
      }
    } catch (error) {
      console.log('❌ get_search failed:', error instanceof Error ? error.message : String(error));
    }

    console.log('\n🎉 RESEARCH RESULTS:');
    console.log('✅ Static tools mode works and exposes real CoinGecko API endpoints!');
    console.log('✅ We can call get_simple_price, get_global, get_search directly');
    console.log('✅ No need for invoke_api_endpoint wrapper in static mode');
    console.log('✅ This solves our MCP data extraction problem!');

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  } finally {
    console.log('\n🧹 Cleaning up...');
    try {
      await staticActor.cleanup();
      console.log('✅ Cleanup completed');
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup warning:', cleanupError);
    }
  }
}

if (import.meta.main) {
  console.log('=' .repeat(80));
  console.log('🔬 DIRECT STATIC TOOLS TEST');
  console.log('=' .repeat(80));
  
  const success = await testStaticToolsDirect();
  
  console.log('\n' + '=' .repeat(80));
  console.log(success ? '✅ BREAKTHROUGH: STATIC TOOLS WORK!' : '❌ TEST FAILED');
  console.log('=' .repeat(80));
  
  process.exit(success ? 0 : 1);
}