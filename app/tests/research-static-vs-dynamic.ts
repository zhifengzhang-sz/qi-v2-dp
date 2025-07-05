#!/usr/bin/env bun

/**
 * RESEARCH: Static vs Dynamic Tools Mode for CoinGecko MCP
 * 
 * Based on documentation: 
 * - Dynamic tools can "struggle to provide the correct properties"
 * - Static tools expose one tool per endpoint with better reliability
 * 
 * Let's test both modes to see which works.
 */

import { createCoinGeckoActor } from '../lib/src/publishers/sources/coingecko/coingecko-actor';

async function researchStaticVsDynamic() {
  console.log('🔬 RESEARCH: Static vs Dynamic Tools Mode\n');

  console.log('📋 TEST 1: STATIC TOOLS MODE (without --tools=dynamic)\n');

  // Test 1: Static tools mode (remove --tools=dynamic)
  const staticActor = createCoinGeckoActor({
    name: 'static-test',
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
    const staticDsl = (staticActor as any).dsl;
    const staticMcpClient = (staticDsl as any).mcpClient;
    
    if (staticMcpClient) {
      console.log('\n📊 Static Tools Available:');
      
      // List available tools in static mode
      const tools = await staticMcpClient.listTools('coingecko');
      if (tools && Array.isArray(tools)) {
        console.log(`✅ Found ${tools.length} static tools:`);
        tools.slice(0, 10).forEach((tool: any) => {
          console.log(`   - ${tool.name}: ${tool.description?.substring(0, 60)}...`);
        });
        if (tools.length > 10) {
          console.log(`   ... and ${tools.length - 10} more tools`);
        }
        
        // Test direct tool calls in static mode
        console.log('\n🧪 Testing static tool calls:');
        
        // Test 1: get_simple_price (if it exists)
        const simplePriceTool = tools.find((t: any) => t.name === 'get_simple_price');
        if (simplePriceTool) {
          console.log('\n📋 Testing get_simple_price static tool:');
          try {
            const result = await staticMcpClient.callTool('coingecko', 'get_simple_price', {
              ids: 'bitcoin',
              vs_currencies: 'usd'
            });
            
            if (result && typeof result === 'object') {
              console.log('✅ Static get_simple_price succeeded!');
              if ('content' in result && Array.isArray(result.content) && result.content[0]?.text) {
                console.log(`📄 Response length:`, result.content[0].text.length);
                console.log(`📄 Sample:`, result.content[0].text.substring(0, 200));
              }
            }
          } catch (error) {
            console.log('❌ Static get_simple_price failed:', error instanceof Error ? error.message : String(error));
          }
        } else {
          console.log('⚠️ get_simple_price tool not found in static mode');
        }
        
        // Test 2: get_global (if it exists)
        const globalTool = tools.find((t: any) => t.name === 'get_global');
        if (globalTool) {
          console.log('\n📋 Testing get_global static tool:');
          try {
            const result = await staticMcpClient.callTool('coingecko', 'get_global', {});
            
            if (result && typeof result === 'object') {
              console.log('✅ Static get_global succeeded!');
              if ('content' in result && Array.isArray(result.content) && result.content[0]?.text) {
                console.log(`📄 Response length:`, result.content[0].text.length);
                console.log(`📄 Sample:`, result.content[0].text.substring(0, 200));
              }
            }
          } catch (error) {
            console.log('❌ Static get_global failed:', error instanceof Error ? error.message : String(error));
          }
        } else {
          console.log('⚠️ get_global tool not found in static mode');
        }
        
      } else {
        console.log('❌ No tools found in static mode');
      }
    }
    
  } catch (error) {
    console.error('❌ Static mode test failed:', error);
  } finally {
    try {
      await staticActor.cleanup();
      console.log('✅ Static mode cleanup completed');
    } catch (cleanupError) {
      console.warn('⚠️ Static cleanup warning:', cleanupError);
    }
  }

  console.log('\n\n📋 TEST 2: DYNAMIC TOOLS MODE (with --tools=dynamic)\n');

  // Test 2: Dynamic tools mode (current implementation)
  const dynamicActor = createCoinGeckoActor({
    name: 'dynamic-test',
    coinGeckoConfig: {
      debug: true,
      useRemoteServer: false,
      environment: 'demo',
      useDynamicTools: true, // Use dynamic tools mode
    }
  });

  try {
    console.log('🔧 Initializing dynamic tools mode...');
    await dynamicActor.initialize();
    
    // Get direct access to MCP client
    const dynamicDsl = (dynamicActor as any).dsl;
    const dynamicMcpClient = (dynamicDsl as any).mcpClient;
    
    if (dynamicMcpClient) {
      console.log('\n📊 Dynamic Tools Available:');
      
      // List available tools in dynamic mode
      const tools = await dynamicMcpClient.listTools('coingecko');
      if (tools && Array.isArray(tools)) {
        console.log(`✅ Found ${tools.length} dynamic tools:`);
        tools.forEach((tool: any) => {
          console.log(`   - ${tool.name}: ${tool.description?.substring(0, 80)}...`);
        });
        
        // Test the dynamic workflow
        console.log('\n🧪 Testing dynamic tools workflow:');
        
        // Step 1: list_api_endpoints
        console.log('\n📋 Step 1: list_api_endpoints');
        try {
          const endpoints = await dynamicMcpClient.callTool('coingecko', 'list_api_endpoints', {});
          console.log('✅ list_api_endpoints succeeded');
          
          // Step 2: get_api_endpoint_schema for get_simple_price
          console.log('\n📋 Step 2: get_api_endpoint_schema for get_simple_price');
          const schema = await dynamicMcpClient.callTool('coingecko', 'get_api_endpoint_schema', {
            endpoint: 'get_simple_price'
          });
          console.log('✅ get_api_endpoint_schema succeeded');
          
          // Step 3: invoke_api_endpoint with correct format
          console.log('\n📋 Step 3: invoke_api_endpoint with various formats');
          
          // Let's try calling it as documented vs as we've been doing
          const testFormats = [
            {
              name: 'Our current format',
              params: {
                endpoint: 'get_simple_price',
                parameters: {
                  ids: 'bitcoin',
                  vs_currencies: 'usd'
                }
              }
            }
          ];
          
          for (const test of testFormats) {
            try {
              console.log(`🧪 Testing ${test.name}:`, JSON.stringify(test.params, null, 2));
              const result = await dynamicMcpClient.callTool('coingecko', 'invoke_api_endpoint', test.params);
              
              if (result && typeof result === 'object' && '_tag' in result) {
                if ((result as any)._tag === 'Right') {
                  console.log('🎉 SUCCESS! Dynamic invoke_api_endpoint worked!');
                  const content = (result as any).right?.content;
                  if (Array.isArray(content) && content[0]?.text) {
                    console.log(`📄 Response length:`, content[0].text.length);
                    console.log(`📄 Sample:`, content[0].text.substring(0, 200));
                  }
                } else {
                  console.log('❌ Left response:', (result as any).left?.message);
                }
              }
            } catch (error) {
              console.log(`❌ ${test.name} failed:`, error instanceof Error ? error.message : String(error));
            }
          }
          
        } catch (error) {
          console.log('❌ Dynamic workflow failed:', error instanceof Error ? error.message : String(error));
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Dynamic mode test failed:', error);
  } finally {
    try {
      await dynamicActor.cleanup();
      console.log('✅ Dynamic mode cleanup completed');
    } catch (cleanupError) {
      console.warn('⚠️ Dynamic cleanup warning:', cleanupError);
    }
  }

  console.log('\n\n🔍 RESEARCH CONCLUSION\n');
  console.log('Based on CoinGecko MCP documentation:');
  console.log('- Dynamic tools can "struggle to provide the correct properties"');
  console.log('- Static tools are more reliable for specific endpoints');
  console.log('- We should test both modes to see which works better');
  
  return true;
}

if (import.meta.main) {
  console.log('=' .repeat(80));
  console.log('🔬 STATIC VS DYNAMIC TOOLS MODE RESEARCH');
  console.log('=' .repeat(80));
  
  const success = await researchStaticVsDynamic();
  
  console.log('\n' + '=' .repeat(80));
  console.log(success ? '✅ RESEARCH COMPLETED' : '❌ RESEARCH FAILED');
  console.log('=' .repeat(80));
  
  process.exit(success ? 0 : 1);
}