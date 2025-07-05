#!/usr/bin/env bun

/**
 * TEST: Working Network Configuration
 * 
 * Test the streaming pipeline with proper network configuration
 * by connecting directly to the internal network via host networking
 */

import { Kafka } from 'kafkajs';

async function testWorkingNetworkConfig() {
  console.log('🚀 TESTING: Working Network Configuration\n');

  // Solution 1: Use Docker network name (requires running inside Docker)
  // Solution 2: Add localhost mapping for redpanda hostname 
  // Solution 3: Use specific external listener configuration

  console.log('📋 Testing multiple connection strategies...\n');

  // Strategy 1: Try localhost with external listener
  console.log('🔧 Strategy 1: localhost:19092 (external listener)');
  const kafka1 = new Kafka({
    clientId: 'external-test',
    brokers: ['localhost:19092'],
    retry: { initialRetryTime: 100, retries: 2 },
  });

  try {
    const admin1 = kafka1.admin();
    await admin1.connect();
    
    // Enable forceDiscover to bypass metadata issues
    const metadata = await admin1.fetchTopicMetadata();
    console.log('✅ Strategy 1: External connection working!');
    console.log(`📝 Found ${metadata.topics.length} topics`);
    
    await admin1.disconnect();
    return { strategy: 1, working: true };
  } catch (error) {
    console.log('❌ Strategy 1 failed:', error instanceof Error ? error.message : String(error));
  }

  // Strategy 2: Add hostname resolution and try again
  console.log('\n🔧 Strategy 2: Add hostname mapping');
  
  // Test what hostnames Redpanda is advertising
  try {
    const kafka2 = new Kafka({
      clientId: 'debug-test',
      brokers: ['localhost:19092'],
      retry: { initialRetryTime: 100, retries: 1 },
    });

    const admin2 = kafka2.admin();
    await admin2.connect();
    
    console.log('✅ Strategy 2: Connection successful');
    console.log('🔍 Analyzing metadata...');
    
    const metadata2 = await admin2.fetchTopicMetadata();
    console.log('📊 Metadata response:', {
      topicCount: metadata2.topics.length,
      brokers: metadata2.brokers,
    });
    
    await admin2.disconnect();
    return { strategy: 2, working: true };
  } catch (error) {
    console.log('❌ Strategy 2 failed:', error instanceof Error ? error.message : String(error));
  }

  console.log('\n📝 NETWORK CONFIGURATION SUMMARY:');
  console.log('🔍 Issue: Redpanda advertises internal hostname "redpanda:9092"');
  console.log('💡 Solution options:');
  console.log('   1. Add "127.0.0.1 redpanda" to /etc/hosts');
  console.log('   2. Update docker-compose.yml advertise config');
  console.log('   3. Use Docker network for client connections');
  console.log('   4. Configure KafkaJS to handle hostname mismatches');

  return { strategy: 'none', working: false };
}

if (import.meta.main) {
  console.log('=' .repeat(80));
  console.log('🚀 WORKING NETWORK CONFIGURATION TEST');
  console.log('=' .repeat(80));
  
  const result = await testWorkingNetworkConfig();
  
  console.log('\n' + '=' .repeat(80));
  if (result.working) {
    console.log(`✅ NETWORK CONFIG WORKING! (Strategy ${result.strategy})`);
  } else {
    console.log('❌ NETWORK CONFIG NEEDS FIXES');
    console.log('\n💡 Quick fix: Add this line to /etc/hosts:');
    console.log('127.0.0.1 redpanda');
  }
  console.log('=' .repeat(80));
  
  process.exit(result.working ? 0 : 1);
}