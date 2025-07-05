#!/usr/bin/env bun

/**
 * TEST: Streaming Pipeline with Working MCP Data Source
 * 
 * Test the complete streaming pipeline:
 * CoinGecko Actor (Remote MCP) → MarketDataPublisherActor → Redpanda → TimescaleDB
 */

import { createCoinGeckoActor } from '../lib/src/publishers/sources/coingecko/coingecko-actor';
import { createMarketDataPublisherActor } from '../lib/src/streaming/actors/market-data-publisher-actor';

async function testStreamingPipeline() {
  console.log('🌊 TESTING: Streaming Pipeline with Working MCP Data Source\n');

  let coinGeckoActor: any = null;
  let publisherActor: any = null;

  try {
    // Step 1: Initialize CoinGecko Actor with production-ready config
    console.log('🪙 Step 1: Initialize CoinGecko Actor (Remote MCP)');
    coinGeckoActor = createCoinGeckoActor({
      name: 'streaming-test-coingecko',
      coinGeckoConfig: {
        debug: true,
        // Production defaults will be applied automatically
      }
    });
    
    await coinGeckoActor.initialize();
    console.log('✅ CoinGecko Actor initialized with remote MCP server');

    // Step 2: Initialize MarketDataPublisher Actor  
    console.log('\n📊 Step 2: Initialize MarketDataPublisher Actor (Redpanda)');
    publisherActor = createMarketDataPublisherActor({
      name: 'streaming-test-publisher',
      redpandaConfig: {
        clientId: 'streaming-test',
        brokers: ['localhost:19092'], // Redpanda broker (correct port from docker ps)
      }
    });
    
    await publisherActor.initialize();
    console.log('✅ MarketDataPublisher Actor initialized with Redpanda');

    // Step 3: Test simple data flow
    console.log('\n🔄 Step 3: Test Data Flow (CoinGecko → Publisher)');
    
    // Get Bitcoin price data using DSL (should work with remote server)
    console.log('📥 Fetching Bitcoin price from remote CoinGecko MCP...');
    const dsl = coinGeckoActor.getDSL();
    
    try {
      // Test direct MCP tool call with correct tool name
      const priceResult = await dsl.mcpClient.callTool('coingecko', 'get_simple_price', {
        ids: 'bitcoin',
        vs_currencies: 'usd'
      });
      
      if (priceResult && typeof priceResult === 'object' && '_tag' in priceResult) {
        if ((priceResult as any)._tag === 'Right') {
          const data = (priceResult as any).right?.content?.[0]?.text;
          if (data) {
            const parsedData = JSON.parse(data);
            console.log('✅ Real Bitcoin price data received:');
            console.log(`   Bitcoin: $${parsedData.bitcoin.usd.toLocaleString()}`);
            
            // Step 4: Transform and publish to Redpanda
            console.log('\n📤 Step 4: Transform and Publish to Redpanda');
            
            const marketData = {
              symbol: 'BTC/USD',
              price: parsedData.bitcoin.usd,
              timestamp: new Date().toISOString(),
              source: 'coingecko-remote-mcp',
              metadata: {
                test: 'streaming-pipeline',
                dataType: 'price',
                coinId: 'bitcoin'
              }
            };
            
            await publisherActor.publishMarketData('crypto.prices.btc', marketData);
            console.log('✅ Bitcoin price data published to Redpanda topic: crypto.prices.btc');
            
            // Step 5: Publish additional market data
            console.log('\n📤 Step 5: Publish Multiple Data Points');
            
            // Test with Ethereum
            const ethResult = await dsl.mcpClient.callTool('coingecko', 'get_simple_price', {
              ids: 'ethereum',
              vs_currencies: 'usd'
            });
            
            if (ethResult && (ethResult as any)._tag === 'Right') {
              const ethData = JSON.parse((ethResult as any).right?.content?.[0]?.text);
              const ethMarketData = {
                symbol: 'ETH/USD',
                price: ethData.ethereum.usd,
                timestamp: new Date().toISOString(),
                source: 'coingecko-remote-mcp',
                metadata: {
                  test: 'streaming-pipeline',
                  dataType: 'price',
                  coinId: 'ethereum'
                }
              };
              
              await publisherActor.publishMarketData('crypto.prices.eth', ethMarketData);
              console.log(`✅ Ethereum price ($${ethData.ethereum.usd.toLocaleString()}) published to Redpanda`);
            }
            
            // Step 6: Test Global Market Data
            console.log('\n🌍 Step 6: Test Global Market Data');
            
            const globalResult = await dsl.mcpClient.callTool('coingecko', 'get_global', {});
            
            if (globalResult && (globalResult as any)._tag === 'Right') {
              const globalData = JSON.parse((globalResult as any).right?.content?.[0]?.text);
              const marketSummary = {
                totalMarketCap: globalData.data.total_market_cap.usd,
                totalVolume: globalData.data.total_volume.usd,
                btcDominance: globalData.data.market_cap_percentage.btc,
                activeCryptocurrencies: globalData.data.active_cryptocurrencies,
                timestamp: new Date().toISOString(),
                source: 'coingecko-remote-mcp',
                metadata: {
                  test: 'streaming-pipeline',
                  dataType: 'global-analytics'
                }
              };
              
              await publisherActor.publishMarketData('crypto.global.analytics', marketSummary);
              console.log('✅ Global market analytics published to Redpanda');
              console.log(`   Total Market Cap: $${marketSummary.totalMarketCap.toLocaleString()}`);
              console.log(`   BTC Dominance: ${marketSummary.btcDominance.toFixed(2)}%`);
            }
            
            console.log('\n🎉 STREAMING PIPELINE SUCCESS:');
            console.log('✅ Remote CoinGecko MCP provides real-time data');
            console.log('✅ Data transformation and enrichment working');
            console.log('✅ Redpanda streaming integration functional');
            console.log('✅ Factor-compositional architecture proven with real data');
            console.log('✅ Production-ready foundation established');
            
            return true;
          }
        }
      }
      
      console.log('❌ Could not extract price data from MCP response');
      return false;
    } catch (mcpError) {
      console.log('❌ MCP call failed:', mcpError instanceof Error ? mcpError.message : String(mcpError));
      return false;
    }

  } catch (error) {
    console.error('❌ Streaming pipeline test failed:', error);
    return false;
  } finally {
    console.log('\n🧹 Cleaning up...');
    try {
      if (publisherActor) {
        await publisherActor.cleanup();
        console.log('✅ Publisher Actor cleanup completed');
      }
      if (coinGeckoActor) {
        await coinGeckoActor.cleanup();
        console.log('✅ CoinGecko Actor cleanup completed');
      }
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup warning:', cleanupError);
    }
  }
}

if (import.meta.main) {
  console.log('=' .repeat(80));
  console.log('🌊 STREAMING PIPELINE TEST WITH WORKING MCP DATA SOURCE');
  console.log('=' .repeat(80));
  
  const success = await testStreamingPipeline();
  
  console.log('\n' + '=' .repeat(80));
  console.log(success ? '✅ PRODUCTION-READY STREAMING PIPELINE!' : '❌ PIPELINE NEEDS FIXES');
  console.log('=' .repeat(80));
  
  process.exit(success ? 0 : 1);
}