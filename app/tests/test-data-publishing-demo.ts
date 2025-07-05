#!/usr/bin/env bun

/**
 * TEST: Data Publishing Demo
 * 
 * Simple demonstration that data publishing works with our streaming infrastructure
 */

import { Kafka } from 'kafkajs';

async function testDataPublishingDemo() {
  console.log('🚀 TESTING: Data Publishing Demo\n');

  // Create Kafka client with simple configuration that should work
  const kafka = new Kafka({
    clientId: 'data-publishing-demo',
    brokers: ['localhost:19092'],
    retry: { initialRetryTime: 100, retries: 2 },
  });

  let admin;
  let producer;

  try {
    console.log('🔧 Connecting to Kafka admin...');
    admin = kafka.admin();
    await admin.connect();
    console.log('✅ Admin connected!');

    console.log('📝 Creating demo topic...');
    try {
      await admin.createTopics({
        topics: [{
          topic: 'data-publishing-demo',
          numPartitions: 1,
          replicationFactor: 1,
        }]
      });
      console.log('✅ Topic created successfully');
    } catch (error) {
      console.log('ℹ️ Topic might already exist');
    }

    console.log('🔧 Connecting producer...');
    producer = kafka.producer({
      idempotent: false, // Simplify for demo
    });
    await producer.connect();
    console.log('✅ Producer connected!');

    console.log('\n📤 Publishing demo data...');
    
    // Publish 5 demo messages
    for (let i = 1; i <= 5; i++) {
      const message = {
        topic: 'data-publishing-demo',
        messages: [{
          key: `demo-key-${i}`,
          value: JSON.stringify({
            id: i,
            timestamp: new Date().toISOString(),
            message: `Demo data message ${i}`,
            price: 50000 + (Math.random() * 10000),
            volume: Math.random() * 1000000
          })
        }]
      };

      const result = await producer.send(message);
      console.log(`✅ Message ${i} published:`, {
        partition: result[0].partition,
        offset: result[0].offset
      });
    }

    console.log('\n🎉 DATA PUBLISHING SUCCESS:');
    console.log('✅ Connected to Redpanda via localhost:19092');
    console.log('✅ Created topic successfully');
    console.log('✅ Published 5 demo messages');
    console.log('✅ Streaming infrastructure is working!');

    return true;
  } catch (error) {
    console.error('❌ Data publishing demo failed:', error);
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
  console.log('🚀 DATA PUBLISHING DEMO');
  console.log('=' .repeat(80));
  
  const success = await testDataPublishingDemo();
  
  console.log('\n' + '=' .repeat(80));
  console.log(success ? '✅ DATA PUBLISHING WORKING!' : '❌ DATA PUBLISHING FAILED');
  console.log('=' .repeat(80));
  
  process.exit(success ? 0 : 1);
}