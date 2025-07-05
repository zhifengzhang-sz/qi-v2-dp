#!/usr/bin/env bun

/**
 * TEST: @platformatic/kafka Simple Producer Test
 * 
 * Test basic producer functionality with @platformatic/kafka
 */

import { Producer } from '@platformatic/kafka';

async function testSimpleProducer() {
  console.log('🚀 TESTING: @platformatic/kafka Simple Producer\n');

  const producer = new Producer({
    clientId: 'simple-test-producer',
    bootstrapBrokers: ['localhost:19092'],
    maxInFlightRequests: 1,
    idempotent: true,
  });

  try {
    console.log('🔧 Testing producer connection...');
    
    // Test basic message sending
    console.log('📤 Testing message production...');
    const testMessage = {
      topic: 'simple-test-topic',
      key: Buffer.from('test-key'),
      value: Buffer.from(JSON.stringify({
        timestamp: new Date().toISOString(),
        message: 'Simple producer test successful!',
        client: '@platformatic/kafka',
        version: '1.7.0'
      })),
      headers: {
        source: Buffer.from('migration-test'),
        type: Buffer.from('test-message')
      }
    };

    const result = await producer.send({
      messages: [testMessage]
    });

    console.log('✅ Message sent successfully!');
    console.log('📊 Send result:', result);

    console.log('\n🎉 SIMPLE PRODUCER TEST SUCCESS:');
    console.log('✅ @platformatic/kafka producer working');
    console.log('✅ Message sending functional');
    console.log('✅ Connection to Redpanda established');
    console.log('✅ Buffer serialization working');

    return true;
  } catch (error) {
    console.error('❌ Simple producer test failed:', error);
    console.log('\n🔍 Troubleshooting notes:');
    console.log('- Ensure Redpanda is running on localhost:19092');
    console.log('- Check if @platformatic/kafka is compatible with Redpanda');
    console.log('- Verify network connectivity');
    return false;
  } finally {
    console.log('\n🧹 Cleaning up...');
    try {
      await producer.close();
      console.log('✅ Producer closed successfully');
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup warning:', cleanupError);
    }
  }
}

if (import.meta.main) {
  console.log('=' .repeat(80));
  console.log('🚀 @PLATFORMATIC/KAFKA SIMPLE PRODUCER TEST');
  console.log('=' .repeat(80));
  
  const success = await testSimpleProducer();
  
  console.log('\n' + '=' .repeat(80));
  console.log(success ? '✅ SIMPLE PRODUCER TEST SUCCESSFUL!' : '❌ SIMPLE PRODUCER TEST FAILED');
  console.log('=' .repeat(80));
  
  process.exit(success ? 0 : 1);
}