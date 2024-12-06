/**
 * @fileoverview
 * @module config.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-06
 * @modified 2024-12-06
 */

// services/redpanda/config.ts
import { KafkaConfig, ProducerConfig, ConsumerConfig } from "kafkajs";

export interface RedPandaConfig {
  type: "redpanda";
  version: string;
  kafka: {
    brokers: string[];
    clientId: string;
    connectionTimeout?: number;
  };
  producer?: Partial<ProducerConfig>;
  consumer?: Partial<ConsumerConfig>;
}

export function toKafkaConfig(config: RedPandaConfig): KafkaConfig {
  return {
    brokers: config.kafka.brokers,
    clientId: config.kafka.clientId,
    connectionTimeout: config.kafka.connectionTimeout,
    ssl: false,
  };
}
