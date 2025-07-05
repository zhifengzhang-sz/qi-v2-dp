// lib/src/services/docker-service-agent.ts
// Docker Service Management Agent following Agent/MCP paradigm
// Uses official Docker MCP server for container operations

import { BaseAgent, type AgentConfig, type AgentTask, type TaskResult } from '@qicore/agent-lib/qiagent';
import { MCPClient } from '@qicore/agent-lib/qimcp/client';
import { DockerServiceDSL } from './docker-service-dsl';
import { DockerMCPWrapper } from './docker-mcp-wrapper';

// =============================================================================
// SERVICE TASK TYPES
// =============================================================================

export interface StartServicesTask extends AgentTask {
  type: 'start_services';
  params: {
    services?: string[];        // Specific services, or all if empty
    profile?: string;           // Docker Compose profile
    detached?: boolean;         // Run in background
    recreate?: boolean;         // Force recreate containers
  };
}

export interface StopServicesTask extends AgentTask {
  type: 'stop_services';
  params: {
    services?: string[];        // Specific services, or all if empty
    removeVolumes?: boolean;    // Remove named volumes
    removeImages?: boolean;     // Remove images
  };
}

export interface ServiceHealthTask extends AgentTask {
  type: 'check_service_health';
  params: {
    services?: string[];        // Check specific services
    timeout?: number;           // Health check timeout
  };
}

export interface ServiceLogsTask extends AgentTask {
  type: 'get_service_logs';
  params: {
    service: string;            // Service name
    lines?: number;             // Number of lines
    follow?: boolean;           // Follow log output
    since?: string;             // Show logs since timestamp
  };
}

export interface ServiceStatsTask extends AgentTask {
  type: 'get_service_stats';
  params: {
    services?: string[];        // Service names
    stream?: boolean;           // Stream stats
  };
}

export type DockerServiceTask = 
  | StartServicesTask 
  | StopServicesTask 
  | ServiceHealthTask 
  | ServiceLogsTask
  | ServiceStatsTask;

// =============================================================================
// SERVICE RESULTS
// =============================================================================

export interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'starting' | 'unhealthy' | 'unknown';
  health: 'healthy' | 'unhealthy' | 'starting' | 'unknown';
  uptime: string;
  ports: string[];
  image: string;
  containerId: string;
}

export interface ServiceHealthResult {
  services: ServiceStatus[];
  overallHealth: 'healthy' | 'degraded' | 'unhealthy';
  healthyCount: number;
  totalCount: number;
  timestamp: Date;
}

export interface ServiceLogResult {
  service: string;
  logs: string[];
  timestamp: Date;
  truncated: boolean;
}

export interface ServiceStatsResult {
  service: string;
  cpu: {
    percentage: number;
    usage: string;
  };
  memory: {
    usage: string;
    limit: string;
    percentage: number;
  };
  network: {
    rx: string;
    tx: string;
  };
  io: {
    read: string;
    write: string;
  };
  timestamp: Date;
}

// =============================================================================
// DOCKER SERVICE AGENT
// =============================================================================

/**
 * Docker Service Management Agent
 * 
 * Uses Agent/MCP paradigm:
 * - Agent: Workflow orchestration and service management
 * - DSL: Docker service domain operations  
 * - MCP Wrapper: Official Docker MCP server communication
 * 
 * No LLM needed - pure infrastructure operations
 */
export class DockerServiceAgent extends BaseAgent {
  private dsl: DockerServiceDSL;
  private mcpWrapper: DockerMCPWrapper;
  
  constructor(
    config: AgentConfig,
    mcpClient: MCPClient,
    private servicesPath: string = '/home/zzhang/dev/qi/github/mcp-server/dp/services',
    logger?: any
  ) {
    super(config, logger);
    
    this.mcpWrapper = new DockerMCPWrapper(mcpClient);
    this.dsl = new DockerServiceDSL(this.mcpWrapper, servicesPath);
  }

  // =============================================================================
  // TASK EXECUTION (No LLM needed)
  // =============================================================================

  /**
   * Execute service management tasks
   */
  async executeTask(task: DockerServiceTask): Promise<TaskResult> {
    this.logger?.info(`Executing Docker service task: ${task.type}`, { taskId: task.id });

    try {
      let result: any;

      switch (task.type) {
        case 'start_services':
          result = await this.executeStartServices(task);
          break;

        case 'stop_services':
          result = await this.executeStopServices(task);
          break;

        case 'check_service_health':
          result = await this.executeHealthCheck(task);
          break;

        case 'get_service_logs':
          result = await this.executeGetLogs(task);
          break;

        case 'get_service_stats':
          result = await this.executeGetStats(task);
          break;

        default:
          throw new Error(`Unknown task type: ${(task as any).type}`);
      }

      return {
        taskId: task.id,
        success: true,
        data: result,
        timestamp: new Date(),
        duration: Date.now() - task.createdAt.getTime(),
      };

    } catch (error) {
      this.logger?.error(`Docker service task failed: ${task.type}`, { 
        taskId: task.id, 
        error: error instanceof Error ? error.message : String(error) 
      });

      return {
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        duration: Date.now() - task.createdAt.getTime(),
      };
    }
  }

  // =============================================================================
  // SERVICE OPERATIONS (Using DSL)
  // =============================================================================

  /**
   * Start Docker services
   */
  private async executeStartServices(task: StartServicesTask): Promise<any> {
    this.logger?.info('Starting Docker services', { 
      services: task.params.services || 'all',
      profile: task.params.profile 
    });

    // Agent delegates to DSL for service operations
    const result = await this.dsl.startServices({
      services: task.params.services,
      profile: task.params.profile,
      detached: task.params.detached !== false, // Default true
      recreate: task.params.recreate || false,
    });

    return {
      action: 'start_services',
      services: task.params.services || 'all',
      result,
      timestamp: new Date(),
    };
  }

  /**
   * Stop Docker services
   */
  private async executeStopServices(task: StopServicesTask): Promise<any> {
    this.logger?.info('Stopping Docker services', { 
      services: task.params.services || 'all',
      removeVolumes: task.params.removeVolumes,
      removeImages: task.params.removeImages 
    });

    // Agent delegates to DSL for service operations
    const result = await this.dsl.stopServices({
      services: task.params.services,
      removeVolumes: task.params.removeVolumes || false,
      removeImages: task.params.removeImages || false,
    });

    return {
      action: 'stop_services',
      services: task.params.services || 'all',
      result,
      timestamp: new Date(),
    };
  }

  /**
   * Check service health
   */
  private async executeHealthCheck(task: ServiceHealthTask): Promise<ServiceHealthResult> {
    this.logger?.info('Checking service health', { 
      services: task.params.services || 'all' 
    });

    // Agent delegates to DSL for health check operations
    return await this.dsl.checkServiceHealth({
      services: task.params.services,
      timeout: task.params.timeout || 30000,
    });
  }

  /**
   * Get service logs
   */
  private async executeGetLogs(task: ServiceLogsTask): Promise<ServiceLogResult> {
    this.logger?.info('Getting service logs', { 
      service: task.params.service,
      lines: task.params.lines 
    });

    // Agent delegates to DSL for log operations
    return await this.dsl.getServiceLogs({
      service: task.params.service,
      lines: task.params.lines || 100,
      follow: task.params.follow || false,
      since: task.params.since,
    });
  }

  /**
   * Get service statistics
   */
  private async executeGetStats(task: ServiceStatsTask): Promise<ServiceStatsResult[]> {
    this.logger?.info('Getting service stats', { 
      services: task.params.services || 'all' 
    });

    // Agent delegates to DSL for stats operations
    return await this.dsl.getServiceStats({
      services: task.params.services,
      stream: task.params.stream || false,
    });
  }

  // =============================================================================
  // CONVENIENCE METHODS
  // =============================================================================

  /**
   * Start all crypto platform services
   */
  async startCryptoPlatform(): Promise<ServiceHealthResult> {
    const services = ['redpanda', 'timescaledb', 'clickhouse', 'redis'];
    
    // Start services
    await this.executeTask({
      id: `start-crypto-platform-${Date.now()}`,
      type: 'start_services',
      params: { services, detached: true },
      priority: 'high',
      createdAt: new Date(),
      createdBy: this.config.id,
    });

    // Wait for services to be healthy
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Check health
    const healthResult = await this.executeTask({
      id: `health-crypto-platform-${Date.now()}`,
      type: 'check_service_health',
      params: { services, timeout: 60000 },
      priority: 'high',
      createdAt: new Date(),
      createdBy: this.config.id,
    });

    return healthResult.data as ServiceHealthResult;
  }

  /**
   * Stop all crypto platform services
   */
  async stopCryptoPlatform(): Promise<any> {
    const services = ['console', 'redis', 'clickhouse', 'timescaledb', 'redpanda'];
    
    return await this.executeTask({
      id: `stop-crypto-platform-${Date.now()}`,
      type: 'stop_services',
      params: { services },
      priority: 'high',
      createdAt: new Date(),
      createdBy: this.config.id,
    });
  }

  /**
   * Get crypto platform status
   */
  async getCryptoPlatformStatus(): Promise<ServiceHealthResult> {
    const services = ['redpanda', 'timescaledb', 'clickhouse', 'redis', 'console'];
    
    const result = await this.executeTask({
      id: `status-crypto-platform-${Date.now()}`,
      type: 'check_service_health',
      params: { services },
      priority: 'medium',
      createdAt: new Date(),
      createdBy: this.config.id,
    });

    return result.data as ServiceHealthResult;
  }

  // =============================================================================
  // AGENT LIFECYCLE
  // =============================================================================

  async initialize(): Promise<void> {
    await super.initialize();
    
    // Initialize DSL and MCP wrapper
    await this.dsl.initialize();
    this.logger?.info('DockerServiceAgent initialized successfully');
  }

  async shutdown(): Promise<void> {
    await this.dsl.close();
    await super.shutdown();
    this.logger?.info('DockerServiceAgent shutdown completed');
  }
}