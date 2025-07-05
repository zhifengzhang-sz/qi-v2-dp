// app/tests/redpanda/redpanda-mcp.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RedpandaMCPLauncher, RedpandaClient } from '../../../lib/redpanda';

describe('Redpanda MCP Integration Tests', () => {
  let mcpLauncher: RedpandaMCPLauncher;
  let client: RedpandaClient;

  beforeAll(async () => {
    // Start MCP server
    mcpLauncher = new RedpandaMCPLauncher();
    await mcpLauncher.start();
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Create client
    client = new RedpandaClient({
      clientId: 'test-client',
      brokers: ['localhost:9092']
    });
    
    await client.connect();
  });

  afterAll(async () => {
    await client.disconnect();
    await mcpLauncher.stop();
  });

  describe('MCP Server Status', () => {
    it('should be running', () => {
      const status = mcpLauncher.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.pid).toBeDefined();
    });

    it('should provide available tools', () => {
      const tools = mcpLauncher.getAvailableTools();
      expect(tools).toContain('create_topic');
      expect(tools).toContain('list_topics');
      expect(tools).toContain('produce_message');
      expect(tools).toContain('consume_messages');
      expect(tools).toContain('cluster_info');
    });
  });

  describe('Topic Management', () => {
    it('should create a test topic', async () => {
      await client.createTopic({
        name: 'test-topic',
        partitions: 1,
        replicationFactor: 1
      });

      const topics = await client.listTopics();
      expect(topics).toContain('test-topic');
    });

    it('should get topic metadata', async () => {
      const metadata = await client.getTopicMetadata('test-topic');
      expect(metadata.name).toBe('test-topic');
      expect(metadata.partitions).toHaveLength(1);
      expect(metadata.partitions[0].partitionId).toBe(0);
    });
  });

  describe('Message Production', () => {
    it('should produce a message', async () => {
      const message = {
        topic: 'test-topic',
        key: 'test-key',
        value: { test: 'data', timestamp: Date.now() }
      };

      const result = await client.produceMessage(message);
      
      expect(result.topic).toBe('test-topic');
      expect(result.partition).toBe(0);
      expect(result.offset).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should produce multiple messages in batch', async () => {
      const messages = [
        { topic: 'test-topic', key: 'key1', value: { id: 1, data: 'test1' } },
        { topic: 'test-topic', key: 'key2', value: { id: 2, data: 'test2' } },
        { topic: 'test-topic', key: 'key3', value: { id: 3, data: 'test3' } }
      ];

      const results = await client.produceBatch(messages);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.topic).toBe('test-topic');
        expect(result.offset).toBeDefined();
      });
    });
  });

  describe('Message Consumption', () => {
    it('should consume messages', async () => {
      const consumedMessages: any[] = [];
      
      // Start consumer
      const consumePromise = client.consumeMessages(
        ['test-topic'],
        'test-group',
        async (message) => {
          consumedMessages.push(message);
          if (consumedMessages.length >= 3) {
            // Stop after consuming 3 messages
            return;
          }
        }
      );

      // Give consumer time to process
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      expect(consumedMessages.length).toBeGreaterThan(0);
      
      const firstMessage = consumedMessages[0];
      expect(firstMessage.topic).toBe('test-topic');
      expect(firstMessage.value).toBeDefined();
      expect(firstMessage.offset).toBeDefined();
      expect(firstMessage.timestamp).toBeDefined();
    });
  });

  describe('Cluster Information', () => {
    it('should get cluster info', async () => {
      const clusterInfo = await client.getClusterInfo();
      
      expect(clusterInfo.brokers).toHaveLength(1);
      expect(clusterInfo.brokers[0].host).toBeDefined();
      expect(clusterInfo.brokers[0].port).toBeDefined();
      expect(clusterInfo.clusterId).toBeDefined();
    });

    it('should get consumer groups', async () => {
      const groups = await client.getConsumerGroups();
      
      // Should have at least our test group
      const testGroup = groups.find(g => g.groupId === 'test-group');
      expect(testGroup).toBeDefined();
    });
  });

  describe('Connection Management', () => {
    it('should report connection status', () => {
      const isConnected = client.getConnectionStatus();
      expect(isConnected).toBe(true);
    });
  });
});

describe('Redpanda MCP Server Lifecycle', () => {
  it('should start and stop MCP server', async () => {
    const launcher = new RedpandaMCPLauncher();
    
    // Start
    await launcher.start();
    expect(launcher.getStatus().isRunning).toBe(true);
    
    // Stop
    await launcher.stop();
    expect(launcher.getStatus().isRunning).toBe(false);
  });
});

describe('Redpanda MCP Error Handling', () => {
  it('should handle connection errors gracefully', async () => {
    const client = new RedpandaClient({
      clientId: 'error-test-client',
      brokers: ['localhost:9999'] // Invalid port
    });

    await expect(client.connect()).rejects.toThrow();
  });

  it('should handle invalid topic creation', async () => {
    const client = new RedpandaClient({
      clientId: 'test-client',
      brokers: ['localhost:9092']
    });
    
    await client.connect();
    
    // Try to create topic with invalid configuration
    await expect(client.createTopic({
      name: '', // Invalid empty name
      partitions: 0, // Invalid partition count
      replicationFactor: 1
    })).rejects.toThrow();
    
    await client.disconnect();
  });
});