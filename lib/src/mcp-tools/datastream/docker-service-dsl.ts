// lib/src/services/docker-service-dsl.ts
// Docker Service Domain Specific Language
// High-level Docker operations using MCP wrapper

import { DockerMCPWrapper } from './docker-mcp-wrapper';
import type { ServiceStatus, ServiceHealthResult, ServiceLogResult, ServiceStatsResult } from './docker-service-agent';

// =============================================================================
// DSL PARAMETER TYPES
// =============================================================================

export interface StartServicesParams {
  services?: string[];
  profile?: string;
  detached?: boolean;
  recreate?: boolean;
}

export interface StopServicesParams {
  services?: string[];
  removeVolumes?: boolean;
  removeImages?: boolean;
}

export interface HealthCheckParams {
  services?: string[];
  timeout?: number;
}

export interface LogParams {
  service: string;
  lines?: number;
  follow?: boolean;
  since?: string;
}

export interface StatsParams {
  services?: string[];
  stream?: boolean;
}

// =============================================================================
// DOCKER SERVICE DSL
// =============================================================================

/**
 * Docker Service Domain Specific Language
 * 
 * Provides high-level, domain-specific operations for Docker service management.
 * Uses MCP wrapper to communicate with Official Docker MCP server.
 */
export class DockerServiceDSL {
  constructor(
    private mcpWrapper: DockerMCPWrapper,
    private servicesPath: string
  ) {}

  // =============================================================================
  // SERVICE LIFECYCLE OPERATIONS
  // =============================================================================

  /**
   * Start Docker services using docker-compose
   */
  async startServices(params: StartServicesParams): Promise<any> {
    const {
      services = [],
      profile,
      detached = true,
      recreate = false
    } = params;

    // Build docker-compose command
    const args = ['up'];
    
    if (detached) args.push('-d');
    if (recreate) args.push('--force-recreate');
    if (profile) args.push('--profile', profile);
    
    // Add specific services or start all
    if (services.length > 0) {
      args.push(...services);
    }

    // Execute via MCP wrapper
    const result = await this.mcpWrapper.executeDockerCompose({
      command: 'up',
      args,
      workDir: `${this.servicesPath}/docker`
    });

    return {
      command: `docker-compose ${args.join(' ')}`,
      exitCode: result.exitCode,
      output: result.stdout,
      error: result.stderr,
      services: services.length > 0 ? services : 'all'
    };
  }

  /**
   * Stop Docker services using docker-compose
   */
  async stopServices(params: StopServicesParams): Promise<any> {
    const {
      services = [],
      removeVolumes = false,
      removeImages = false
    } = params;

    // Build docker-compose command
    const args = ['down'];
    
    if (removeVolumes) args.push('-v');
    if (removeImages) args.push('--rmi', 'all');
    
    // Add specific services (docker-compose down doesn't support individual services)
    // For individual services, use stop + rm
    if (services.length > 0) {
      // First stop specific services
      const stopResult = await this.mcpWrapper.executeDockerCompose({
        command: 'stop',
        args: services,
        workDir: `${this.servicesPath}/docker`
      });

      // Then remove containers
      const rmResult = await this.mcpWrapper.executeDockerCompose({
        command: 'rm',
        args: ['-f', ...services],
        workDir: `${this.servicesPath}/docker`
      });

      return {
        command: `docker-compose stop + rm ${services.join(' ')}`,
        exitCode: rmResult.exitCode,
        output: `${stopResult.stdout}\n${rmResult.stdout}`,
        error: `${stopResult.stderr}\n${rmResult.stderr}`,
        services
      };
    }

    // Stop all services
    const result = await this.mcpWrapper.executeDockerCompose({
      command: 'down',
      args: args.slice(1), // Remove 'down' from args
      workDir: `${this.servicesPath}/docker`
    });

    return {
      command: `docker-compose ${args.join(' ')}`,
      exitCode: result.exitCode,
      output: result.stdout,
      error: result.stderr,
      services: 'all'
    };
  }

  // =============================================================================
  // SERVICE MONITORING OPERATIONS
  // =============================================================================

  /**
   * Check health status of services
   */
  async checkServiceHealth(params: HealthCheckParams): Promise<ServiceHealthResult> {
    const { services = [], timeout = 30000 } = params;

    // Get service status via docker-compose ps
    const psResult = await this.mcpWrapper.executeDockerCompose({
      command: 'ps',
      args: ['--format', 'json'],
      workDir: `${this.servicesPath}/docker`
    });

    if (psResult.exitCode !== 0) {
      throw new Error(`Failed to get service status: ${psResult.stderr}`);
    }

    // Parse docker-compose ps output
    const allContainers = psResult.stdout
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Filter for requested services
    const targetContainers = services.length > 0 
      ? allContainers.filter(container => services.includes(container.Service))
      : allContainers;

    // Convert to ServiceStatus format
    const serviceStatuses: ServiceStatus[] = [];
    let healthyCount = 0;

    for (const container of targetContainers) {
      // Get detailed container info via MCP
      const inspectResult = await this.mcpWrapper.inspectContainer({
        containerId: container.Name
      });

      const containerInfo = inspectResult.success ? inspectResult.data : null;
      
      const status: ServiceStatus = {
        name: container.Service,
        status: this.mapContainerState(container.State),
        health: this.mapHealthStatus(containerInfo?.State?.Health?.Status || 'unknown'),
        uptime: this.calculateUptime(containerInfo?.State?.StartedAt),
        ports: this.extractPorts(container.Ports || ''),
        image: container.Image,
        containerId: container.Name
      };

      if (status.health === 'healthy' && status.status === 'running') {
        healthyCount++;
      }

      serviceStatuses.push(status);
    }

    // Determine overall health
    const totalCount = serviceStatuses.length;
    let overallHealth: 'healthy' | 'degraded' | 'unhealthy';

    if (healthyCount === totalCount && totalCount > 0) {
      overallHealth = 'healthy';
    } else if (healthyCount > 0) {
      overallHealth = 'degraded';
    } else {
      overallHealth = 'unhealthy';
    }

    return {
      services: serviceStatuses,
      overallHealth,
      healthyCount,
      totalCount,
      timestamp: new Date()
    };
  }

  /**
   * Get service logs
   */
  async getServiceLogs(params: LogParams): Promise<ServiceLogResult> {
    const {
      service,
      lines = 100,
      follow = false,
      since
    } = params;

    const args = ['logs'];
    
    if (!follow) args.push('--tail', lines.toString());
    if (follow) args.push('-f');
    if (since) args.push('--since', since);
    
    args.push(service);

    const result = await this.mcpWrapper.executeDockerCompose({
      command: 'logs',
      args: args.slice(1), // Remove 'logs' from args
      workDir: `${this.servicesPath}/docker`
    });

    const logs = result.stdout.split('\n').filter(line => line.trim());

    return {
      service,
      logs,
      timestamp: new Date(),
      truncated: !follow && logs.length >= lines
    };
  }

  /**
   * Get service resource statistics
   */
  async getServiceStats(params: StatsParams): Promise<ServiceStatsResult[]> {
    const { services = [], stream = false } = params;

    // Get container names for services
    const psResult = await this.mcpWrapper.executeDockerCompose({
      command: 'ps',
      args: ['--format', 'json'],
      workDir: `${this.servicesPath}/docker`
    });

    if (psResult.exitCode !== 0) {
      throw new Error(`Failed to get service list: ${psResult.stderr}`);
    }

    const containers = psResult.stdout
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const targetContainers = services.length > 0 
      ? containers.filter(container => services.includes(container.Service))
      : containers;

    // Get stats for each container via MCP
    const statsResults: ServiceStatsResult[] = [];

    for (const container of targetContainers) {
      const statsResult = await this.mcpWrapper.getContainerStats({
        containerId: container.Name,
        stream: false
      });

      if (statsResult.success && statsResult.data) {
        const stats = statsResult.data;
        
        statsResults.push({
          service: container.Service,
          cpu: {
            percentage: this.calculateCpuPercentage(stats),
            usage: stats.cpu_stats?.cpu_usage?.total_usage?.toString() || '0'
          },
          memory: {
            usage: this.formatBytes(stats.memory_stats?.usage || 0),
            limit: this.formatBytes(stats.memory_stats?.limit || 0),
            percentage: this.calculateMemoryPercentage(stats)
          },
          network: {
            rx: this.formatBytes(this.getTotalNetworkRx(stats)),
            tx: this.formatBytes(this.getTotalNetworkTx(stats))
          },
          io: {
            read: this.formatBytes(this.getTotalBlockRead(stats)),
            write: this.formatBytes(this.getTotalBlockWrite(stats))
          },
          timestamp: new Date()
        });
      }
    }

    return statsResults;
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private mapContainerState(state: string): ServiceStatus['status'] {
    switch (state?.toLowerCase()) {
      case 'running': return 'running';
      case 'exited': return 'stopped';
      case 'restarting': return 'starting';
      case 'paused': return 'stopped';
      case 'dead': return 'stopped';
      default: return 'unknown';
    }
  }

  private mapHealthStatus(health: string): ServiceStatus['health'] {
    switch (health?.toLowerCase()) {
      case 'healthy': return 'healthy';
      case 'unhealthy': return 'unhealthy';
      case 'starting': return 'starting';
      default: return 'unknown';
    }
  }

  private calculateUptime(startedAt?: string): string {
    if (!startedAt) return 'unknown';
    
    const start = new Date(startedAt);
    const now = new Date();
    const uptime = now.getTime() - start.getTime();
    
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  private extractPorts(portsString: string): string[] {
    if (!portsString) return [];
    
    // Parse docker-compose ps ports format: "0.0.0.0:8080->8080/tcp"
    return portsString
      .split(',')
      .map(port => port.trim())
      .filter(port => port.includes('->'))
      .map(port => port.split('->')[0]);
  }

  private calculateCpuPercentage(stats: any): number {
    try {
      const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
      const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
      const numberCpus = stats.cpu_stats.online_cpus || 1;
      
      return (cpuDelta / systemDelta) * numberCpus * 100;
    } catch {
      return 0;
    }
  }

  private calculateMemoryPercentage(stats: any): number {
    try {
      const usage = stats.memory_stats.usage;
      const limit = stats.memory_stats.limit;
      return (usage / limit) * 100;
    } catch {
      return 0;
    }
  }

  private getTotalNetworkRx(stats: any): number {
    try {
      return Object.values(stats.networks || {})
        .reduce((total: number, net: any) => total + (net.rx_bytes || 0), 0);
    } catch {
      return 0;
    }
  }

  private getTotalNetworkTx(stats: any): number {
    try {
      return Object.values(stats.networks || {})
        .reduce((total: number, net: any) => total + (net.tx_bytes || 0), 0);
    } catch {
      return 0;
    }
  }

  private getTotalBlockRead(stats: any): number {
    try {
      return stats.blkio_stats.io_service_bytes_recursive
        ?.filter((entry: any) => entry.op === 'Read')
        .reduce((total: number, entry: any) => total + entry.value, 0) || 0;
    } catch {
      return 0;
    }
  }

  private getTotalBlockWrite(stats: any): number {
    try {
      return stats.blkio_stats.io_service_bytes_recursive
        ?.filter((entry: any) => entry.op === 'Write')
        .reduce((total: number, entry: any) => total + entry.value, 0) || 0;
    } catch {
      return 0;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  // =============================================================================
  // LIFECYCLE MANAGEMENT
  // =============================================================================

  async initialize(): Promise<void> {
    // Verify services directory structure
    await this.mcpWrapper.verifyEnvironment({
      servicesPath: this.servicesPath,
      requiredFiles: [
        'docker/docker-compose.yml',
        'config',
        'scripts'
      ]
    });
  }

  async close(): Promise<void> {
    // Cleanup any resources if needed
    // MCP wrapper handles its own cleanup
  }
}