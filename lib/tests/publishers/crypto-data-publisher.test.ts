// lib/tests/publishers/crypto-data-publisher.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CryptoDataPublisher } from "../../src/publishers/crypto-data-publisher";
import type { CryptoOHLCV, CryptoPrice, PublisherConfig } from "../../src/publishers/types";

// Mock RedpandaClient
const mockRedpandaClient = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  createTopic: vi.fn(),
  produceMessage: vi.fn(),
  produceBatch: vi.fn(),
  getTopicMetadata: vi.fn(),
  listTopics: vi.fn(),
};

vi.mock("../../src/redpanda/redpanda-client", () => ({
  RedpandaClient: vi.fn(() => mockRedpandaClient),
}));

describe("CryptoDataPublisher", () => {
  let publisher: CryptoDataPublisher;
  let config: PublisherConfig;

  beforeEach(() => {
    config = {
      clientId: "test-publisher",
      brokers: ["localhost:9092"],
    };

    publisher = new CryptoDataPublisher(config);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("constructor", () => {
    it("should initialize with correct configuration", () => {
      expect(publisher).toBeInstanceOf(CryptoDataPublisher);
    });
  });

  describe("start", () => {
    it("should start publisher successfully", async () => {
      mockRedpandaClient.connect.mockResolvedValue(undefined);
      mockRedpandaClient.createTopic.mockResolvedValue(undefined);

      await publisher.start();

      expect(mockRedpandaClient.connect).toHaveBeenCalled();
      expect(mockRedpandaClient.createTopic).toHaveBeenCalledTimes(4);
      expect(mockRedpandaClient.createTopic).toHaveBeenCalledWith({
        name: "crypto-prices",
        partitions: 3,
        replicationFactor: 1,
      });

      const status = publisher.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it("should not start if already running", async () => {
      mockRedpandaClient.connect.mockResolvedValue(undefined);
      mockRedpandaClient.createTopic.mockResolvedValue(undefined);

      await publisher.start();
      await publisher.start(); // Second call

      expect(mockRedpandaClient.connect).toHaveBeenCalledTimes(1);
    });

    it("should start batch processor if configured", async () => {
      const configWithBatch: PublisherConfig = {
        ...config,
        batchConfig: {
          maxBatchSize: 100,
          maxBatchDelay: 5000,
        },
      };

      const batchPublisher = new CryptoDataPublisher(configWithBatch);

      mockRedpandaClient.connect.mockResolvedValue(undefined);
      mockRedpandaClient.createTopic.mockResolvedValue(undefined);

      await batchPublisher.start();

      expect(batchPublisher.getStatus().isRunning).toBe(true);
    });
  });

  describe("stop", () => {
    it("should stop publisher successfully", async () => {
      mockRedpandaClient.connect.mockResolvedValue(undefined);
      mockRedpandaClient.createTopic.mockResolvedValue(undefined);
      mockRedpandaClient.disconnect.mockResolvedValue(undefined);

      await publisher.start();
      await publisher.stop();

      expect(mockRedpandaClient.disconnect).toHaveBeenCalled();

      const status = publisher.getStatus();
      expect(status.isRunning).toBe(false);
    });

    it("should not stop if not running", async () => {
      await publisher.stop();

      expect(mockRedpandaClient.disconnect).not.toHaveBeenCalled();
    });
  });

  describe("publishPrice", () => {
    beforeEach(async () => {
      mockRedpandaClient.connect.mockResolvedValue(undefined);
      mockRedpandaClient.createTopic.mockResolvedValue(undefined);
      await publisher.start();
    });

    it("should publish single price successfully", async () => {
      const price: CryptoPrice = {
        coin_id: "bitcoin",
        symbol: "BTC",
        timestamp: Date.now(),
        usd_price: 50000,
        btc_price: 1,
        market_cap: 1000000000000,
        volume_24h: 50000000000,
        change_24h: 2.5,
      };

      mockRedpandaClient.produceMessage.mockResolvedValue({
        topic: "crypto-prices",
        partition: 0,
        offset: "123",
        timestamp: Date.now(),
      });

      const result = await publisher.publishPrice(price);

      expect(mockRedpandaClient.produceMessage).toHaveBeenCalledWith({
        topic: "crypto-prices",
        key: "bitcoin",
        value: price,
        timestamp: price.timestamp,
      });

      expect(result.success).toBe(true);
      expect(result.topic).toBe("crypto-prices");
    });

    it("should handle publish error gracefully", async () => {
      const price: CryptoPrice = {
        coin_id: "bitcoin",
        symbol: "BTC",
        timestamp: Date.now(),
        usd_price: 50000,
      };

      mockRedpandaClient.produceMessage.mockRejectedValue(new Error("Publish failed"));

      const result = await publisher.publishPrice(price);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Publish failed");
    });
  });

  describe("publishPrices", () => {
    beforeEach(async () => {
      mockRedpandaClient.connect.mockResolvedValue(undefined);
      mockRedpandaClient.createTopic.mockResolvedValue(undefined);
      await publisher.start();
    });

    it("should publish multiple prices successfully", async () => {
      const prices: CryptoPrice[] = [
        {
          coin_id: "bitcoin",
          symbol: "BTC",
          timestamp: Date.now(),
          usd_price: 50000,
        },
        {
          coin_id: "ethereum",
          symbol: "ETH",
          timestamp: Date.now(),
          usd_price: 3000,
        },
      ];

      mockRedpandaClient.produceBatch.mockResolvedValue([
        { topic: "crypto-prices", partition: 0, offset: "123", timestamp: Date.now() },
        { topic: "crypto-prices", partition: 1, offset: "124", timestamp: Date.now() },
      ]);

      const results = await publisher.publishPrices(prices);

      expect(mockRedpandaClient.produceBatch).toHaveBeenCalled();
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });
  });

  describe("publishOHLCV", () => {
    beforeEach(async () => {
      mockRedpandaClient.connect.mockResolvedValue(undefined);
      mockRedpandaClient.createTopic.mockResolvedValue(undefined);
      await publisher.start();
    });

    it("should publish OHLCV data successfully", async () => {
      const ohlcv: CryptoOHLCV = {
        coin_id: "bitcoin",
        symbol: "BTC",
        timestamp: Date.now(),
        open: 49000,
        high: 51000,
        low: 48000,
        close: 50000,
        volume: 1000000,
      };

      mockRedpandaClient.produceMessage.mockResolvedValue({
        topic: "crypto-ohlcv",
        partition: 0,
        offset: "123",
        timestamp: Date.now(),
      });

      const result = await publisher.publishOHLCV(ohlcv);

      expect(mockRedpandaClient.produceMessage).toHaveBeenCalledWith({
        topic: "crypto-ohlcv",
        key: "bitcoin",
        value: ohlcv,
        timestamp: ohlcv.timestamp,
      });

      expect(result.success).toBe(true);
      expect(result.topic).toBe("crypto-ohlcv");
    });
  });

  describe("batch processing", () => {
    it("should queue messages when batch config is enabled", async () => {
      const configWithBatch: PublisherConfig = {
        ...config,
        batchConfig: {
          maxBatchSize: 2,
          maxBatchDelay: 5000,
        },
      };

      const batchPublisher = new CryptoDataPublisher(configWithBatch);

      mockRedpandaClient.connect.mockResolvedValue(undefined);
      mockRedpandaClient.createTopic.mockResolvedValue(undefined);
      mockRedpandaClient.produceBatch.mockResolvedValue([]);

      await batchPublisher.start();

      const price: CryptoPrice = {
        coin_id: "bitcoin",
        symbol: "BTC",
        timestamp: Date.now(),
        usd_price: 50000,
      };

      const result = await batchPublisher.publishPrice(price);

      expect(result.success).toBe(true);
      expect(result.offset).toBe("queued");
      expect(batchPublisher.getStatus().queueSize).toBe(1);
    });

    it("should flush batch when max size reached", async () => {
      const configWithBatch: PublisherConfig = {
        ...config,
        batchConfig: {
          maxBatchSize: 2,
          maxBatchDelay: 5000,
        },
      };

      const batchPublisher = new CryptoDataPublisher(configWithBatch);

      mockRedpandaClient.connect.mockResolvedValue(undefined);
      mockRedpandaClient.createTopic.mockResolvedValue(undefined);
      mockRedpandaClient.produceBatch.mockResolvedValue([]);

      await batchPublisher.start();

      const price1: CryptoPrice = {
        coin_id: "bitcoin",
        symbol: "BTC",
        timestamp: Date.now(),
        usd_price: 50000,
      };

      const price2: CryptoPrice = {
        coin_id: "ethereum",
        symbol: "ETH",
        timestamp: Date.now(),
        usd_price: 3000,
      };

      await batchPublisher.publishPrice(price1);
      await batchPublisher.publishPrice(price2); // This should trigger flush

      expect(mockRedpandaClient.produceBatch).toHaveBeenCalled();
      expect(batchPublisher.getStatus().queueSize).toBe(0);
    });
  });

  describe("utility methods", () => {
    beforeEach(async () => {
      mockRedpandaClient.connect.mockResolvedValue(undefined);
      mockRedpandaClient.createTopic.mockResolvedValue(undefined);
      await publisher.start();
    });

    it("should get topic metadata", async () => {
      const metadata = {
        name: "crypto-prices",
        partitions: [{ partitionId: 0, leader: 1, replicas: [1], isr: [1] }],
        configs: {},
      };

      mockRedpandaClient.getTopicMetadata.mockResolvedValue(metadata);

      const result = await publisher.getTopicMetadata("crypto-prices");

      expect(mockRedpandaClient.getTopicMetadata).toHaveBeenCalledWith("crypto-prices");
      expect(result).toEqual(metadata);
    });

    it("should list topics", async () => {
      const topics = ["crypto-prices", "crypto-ohlcv", "crypto-analytics"];

      mockRedpandaClient.listTopics.mockResolvedValue(topics);

      const result = await publisher.listTopics();

      expect(mockRedpandaClient.listTopics).toHaveBeenCalled();
      expect(result).toEqual(topics);
    });

    it("should get status", () => {
      const status = publisher.getStatus();

      expect(status).toHaveProperty("isRunning");
      expect(status).toHaveProperty("queueSize");
      expect(typeof status.isRunning).toBe("boolean");
      expect(typeof status.queueSize).toBe("number");
    });
  });
});
