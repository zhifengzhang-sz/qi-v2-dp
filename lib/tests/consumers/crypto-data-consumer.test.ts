// lib/tests/consumers/crypto-data-consumer.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CryptoDataConsumer } from "../../src/consumers/crypto-data-consumer";
import type { ConsumerConfig, MessageHandler } from "../../src/consumers/types";
import type { CryptoOHLCV, CryptoPrice } from "../../src/publishers/types";
import type { ConsumerMessage } from "../../src/redpanda/types";

// Mock RedpandaClient
const mockRedpandaClient = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  consumeMessages: vi.fn(),
};

vi.mock("../../src/redpanda/redpanda-client", () => ({
  RedpandaClient: vi.fn(() => mockRedpandaClient),
}));

describe("CryptoDataConsumer", () => {
  let consumer: CryptoDataConsumer;
  let config: ConsumerConfig;

  beforeEach(() => {
    config = {
      groupId: "test-group",
      clientId: "test-consumer",
      brokers: ["localhost:9092"],
      topics: ["crypto-prices", "crypto-ohlcv"],
    };

    consumer = new CryptoDataConsumer(config);
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe("constructor", () => {
    it("should initialize with correct configuration", () => {
      expect(consumer).toBeInstanceOf(CryptoDataConsumer);

      const stats = consumer.getStats();
      expect(stats.messagesProcessed).toBe(0);
      expect(stats.messagesFailedPermanently).toBe(0);
      expect(stats.processingRate).toBe(0);
    });
  });

  describe("start", () => {
    it("should start consumer successfully", async () => {
      mockRedpandaClient.connect.mockResolvedValue(undefined);
      mockRedpandaClient.consumeMessages.mockResolvedValue(undefined);

      await consumer.start();

      expect(mockRedpandaClient.connect).toHaveBeenCalled();
      expect(mockRedpandaClient.consumeMessages).toHaveBeenCalledWith(
        config.topics,
        config.groupId,
        expect.any(Function),
      );

      const status = consumer.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it("should not start if already running", async () => {
      mockRedpandaClient.connect.mockResolvedValue(undefined);
      mockRedpandaClient.consumeMessages.mockResolvedValue(undefined);

      await consumer.start();
      await consumer.start(); // Second call

      expect(mockRedpandaClient.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe("stop", () => {
    it("should stop consumer successfully", async () => {
      mockRedpandaClient.connect.mockResolvedValue(undefined);
      mockRedpandaClient.consumeMessages.mockResolvedValue(undefined);
      mockRedpandaClient.disconnect.mockResolvedValue(undefined);

      await consumer.start();
      await consumer.stop();

      expect(mockRedpandaClient.disconnect).toHaveBeenCalled();

      const status = consumer.getStatus();
      expect(status.isRunning).toBe(false);
    });

    it("should not stop if not running", async () => {
      await consumer.stop();

      expect(mockRedpandaClient.disconnect).not.toHaveBeenCalled();
    });
  });

  describe("message handling", () => {
    let priceHandler: MessageHandler<CryptoPrice>;
    let ohlcvHandler: MessageHandler<CryptoOHLCV>;

    beforeEach(async () => {
      priceHandler = vi.fn();
      ohlcvHandler = vi.fn();

      consumer.onPriceData(priceHandler);
      consumer.onOHLCVData(ohlcvHandler);

      mockRedpandaClient.connect.mockResolvedValue(undefined);
      mockRedpandaClient.consumeMessages.mockImplementation((_topics, _groupId, handler) => {
        // Store the handler for manual triggering
        (consumer as any).messageHandler = handler;
        return Promise.resolve();
      });

      await consumer.start();
    });

    it("should route price messages to price handler", async () => {
      const priceMessage: ConsumerMessage = {
        topic: "crypto-prices",
        partition: 0,
        offset: "123",
        timestamp: Date.now(),
        value: {
          coin_id: "bitcoin",
          symbol: "BTC",
          timestamp: Date.now(),
          usd_price: 50000,
        },
      };

      await (consumer as any).messageHandler(priceMessage);

      expect(priceHandler).toHaveBeenCalledWith(
        priceMessage.value,
        expect.objectContaining({
          topic: "crypto-prices",
          partition: 0,
          offset: "123",
        }),
      );

      const stats = consumer.getStats();
      expect(stats.messagesProcessed).toBe(1);
    });

    it("should route OHLCV messages to OHLCV handler", async () => {
      const ohlcvMessage: ConsumerMessage = {
        topic: "crypto-ohlcv",
        partition: 0,
        offset: "124",
        timestamp: Date.now(),
        value: {
          coin_id: "bitcoin",
          symbol: "BTC",
          timestamp: Date.now(),
          open: 49000,
          high: 51000,
          low: 48000,
          close: 50000,
          volume: 1000000,
        },
      };

      await (consumer as any).messageHandler(ohlcvMessage);

      expect(ohlcvHandler).toHaveBeenCalledWith(
        ohlcvMessage.value,
        expect.objectContaining({
          topic: "crypto-ohlcv",
          partition: 0,
          offset: "124",
        }),
      );

      const stats = consumer.getStats();
      expect(stats.messagesProcessed).toBe(1);
    });

    it("should handle unknown topic gracefully", async () => {
      const unknownMessage: ConsumerMessage = {
        topic: "unknown-topic",
        partition: 0,
        offset: "125",
        timestamp: Date.now(),
        value: { data: "test" },
      };

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      await (consumer as any).messageHandler(unknownMessage);

      expect(consoleSpy).toHaveBeenCalledWith("⚠️ No handler for topic: unknown-topic");

      const stats = consumer.getStats();
      expect(stats.messagesProcessed).toBe(1);

      consoleSpy.mockRestore();
    });

    it("should handle message processing errors", async () => {
      priceHandler.mockRejectedValue(new Error("Handler failed"));

      const priceMessage: ConsumerMessage = {
        topic: "crypto-prices",
        partition: 0,
        offset: "123",
        timestamp: Date.now(),
        value: { coin_id: "bitcoin", symbol: "BTC", timestamp: Date.now(), usd_price: 50000 },
      };

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await (consumer as any).messageHandler(priceMessage);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("❌ Error processing message from crypto-prices:"),
        expect.any(Error),
      );

      const stats = consumer.getStats();
      expect(stats.messagesFailedPermanently).toBe(1);

      consoleSpy.mockRestore();
    });
  });

  describe("retry logic", () => {
    let priceHandler: MessageHandler<CryptoPrice>;

    beforeEach(async () => {
      const configWithRetry: ConsumerConfig = {
        ...config,
        retryConfig: {
          maxRetries: 3,
          initialRetryTime: 100,
          maxRetryTime: 1000,
        },
      };

      consumer = new CryptoDataConsumer(configWithRetry);
      priceHandler = vi.fn();
      consumer.onPriceData(priceHandler);

      mockRedpandaClient.connect.mockResolvedValue(undefined);
      mockRedpandaClient.consumeMessages.mockImplementation((_topics, _groupId, handler) => {
        (consumer as any).messageHandler = handler;
        return Promise.resolve();
      });

      await consumer.start();
    });

    it("should retry failed messages", async () => {
      let attemptCount = 0;
      priceHandler.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error("Handler failed");
        }
        return Promise.resolve();
      });

      const priceMessage: ConsumerMessage = {
        topic: "crypto-prices",
        partition: 0,
        offset: "123",
        timestamp: Date.now(),
        value: { coin_id: "bitcoin", symbol: "BTC", timestamp: Date.now(), usd_price: 50000 },
      };

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await (consumer as any).messageHandler(priceMessage);

      // Fast forward timers for retries
      vi.advanceTimersByTime(5000);

      expect(priceHandler).toHaveBeenCalledTimes(3); // 1 initial + 2 retries

      const stats = consumer.getStats();
      expect(stats.messagesRetried).toBe(1);

      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it("should exhaust retries and mark as permanently failed", async () => {
      priceHandler.mockRejectedValue(new Error("Handler always fails"));

      const priceMessage: ConsumerMessage = {
        topic: "crypto-prices",
        partition: 0,
        offset: "123",
        timestamp: Date.now(),
        value: { coin_id: "bitcoin", symbol: "BTC", timestamp: Date.now(), usd_price: 50000 },
      };

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await (consumer as any).messageHandler(priceMessage);

      // Fast forward timers for all retries
      vi.advanceTimersByTime(10000);

      const stats = consumer.getStats();
      expect(stats.messagesFailedPermanently).toBe(1);

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("processing rate monitoring", () => {
    beforeEach(async () => {
      mockRedpandaClient.connect.mockResolvedValue(undefined);
      mockRedpandaClient.consumeMessages.mockResolvedValue(undefined);

      await consumer.start();
    });

    it("should calculate processing rate correctly", () => {
      // Simulate processing rate window
      const stats = consumer.getStats();
      expect(stats.processingRate).toBe(0);

      // Advance timer to trigger rate calculation
      vi.advanceTimersByTime(1000);

      // Rate should still be 0 as no messages processed
      const updatedStats = consumer.getStats();
      expect(updatedStats.processingRate).toBe(0);
    });
  });

  describe("health checks", () => {
    beforeEach(async () => {
      mockRedpandaClient.connect.mockResolvedValue(undefined);
      mockRedpandaClient.consumeMessages.mockResolvedValue(undefined);

      await consumer.start();
    });

    it("should report healthy when running and recently active", () => {
      // Simulate recent message processing
      (consumer as any).stats.lastProcessedTimestamp = Date.now();

      expect(consumer.isHealthy()).toBe(true);
      expect(consumer.getLastError()).toBeNull();
    });

    it("should report unhealthy when not recently active", () => {
      // Simulate old last processed timestamp (more than 5 minutes ago)
      (consumer as any).stats.lastProcessedTimestamp = Date.now() - 6 * 60 * 1000;

      expect(consumer.isHealthy()).toBe(false);
    });

    it("should report unhealthy when there are recent errors", () => {
      (consumer as any).lastError = new Error("Recent error");

      expect(consumer.isHealthy()).toBe(false);
      expect(consumer.getLastError()).toBeInstanceOf(Error);
    });

    it("should report unhealthy when not running", async () => {
      await consumer.stop();

      expect(consumer.isHealthy()).toBe(false);
    });
  });

  describe("getStatus", () => {
    it("should return comprehensive status", () => {
      const status = consumer.getStatus();

      expect(status).toEqual({
        isRunning: false,
        groupId: "test-group",
        topics: ["crypto-prices", "crypto-ohlcv"],
        stats: expect.objectContaining({
          messagesProcessed: 0,
          messagesFailedPermanently: 0,
          messagesRetried: 0,
          processingRate: 0,
        }),
        isHealthy: false,
      });
    });
  });
});
