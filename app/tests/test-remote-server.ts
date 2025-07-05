#!/usr/bin/env bun

/**
 * RESEARCH: Test Remote CoinGecko MCP Server
 * 
 * Let's test the remote server which should handle authentication automatically
 * and see if it provides working tools without configuration issues.
 */

import { createCoinGeckoActor } from '../lib/src/publishers/sources/coingecko/coingecko-actor';

async function testRemoteServer() {
  console.log('🔬 RESEARCH: Remote CoinGecko MCP Server Test\n');

  const remoteActor = createCoinGeckoActor({
    name: 'remote-test',
    coinGeckoConfig: {
      debug: true,
      useRemoteServer: true, // Use official remote server
      environment: 'free',
    }
  });

  try {
    console.log('🔧 Initializing remote server mode...');
    await remoteActor.initialize();
    
    // Get direct access to MCP client
    const dsl = (remoteActor as any).dsl;
    const mcpClient = (dsl as any).mcpClient;
    
    if (!mcpClient) {
      throw new Error('MCP Client not available');
    }

    console.log('📊 Testing remote server tool calls:\n');

    // Test 1: get_simple_price via remote server
    console.log('🧪 Test 1: Remote get_simple_price call');
    console.log('Parameters: { ids: "bitcoin", vs_currencies: "usd" }');
    
    try {
      const priceResult = await mcpClient.callTool('coingecko', 'get_simple_price', {
        ids: 'bitcoin',
        vs_currencies: 'usd'
      });
      
      console.log('✅ get_simple_price succeeded!');
      console.log('Response type:', typeof priceResult);
      
      if (priceResult && typeof priceResult === 'object') {
        if ('content' in priceResult && Array.isArray(priceResult.content) && priceResult.content[0]?.text) {
          console.log('🎉 SUCCESS! Got price data from remote server:');
          console.log('Data length:', priceResult.content[0].text.length);
          console.log('Raw data:', priceResult.content[0].text);
          
          // Try to parse the JSON
          try {
            const parsedData = JSON.parse(priceResult.content[0].text);
            console.log('📊 Parsed price data:', JSON.stringify(parsedData, null, 2));
          } catch (parseError) {
            console.log('📄 First 200 chars:', priceResult.content[0].text.substring(0, 200));
          }
        } else if ('_tag' in priceResult) {
          if ((priceResult as any)._tag === 'Right') {
            const rightContent = (priceResult as any).right?.content;
            if (Array.isArray(rightContent) && rightContent[0]?.text) {
              console.log('🎉 SUCCESS! Got price data from QiCore Right:');
              console.log('Data:', rightContent[0].text);
            } else {
              console.log('📋 QiCore Right structure:', JSON.stringify((priceResult as any).right, null, 2));
            }
          } else {
            console.log('❌ QiCore Left error:', (priceResult as any).left?.message);
          }
        } else {
          console.log('📋 Full response structure:', JSON.stringify(priceResult, null, 2));
        }
      }
    } catch (error) {
      console.log('❌ get_simple_price failed:', error instanceof Error ? error.message : String(error));
    }

    console.log('\n🧪 Test 2: Remote get_global call');
    
    try {
      const globalResult = await mcpClient.callTool('coingecko', 'get_global', {});
      
      console.log('✅ get_global succeeded!');
      
      if (globalResult && typeof globalResult === 'object') {
        if ('content' in globalResult && Array.isArray(globalResult.content) && globalResult.content[0]?.text) {
          console.log('🎉 SUCCESS! Got global data from remote server:');
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

    console.log('\n🧪 Test 3: Remote get_search call');
    
    try {
      const searchResult = await mcpClient.callTool('coingecko', 'get_search', {
        query: 'bitcoin'
      });
      
      console.log('✅ get_search succeeded!');
      
      if (searchResult && typeof searchResult === 'object') {
        if ('content' in searchResult && Array.isArray(searchResult.content) && searchResult.content[0]?.text) {
          console.log('🎉 SUCCESS! Got search data from remote server:');
          console.log('Data length:', searchResult.content[0].text.length);
          console.log('First 300 chars:', searchResult.content[0].text.substring(0, 300));
        } else if ('_tag' in searchResult) {
          if ((searchResult as any)._tag === 'Right') {
            const rightContent = (searchResult as any).right?.content;
            if (Array.isArray(rightContent) && rightContent[0]?.text) {
              console.log('🎉 SUCCESS! Got search data from QiCore Right:');
              console.log('First 300 chars:', rightContent[0].text.substring(0, 300));
            }
          } else {
            console.log('❌ QiCore Left error:', (searchResult as any).left?.message);
          }
        }
      }
    } catch (error) {
      console.log('❌ get_search failed:', error instanceof Error ? error.message : String(error));
    }

    console.log('\n🎉 REMOTE SERVER RESULTS:');
    console.log('✅ Testing if remote CoinGecko MCP server provides working data');
    console.log('✅ Remote server should handle authentication automatically');
    console.log('✅ If this works, we have our solution for production-ready data!');

    return true;
  } catch (error) {
    console.error('❌ Remote server test failed:', error);
    return false;
  } finally {
    console.log('\n🧹 Cleaning up...');
    try {
      await remoteActor.cleanup();
      console.log('✅ Cleanup completed');
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup warning:', cleanupError);
    }
  }
}

if (import.meta.main) {
  console.log('=' .repeat(80));
  console.log('🔬 REMOTE COINGECKO MCP SERVER TEST');
  console.log('=' .repeat(80));
  
  const success = await testRemoteServer();
  
  console.log('\n' + '=' .repeat(80));
  console.log(success ? '✅ REMOTE SERVER TEST COMPLETED' : '❌ TEST FAILED');
  console.log('=' .repeat(80));
  
  process.exit(success ? 0 : 1);
}