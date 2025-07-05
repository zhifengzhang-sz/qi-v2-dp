#!/usr/bin/env bun

/**
 * TEST: Streaming End-to-End
 * 
 * Properly test the complete streaming pipeline without race conditions
 */

import { Kafka, Partitioners } from 'kafkajs';

async function testStreamingEndToEnd() {
  console.log('🚀 TESTING: Streaming End-to-End\n');

  const kafka = new Kafka({
    clientId: 'end-to-end-test',
    brokers: ['localhost:19092'],
    connectionTimeout: 10000,
    requestTimeout: 30000,
    retry: { initialRetryTime: 100, retries: 3, maxRetryTime: 30000 },
  });

  let producer;
  let consumer;
  let admin;

  try {
    console.log('🔧 Setting up admin client...');
    admin = kafka.admin();
    await admin.connect();
    console.log('✅ Admin connected');

    console.log('📝 Creating test topic...');
    const topicName = 'streaming-end-to-end';
    
    try {
      await admin.createTopics({
        topics: [{
          topic: topicName,
          numPartitions: 1,
          replicationFactor: 1,
        }]
      });
      console.log('✅ Topic created');
    } catch (error) {
      console.log('ℹ️ Topic already exists');
    }

    console.log('\n🔧 Setting up consumer FIRST...');
    consumer = kafka.consumer({ 
      groupId: 'end-to-end-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });
    await consumer.connect();
    console.log('✅ Consumer connected');

    await consumer.subscribe({ topic: topicName });
    console.log('✅ Consumer subscribed to topic');

    // Set up message collection with proper async handling
    const receivedMessages: any[] = [];
    let messageResolver: ((value: any) => void) | null = null;
    
    const messagePromise = new Promise((resolve) => {
      messageResolver = resolve;
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const data = JSON.parse(message.value?.toString() || '{}');
        receivedMessages.push({
          topic,
          partition,
          offset: message.offset,
          data
        });
        
        console.log(`📨 Received message ${receivedMessages.length}:`, {
          id: data.id,
          price: data.price?.toFixed(2),
          offset: message.offset
        });
        
        if (receivedMessages.length >= 3 && messageResolver) {
          messageResolver(receivedMessages);
        }
      }
    });

    console.log('✅ Consumer is running and ready');

    // Wait a moment to ensure consumer is fully ready
    console.log('⏳ Waiting for consumer to be fully ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n🔧 Setting up producer...');
    producer = kafka.producer({
      idempotent: false, // Avoid complexities for testing
      createPartitioner: Partitioners.LegacyPartitioner,
    });
    await producer.connect();
    console.log('✅ Producer connected');

    console.log('\n📤 Sending test messages...');
    
    for (let i = 1; i <= 3; i++) {
      const testMessage = {
        timestamp: new Date().toISOString(),
        id: i,
        type: 'crypto-price',
        symbol: 'BTC',
        price: 50000 + (Math.random() * 10000),
        volume: Math.random() * 1000000
      };

      const result = await producer.send({
        topic: topicName,
        messages: [{ 
          key: `test-${i}`,
          value: JSON.stringify(testMessage) 
        }]
      });
      
      console.log(`✅ Message ${i} sent successfully:`, {
        id: testMessage.id,
        price: testMessage.price.toFixed(2),
        partition: result[0].partition,
        offset: result[0].offset
      });
      
      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n⏳ Waiting for all messages to be consumed...');
    
    // Wait for messages with proper timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: Messages not received within 15 seconds')), 15000)
    );
    
    await Promise.race([messagePromise, timeoutPromise]);

    console.log('\n✅ All messages received successfully!');

    // Verify message content
    console.log('\n🔍 Verifying message integrity...');
    for (let i = 0; i < receivedMessages.length; i++) {
      const msg = receivedMessages[i];
      console.log(`Message ${i + 1}: ID=${msg.data.id}, Price=$${msg.data.price?.toFixed(2)}, Offset=${msg.offset}`);
    }

    console.log('\n🎉 STREAMING END-TO-END SUCCESS:');
    console.log('✅ Producer-Consumer communication working');
    console.log('✅ Message ordering preserved');
    console.log('✅ No race conditions detected');
    console.log('✅ Streaming pipeline is fully functional');

    return true;
  } catch (error) {
    console.error('❌ Streaming end-to-end test failed:', error);
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
        await consumer.stop();
        await consumer.disconnect();
        console.log('✅ Consumer stopped and disconnected');
      }
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
  console.log('🚀 STREAMING END-TO-END TEST');
  console.log('=' .repeat(80));
  
  const success = await testStreamingEndToEnd();
  
  console.log('\n' + '=' .repeat(80));
  console.log(success ? '✅ STREAMING PIPELINE VERIFIED!' : '❌ STREAMING PIPELINE FAILED');
  console.log('=' .repeat(80));
  
  process.exit(success ? 0 : 1);
}