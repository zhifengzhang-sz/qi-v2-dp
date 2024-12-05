/**
 * @fileoverview
 * @module producer.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-06
 * @modified 2024-12-06
 */

import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'test-client',
  brokers: ['redpanda:9092']
});

const producer = kafka.producer();

async function test() {
  console.log('Connecting...');
  await producer.connect();
  console.log('Connected');

  console.log('Sending message...');
  await producer.send({
    topic: 'test',
    messages: [{ value: 'hello' }]
  });
  console.log('Message sent');

  await producer.disconnect();
  console.log('Disconnected');
}

test().catch(console.error);