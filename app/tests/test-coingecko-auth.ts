#!/usr/bin/env bun

// Quick test of CoinGecko MCP server with demo API key
import { OfficialCoinGeckoMCPLauncher } from '../lib/src/mcp-launchers/coingecko-mcp-launcher';
import { MCPClient } from '@qicore/agent-lib';

async function testCoinGeckoAuth() {
  console.log('🧪 Testing CoinGecko MCP Server with demo API key...\n');
  
  const launcher = new OfficialCoinGeckoMCPLauncher({
    environment: 'free',
    debug: true,
  });
  
  const mcpClient = new MCPClient({
    info: (msg) => console.log(`📘 ${msg}`),
    warn: (msg) => console.warn(`⚠️  ${msg}`),
    error: (msg) => console.error(`❌ ${msg}`)
  });
  
  try {
    // Start MCP server
    console.log('🚀 Starting CoinGecko MCP server...');
    await launcher.start();
    
    // Connect MCP client
    console.log('🔌 Connecting MCP client...');
    const serverConfig = {
      name: 'coingecko',
      command: 'npx',
      args: ['-y', '@coingecko/coingecko-mcp']
    };
    await mcpClient.connectToServer(serverConfig);
    
    // Test a simple tool call
    console.log('🔧 Testing get_simple_price tool...');
    const result = await mcpClient.callTool('coingecko', 'get_simple_price', {
      ids: 'bitcoin',
      vs_currencies: 'usd'
    });
    
    console.log('✅ Success! Tool call worked with demo API key');
    console.log(`📊 Result:`, result);
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    try {
      await mcpClient.disconnect();
      await launcher.stop();
      console.log('✅ Cleanup completed');
    } catch (cleanupError) {
      console.warn('⚠️  Cleanup warning:', cleanupError);
    }
  }
}

// Run the test
testCoinGeckoAuth()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Demo API key configuration works!');
      process.exit(0);
    } else {
      console.log('\n💰 Demo API key failed - you may need a real API key');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Test script failed:', error);
    process.exit(1);
  });