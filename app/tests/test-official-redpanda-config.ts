#!/usr/bin/env bun

/**
 * TEST: Official RedPanda Configuration
 * 
 * Test using the exact configuration pattern from RedPanda official docs
 */

import { Kafka } from 'kafkajs';

async function testOfficialRedpandaConfig() {
  console.log('🚀 TESTING: Official RedPanda Configuration\n');

  // Use exact configuration from RedPanda Labs documentation
  const kafka = new Kafka({
    clientId: 'qicore-crypto-platform',
    brokers: ['localhost:19092'], // Official external connection pattern
    retry: { initialRetryTime: 100, retries: 3 },
  });

  let producer;
  let consumer;

  try {
    console.log('🔧 Connecting producer...');
    producer = kafka.producer();
    await producer.connect();
    console.log('✅ Producer connected to localhost:19092');

    console.log('🔧 Connecting consumer...');
    consumer = kafka.consumer({ groupId: 'qicore-test-group' });
    await consumer.connect();
    console.log('✅ Consumer connected to localhost:19092');

    console.log('\n📝 Creating test topic...');
    const admin = kafka.admin();
    await admin.connect();
    
    try {
      await admin.createTopics({
        topics: [{
          topic: 'official-test-topic',
          numPartitions: 1,
          replicationFactor: 1,
        }]
      });
      console.log('✅ Topic created successfully');
    } catch (error) {
      console.log('ℹ️ Topic might already exist');
    }
    
    await admin.disconnect();

    console.log('\n📤 Producing test messages...');
    
    // Subscribe consumer first
    await consumer.subscribe({ topic: 'official-test-topic' });
    
    // Set up message collection
    const receivedMessages: any[] = [];
    const messagePromise = new Promise((resolve) => {
      consumer.run({
        eachMessage: async ({ message }) => {
          const data = JSON.parse(message.value?.toString() || '{}');
          receivedMessages.push(data);
          console.log('📨 Received message:', data);
          if (receivedMessages.length >= 3) resolve(receivedMessages);
        }
      });
    });

    // Send test messages
    for (let i = 1; i <= 3; i++) {
      const testMessage = {
        timestamp: new Date().toISOString(),
        id: i,
        type: 'crypto-price',
        symbol: 'BTC',
        price: 50000 + (Math.random() * 10000),
        volume: Math.random() * 1000000
      };

      await producer.send({
        topic: 'official-test-topic',
        messages: [{ value: JSON.stringify(testMessage) }]
      });
      
      console.log(`✅ Message ${i} sent:`, { id: testMessage.id, price: testMessage.price });
    }

    console.log('\n⏳ Waiting for messages...');
    await Promise.race([
      messagePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for messages')), 10000))
    ]);

    console.log('\n🎉 OFFICIAL CONFIGURATION SUCCESS:');
    console.log('✅ Connected to RedPanda via localhost:19092');
    console.log('✅ Producer working correctly');
    console.log('✅ Consumer working correctly');
    console.log(`✅ Sent and received ${receivedMessages.length} messages`);
    console.log('✅ Data publishing and consumption working!');

    return true;
  } catch (error) {
    console.error('❌ Official configuration test failed:', error);
    console.log('\n🔍 Error details:');
    if (error instanceof Error) {
      console.log('- Message:', error.message);
      if ('code' in error) {
        console.log('- Code:', error.code);
      }
    }
    return false;
  } finally {
    console.log('\n🧹 Cleaning up...');
    try {
      if (consumer) {
        await consumer.disconnect();
        console.log('✅ Consumer disconnected');
      }
      if (producer) {
        await producer.disconnect();
        console.log('✅ Producer disconnected');
      }
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup warning:', cleanupError);
    }
  }
}

if (import.meta.main) {
  console.log('=' .repeat(80));
  console.log('🚀 OFFICIAL REDPANDA CONFIGURATION TEST');
  console.log('=' .repeat(80));
  
  const success = await testOfficialRedpandaConfig();
  
  console.log('\n' + '=' .repeat(80));
  console.log(success ? '✅ OFFICIAL CONFIG WORKING!' : '❌ OFFICIAL CONFIG FAILED');
  console.log('=' .repeat(80));
  
  process.exit(success ? 0 : 1);
}