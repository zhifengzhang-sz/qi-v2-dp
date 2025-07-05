#!/usr/bin/env bun

/**
 * TEST: Direct KafkaJS Test
 * 
 * Test KafkaJS directly without any wrapper classes to isolate the issue
 */

import { Kafka } from 'kafkajs';

async function testDirectKafkaJS() {
  console.log('🚀 TESTING: Direct KafkaJS\n');

  const kafka = new Kafka({
    clientId: 'direct-kafkajs-test',
    brokers: ['localhost:19092'],
    retry: {
      initialRetryTime: 100,
      retries: 3,
    },
  });

  let admin;
  let producer;

  try {
    console.log('🔧 Testing direct KafkaJS admin connection...');
    admin = kafka.admin();
    await admin.connect();
    console.log('✅ Admin connected successfully!');

    console.log('📋 Testing topic listing...');
    const metadata = await admin.fetchTopicMetadata();
    console.log(`✅ Listed topics: ${metadata.topics.length} topics found`);
    console.log('📝 Sample topics:', metadata.topics.slice(0, 3).map(t => t.name).join(', '));

    console.log('\n🔧 Testing direct KafkaJS producer connection...');
    producer = kafka.producer({
      maxInFlightRequests: 1,
      idempotent: false, // Disable idempotent to avoid InitProducerId issues
    });
    await producer.connect();
    console.log('✅ Producer connected successfully!');

    console.log('📤 Testing message production...');
    const result = await producer.send({
      topic: 'direct-test-topic',
      messages: [
        {
          key: 'direct-test',
          value: JSON.stringify({
            timestamp: new Date().toISOString(),
            message: 'Direct KafkaJS test successful!',
            test: 'isolated'
          })
        }
      ]
    });

    console.log('✅ Message sent successfully!');
    console.log('📊 Send result:', result);

    console.log('\n🎉 DIRECT KAFKAJS SUCCESS:');
    console.log('✅ KafkaJS connects to localhost:19092');
    console.log('✅ Admin operations working');
    console.log('✅ Producer operations working');
    console.log('✅ No wrapper class interference');

    return true;
  } catch (error) {
    console.error('❌ Direct KafkaJS test failed:', error);
    
    // Detailed error analysis
    if (error instanceof Error && error.message.includes('ENOTFOUND')) {
      console.log('\n🔍 DNS Resolution Error:');
      console.log('- Hostname could not be resolved');
      console.log('- Check network configuration');
    } else if (error instanceof Error && error.message.includes('Connection timeout')) {
      console.log('\n🔍 Connection Timeout:');
      console.log('- Redpanda may not be accepting connections');
      console.log('- Check if port 19092 is accessible');
    }
    
    return false;
  } finally {
    console.log('\n🧹 Cleaning up...');
    try {
      if (producer) {
        await producer.disconnect();
        console.log('✅ Producer disconnected');
      }
      if (admin) {
        await admin.disconnect();
        console.log('✅ Admin disconnected');
      }
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup warning:', cleanupError);
    }
  }
}

if (import.meta.main) {
  console.log('=' .repeat(80));
  console.log('🚀 DIRECT KAFKAJS TEST');
  console.log('=' .repeat(80));
  
  const success = await testDirectKafkaJS();
  
  console.log('\n' + '=' .repeat(80));
  console.log(success ? '✅ DIRECT KAFKAJS WORKING!' : '❌ DIRECT KAFKAJS FAILED');
  console.log('=' .repeat(80));
  
  process.exit(success ? 0 : 1);
}