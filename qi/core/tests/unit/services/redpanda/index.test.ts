/**
 * @fileoverview Unit tests for RedPanda service
 * @module @qi/core/test/unit/services/redpanda
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Kafka } from "kafkajs";
import { RedPandaService } from "@qi/core/services/redpanda";
import { ApplicationError } from "@qi/core/errors";

// Mock external dependencies first
vi.mock("@qi/core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock KafkaJS
const mockProducer = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  send: vi.fn(),
};

const mockConsumer = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  subscribe: vi.fn(),
};

const mockAdmin = {
  listTopics: vi.fn(),
  disconnect: vi.fn(),
};

const mockKafkaInstance = {
  producer: () => mockProducer,
  consumer: () => mockConsumer,
  admin: () => mockAdmin,
};

vi.mock("kafkajs", () => ({
  Kafka: vi.fn(() => mockKafkaInstance),
}));

describe("RedPandaService", () => {
  const mockConnection = {
    getBrokerEndpoint: vi.fn(() => "localhost:9092"),
    getSchemaRegistryEndpoint: vi.fn(() => "http://localhost:8081"),
    getSSLConfig: vi.fn(() => ({})),
    getSASLConfig: vi.fn(() => undefined),
    getConnectionTimeout: vi.fn(() => 5000),
    getRequestTimeout: vi.fn(() => 30000),
    getBrokerId: vi.fn(() => 1),
    getBrokers: vi.fn(() => ["localhost:9092"]),
    getAdminEndpoint: vi.fn(() => "http://localhost:9644"),
    getProxyEndpoint: vi.fn(() => "http://localhost:8082"),
  };

  const defaultConfig = {
    enabled: true,
    connection: mockConnection,
    clientId: "test-client",
    consumer: {
      groupId: "test-group",
    },
  };

  let service: RedPandaService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RedPandaService(defaultConfig);
  });

  describe("initialization", () => {
    it("creates service with correct config", () => {
      expect(service).toBeDefined();
      expect(service.isEnabled()).toBe(true);
    });

    it("handles disabled service", async () => {
      service = new RedPandaService({ ...defaultConfig, enabled: false });
      await service.connect();
      expect(service.isEnabled()).toBe(false);
      expect(Kafka).not.toHaveBeenCalled();
    });
  });

  describe("connection lifecycle", () => {
    it("establishes connection successfully", async () => {
      mockProducer.connect.mockResolvedValueOnce(undefined);
      mockConsumer.connect.mockResolvedValueOnce(undefined);

      await service.connect();

      expect(Kafka).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: defaultConfig.clientId,
          brokers: [defaultConfig.connection.getBrokerEndpoint()],
        })
      );

      expect(mockProducer.connect).toHaveBeenCalled();
      expect(mockConsumer.connect).toHaveBeenCalled();
    });

    it("handles producer connection failure", async () => {
      mockProducer.connect.mockRejectedValueOnce(
        new Error("Connection failed")
      );
      await expect(service.connect()).rejects.toThrow(ApplicationError);
    });

    it("disconnects properly", async () => {
      mockProducer.connect.mockResolvedValueOnce(undefined);
      mockConsumer.connect.mockResolvedValueOnce(undefined);
      mockProducer.disconnect.mockResolvedValueOnce(undefined);
      mockConsumer.disconnect.mockResolvedValueOnce(undefined);

      await service.connect();
      await service.disconnect();

      expect(mockProducer.disconnect).toHaveBeenCalled();
      expect(mockConsumer.disconnect).toHaveBeenCalled();
    });
  });

  describe("health checks", () => {
    it("returns unhealthy when not connected", async () => {
      const health = await service["checkHealth"]();
      expect(health.status).toBe("unhealthy");
    });

    it("returns healthy when connected and responsive", async () => {
      mockProducer.connect.mockResolvedValueOnce(undefined);
      mockConsumer.connect.mockResolvedValueOnce(undefined);
      mockAdmin.listTopics.mockResolvedValueOnce(["test-topic"]);

      await service.connect();
      const health = await service["checkHealth"]();

      expect(health.status).toBe("healthy");
      expect(health.details).toEqual(
        expect.objectContaining({
          brokerEndpoint: "localhost:9092",
          clientId: "test-client",
        })
      );
    });
  });

  describe("message operations", () => {
    const testTopic = "test-topic";
    const testMessages = [{ value: "test-message" }];

    beforeEach(async () => {
      mockProducer.connect.mockResolvedValueOnce(undefined);
      mockConsumer.connect.mockResolvedValueOnce(undefined);
      await service.connect();
    });

    it("sends messages successfully", async () => {
      mockProducer.send.mockResolvedValueOnce(undefined);
      await service.send(testTopic, testMessages);

      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: testTopic,
        messages: expect.arrayContaining([
          expect.objectContaining({ value: "test-message" }),
        ]),
      });
    });

    it("subscribes to topics successfully", async () => {
      mockConsumer.subscribe.mockResolvedValueOnce(undefined);
      await service.subscribe([testTopic]);

      expect(mockConsumer.subscribe).toHaveBeenCalledWith({
        topic: testTopic,
        fromBeginning: false,
      });
    });

    it("handles send failure", async () => {
      mockProducer.send.mockRejectedValueOnce(new Error("Send failed"));
      await expect(service.send(testTopic, testMessages)).rejects.toThrow(
        ApplicationError
      );
    });
  });
});
