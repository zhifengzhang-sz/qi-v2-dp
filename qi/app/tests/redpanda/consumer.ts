/**
 * @fileoverview
 * @module consumer.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-06
 * @modified 2024-12-06
 */

import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'test-consumer',
  brokers: ['redpanda:9092']
});

const consumer = kafka.consumer({ groupId: 'test-group' });

async function test() {
  console.log('Connecting...');
  await consumer.connect();
  console.log('Connected');

  await consumer.subscribe({ topic: 'test', fromBeginning: true });
  
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        topic,
        partition,
        value: message.value?.toString()
      });
    },
  });
}

test().catch(console.error);