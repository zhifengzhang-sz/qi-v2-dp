#!/usr/bin/env bun

/**
 * RESEARCH: CoinGecko MCP Parameter Format Issue
 * 
 * The issue is "Invalid arguments for endpoint. [object Object]" which suggests
 * the parameters are being serialized incorrectly. Let me test different formats.
 */

import { createCoinGeckoActor } from '../lib/src/publishers/sources/coingecko/coingecko-actor';

async function researchParameterFormat() {
  console.log('🔬 RESEARCH: CoinGecko MCP Parameter Format Issue\n');

  const coinGeckoActor = createCoinGeckoActor({
    name: 'param-research',
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

    console.log('🔍 RESEARCH: Parameter Format Testing\n');

    // First, let's see what the schema expects for get_simple_price
    console.log('📋 Step 1: Get schema for get_simple_price endpoint');
    
    try {
      const schema = await mcpClient.callTool('coingecko', 'get_api_endpoint_schema', {
        endpoint: 'get_simple_price'
      });
      
      console.log('✅ Schema retrieved successfully');
      if (schema && typeof schema === 'object' && 'right' in schema) {
        const schemaContent = (schema as any).right?.content?.[0]?.text;
        if (schemaContent) {
          console.log('📊 Schema Details:');
          try {
            const parsedSchema = JSON.parse(schemaContent);
            console.log('Required fields:', JSON.stringify(parsedSchema.inputSchema?.properties || {}, null, 2));
          } catch (e) {
            console.log('Schema text (first 500 chars):', schemaContent.substring(0, 500));
          }
        }
      }
    } catch (error) {
      console.log('❌ Schema retrieval failed:', error instanceof Error ? error.message : String(error));
    }

    console.log('\n📋 Step 2: Test different parameter formats for invoke_api_endpoint\n');

    // Test different ways of passing parameters
    const parameterTests = [
      {
        name: 'Format 1: Direct object parameters',
        params: {
          endpoint: 'get_simple_price',
          parameters: {
            ids: 'bitcoin',
            vs_currencies: 'usd'
          }
        }
      },
      {
        name: 'Format 2: String-encoded parameters',
        params: {
          endpoint: 'get_simple_price',
          parameters: JSON.stringify({
            ids: 'bitcoin',
            vs_currencies: 'usd'
          })
        }
      },
      {
        name: 'Format 3: Flat structure',
        params: {
          endpoint: 'get_simple_price',
          ids: 'bitcoin',
          vs_currencies: 'usd'
        }
      },
      {
        name: 'Format 4: URL-style parameters',
        params: {
          endpoint: 'get_simple_price',
          parameters: 'ids=bitcoin&vs_currencies=usd'
        }
      },
      {
        name: 'Format 5: Array format',
        params: {
          endpoint: 'get_simple_price',
          parameters: [
            { key: 'ids', value: 'bitcoin' },
            { key: 'vs_currencies', value: 'usd' }
          ]
        }
      },
      {
        name: 'Format 6: Empty parameters for get_global',
        params: {
          endpoint: 'get_global',
          parameters: {}
        }
      },
      {
        name: 'Format 7: No parameters field for get_global',
        params: {
          endpoint: 'get_global'
        }
      },
      {
        name: 'Format 8: Null parameters',
        params: {
          endpoint: 'get_global',
          parameters: null
        }
      }
    ];

    for (const test of parameterTests) {
      console.log(`🧪 Testing ${test.name}`);
      console.log(`   Parameters:`, JSON.stringify(test.params, null, 2));
      
      try {
        const response = await mcpClient.callTool('coingecko', 'invoke_api_endpoint', test.params);
        
        console.log(`   ✅ Success! Response type:`, typeof response);
        
        if (response && typeof response === 'object') {
          if ('_tag' in response) {
            console.log(`   📊 QiCore Result _tag:`, (response as any)._tag);
            
            if ((response as any)._tag === 'Right') {
              const rightValue = (response as any).right;
              if (rightValue && 'content' in rightValue) {
                const content = rightValue.content;
                if (Array.isArray(content) && content.length > 0 && content[0].text) {
                  console.log(`   🎉 SUCCESS! Got data, length:`, content[0].text.length);
                  console.log(`   📄 First 200 chars:`, content[0].text.substring(0, 200));
                } else {
                  console.log(`   ⚠️ Right response but no content`);
                }
              }
            } else if ((response as any)._tag === 'Left') {
              console.log(`   ❌ Left response (error):`, (response as any).left?.message);
            }
          }
        }
      } catch (error) {
        console.log(`   ❌ Error:`, error instanceof Error ? error.message : String(error));
      }
      console.log('');
    }

    console.log('\n📋 Step 3: Test with successful parameters on simpler endpoints\n');

    // Test with endpoints that might be more forgiving
    const simpleTests = [
      {
        name: 'get_search with query',
        params: {
          endpoint: 'get_search',
          parameters: { query: 'bitcoin' }
        }
      },
      {
        name: 'get_search with string query',
        params: {
          endpoint: 'get_search',
          parameters: JSON.stringify({ query: 'bitcoin' })
        }
      }
    ];

    for (const test of simpleTests) {
      console.log(`🧪 Testing ${test.name}`);
      
      try {
        const response = await mcpClient.callTool('coingecko', 'invoke_api_endpoint', test.params);
        
        if (response && typeof response === 'object' && '_tag' in response) {
          if ((response as any)._tag === 'Right') {
            const content = (response as any).right?.content;
            if (Array.isArray(content) && content.length > 0 && content[0].text) {
              console.log(`   🎉 SUCCESS! Data length:`, content[0].text.length);
              console.log(`   📄 Sample:`, content[0].text.substring(0, 100));
            }
          } else {
            console.log(`   ❌ Error:`, (response as any).left?.message);
          }
        }
      } catch (error) {
        console.log(`   ❌ Error:`, error instanceof Error ? error.message : String(error));
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
  console.log('🔬 COINGECKO MCP PARAMETER FORMAT RESEARCH');
  console.log('=' .repeat(80));
  
  const success = await researchParameterFormat();
  
  console.log('\n' + '=' .repeat(80));
  console.log(success ? '✅ RESEARCH COMPLETED' : '❌ RESEARCH FAILED');
  console.log('=' .repeat(80));
  
  process.exit(success ? 0 : 1);
}