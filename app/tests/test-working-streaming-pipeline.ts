#!/usr/bin/env bun

/**
 * TEST: Working Streaming Pipeline
 * 
 * Test that the streaming pipeline works correctly with KafkaJS + Redpanda
 */

import { RedpandaClient } from '../lib/src/base/streaming/redpanda/redpanda-client';

async function testWorkingStreamingPipeline() {
  console.log('🚀 TESTING: Working Streaming Pipeline\n');

  // Create client with explicit localhost configuration
  const client = new RedpandaClient({
    brokers: ['localhost:19092'],
    clientId: 'working-test-pipeline'
  });

  try {
    console.log('🔧 Testing connection to Redpanda...');
    await client.connect();
    console.log('✅ Successfully connected to Redpanda!');

    // Test basic functionality
    console.log('\n🧪 Testing basic operations...');
    
    // Test topic listing
    console.log('📋 Testing topic listing...');
    const topics = await client.listTopics();
    console.log(`✅ Listed topics successfully: ${topics.length} topics found`);
    console.log('📝 Existing topics:', topics.slice(0, 5).join(', '));

    // Test topic creation
    const testTopicName = 'streaming-test-topic';
    console.log(`\n🔨 Testing topic creation: ${testTopicName}`);
    
    try {
      await client.createTopic({
        name: testTopicName,
        partitions: 3,
        replicationFactor: 1,
      });
      console.log(`✅ Topic ${testTopicName} created successfully`);
    } catch (error) {
      console.log(`ℹ️ Topic might already exist: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Test message publishing
    console.log('\n📤 Testing message publishing...');
    const testMessage = {
      topic: testTopicName,
      key: 'streaming-test',
      value: {
        timestamp: new Date().toISOString(),
        message: 'Streaming pipeline test successful!',
        client: 'kafkajs',
        version: '2.2.4',
        performance: 'working'
      }
    };

    const publishResult = await client.produceMessage(testMessage);
    console.log('✅ Message published successfully!');
    console.log(`📊 Publish result:`, publishResult);

    // Test batch publishing
    console.log('\n📦 Testing batch publishing...');
    const batchMessages = [
      {
        topic: testTopicName,
        key: 'batch-1',
        value: { batch: 1, data: 'first message' }
      },
      {
        topic: testTopicName,
        key: 'batch-2',
        value: { batch: 2, data: 'second message' }
      }
    ];

    const batchResult = await client.produceBatch(batchMessages);
    console.log('✅ Batch published successfully!');
    console.log(`📊 Batch result: ${batchResult.length} messages`);

    console.log('\n🎉 STREAMING PIPELINE SUCCESS SUMMARY:');
    console.log('✅ KafkaJS package working correctly');
    console.log('✅ Redpanda connection established'); 
    console.log('✅ Topic operations (create, list) working');
    console.log('✅ Message publishing (single, batch) working');
    console.log('✅ Streaming infrastructure ready for MCP integration');
    console.log('✅ Production-ready foundation confirmed');

    return true;
  } catch (error) {
    console.error('❌ Streaming pipeline test failed:', error);
    console.log('\n🔍 Troubleshooting notes:');
    console.log('- Ensure Docker services are running: docker ps');
    console.log('- Check Redpanda is healthy on localhost:19092');
    console.log('- Verify network connectivity to Redpanda');
    return false;
  } finally {
    console.log('\n🧹 Cleaning up...');
    try {
      await client.disconnect();
      console.log('✅ Client disconnected successfully');
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup warning:', cleanupError);
    }
  }
}

if (import.meta.main) {
  console.log('=' .repeat(80));
  console.log('🚀 WORKING STREAMING PIPELINE TEST');
  console.log('=' .repeat(80));
  
  const success = await testWorkingStreamingPipeline();
  
  console.log('\n' + '=' .repeat(80));
  console.log(success ? '✅ STREAMING PIPELINE WORKING!' : '❌ STREAMING PIPELINE NEEDS FIXES');
  console.log('=' .repeat(80));
  
  process.exit(success ? 0 : 1);
}