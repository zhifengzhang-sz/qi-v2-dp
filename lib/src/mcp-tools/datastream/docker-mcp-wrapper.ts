// lib/src/services/docker-mcp-wrapper.ts
// Docker MCP Wrapper - Interface to Official Docker MCP Server
// Provides clean abstraction for Docker MCP communication

import { MCPClient } from '@qicore/agent-lib/qimcp/client';

// =============================================================================
// MCP COMMAND TYPES
// =============================================================================

export interface DockerComposeParams {
  command: string;
  args: string[];
  workDir: string;
  env?: Record<string, string>;
}

export interface ContainerInspectParams {
  containerId: string;
}

export interface ContainerStatsParams {
  containerId: string;
  stream?: boolean;
}

export interface EnvironmentVerifyParams {
  servicesPath: string;
  requiredFiles: string[];
}

export interface MCPCommandResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  data?: any;
}

// =============================================================================
// DOCKER MCP WRAPPER
// =============================================================================

/**
 * Docker MCP Wrapper
 * 
 * Provides clean interface to Official Docker MCP Server.
 * Handles MCP communication, error handling, and response parsing.
 * 
 * Following Agent/MCP paradigm:
 * Agent → DSL → MCP Wrapper → Official Docker MCP Server → Docker Engine
 */
export class DockerMCPWrapper {
  constructor(private mcpClient: MCPClient) {}

  // =============================================================================
  // DOCKER COMPOSE OPERATIONS
  // =============================================================================

  /**
   * Execute docker-compose command via MCP
   */
  async executeDockerCompose(params: DockerComposeParams): Promise<MCPCommandResult> {
    try {
      const result = await this.mcpClient.call('docker_compose', {
        command: params.command,
        args: params.args,
        working_directory: params.workDir,
        environment: params.env || {}
      });

      return {
        success: result.success || result.exit_code === 0,
        exitCode: result.exit_code || 0,
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        data: result.data
      };

    } catch (error) {
      return {
        success: false,
        exitCode: -1,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // =============================================================================
  // CONTAINER OPERATIONS
  // =============================================================================

  /**
   * Inspect container via MCP
   */
  async inspectContainer(params: ContainerInspectParams): Promise<MCPCommandResult> {
    try {
      const result = await this.mcpClient.call('docker_inspect', {
        container_id: params.containerId
      });

      return {
        success: true,
        exitCode: 0,
        stdout: '',
        stderr: '',
        data: result
      };

    } catch (error) {
      return {
        success: false,
        exitCode: -1,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get container statistics via MCP
   */
  async getContainerStats(params: ContainerStatsParams): Promise<MCPCommandResult> {
    try {
      const result = await this.mcpClient.call('docker_stats', {
        container_id: params.containerId,
        stream: params.stream || false
      });

      return {
        success: true,
        exitCode: 0,
        stdout: '',
        stderr: '',
        data: result
      };

    } catch (error) {
      return {
        success: false,
        exitCode: -1,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * List containers via MCP
   */
  async listContainers(options: { all?: boolean } = {}): Promise<MCPCommandResult> {
    try {
      const result = await this.mcpClient.call('docker_ps', {
        all: options.all || false
      });

      return {
        success: true,
        exitCode: 0,
        stdout: '',
        stderr: '',
        data: result
      };

    } catch (error) {
      return {
        success: false,
        exitCode: -1,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // =============================================================================
  // IMAGE OPERATIONS
  // =============================================================================

  /**
   * List Docker images via MCP
   */
  async listImages(): Promise<MCPCommandResult> {
    try {
      const result = await this.mcpClient.call('docker_images');

      return {
        success: true,
        exitCode: 0,
        stdout: '',
        stderr: '',
        data: result
      };

    } catch (error) {
      return {
        success: false,
        exitCode: -1,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Pull Docker image via MCP
   */
  async pullImage(image: string): Promise<MCPCommandResult> {
    try {
      const result = await this.mcpClient.call('docker_pull', {
        image
      });

      return {
        success: result.success !== false,
        exitCode: 0,
        stdout: result.output || '',
        stderr: result.error || '',
        data: result
      };

    } catch (error) {
      return {
        success: false,
        exitCode: -1,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // =============================================================================
  // VOLUME OPERATIONS
  // =============================================================================

  /**
   * List Docker volumes via MCP
   */
  async listVolumes(): Promise<MCPCommandResult> {
    try {
      const result = await this.mcpClient.call('docker_volume_ls');

      return {
        success: true,
        exitCode: 0,
        stdout: '',
        stderr: '',
        data: result
      };

    } catch (error) {
      return {
        success: false,
        exitCode: -1,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Remove Docker volumes via MCP
   */
  async removeVolumes(volumes: string[]): Promise<MCPCommandResult> {
    try {
      const result = await this.mcpClient.call('docker_volume_rm', {
        volumes
      });

      return {
        success: result.success !== false,
        exitCode: 0,
        stdout: result.output || '',
        stderr: result.error || '',
        data: result
      };

    } catch (error) {
      return {
        success: false,
        exitCode: -1,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // =============================================================================
  // NETWORK OPERATIONS
  // =============================================================================

  /**
   * List Docker networks via MCP
   */
  async listNetworks(): Promise<MCPCommandResult> {
    try {
      const result = await this.mcpClient.call('docker_network_ls');

      return {
        success: true,
        exitCode: 0,
        stdout: '',
        stderr: '',
        data: result
      };

    } catch (error) {
      return {
        success: false,
        exitCode: -1,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // =============================================================================
  // SYSTEM OPERATIONS
  // =============================================================================

  /**
   * Get Docker system information via MCP
   */
  async getSystemInfo(): Promise<MCPCommandResult> {
    try {
      const result = await this.mcpClient.call('docker_info');

      return {
        success: true,
        exitCode: 0,
        stdout: '',
        stderr: '',
        data: result
      };

    } catch (error) {
      return {
        success: false,
        exitCode: -1,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get Docker version via MCP
   */
  async getVersion(): Promise<MCPCommandResult> {
    try {
      const result = await this.mcpClient.call('docker_version');

      return {
        success: true,
        exitCode: 0,
        stdout: '',
        stderr: '',
        data: result
      };

    } catch (error) {
      return {
        success: false,
        exitCode: -1,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Clean up Docker system via MCP
   */
  async systemPrune(options: { volumes?: boolean; all?: boolean } = {}): Promise<MCPCommandResult> {
    try {
      const result = await this.mcpClient.call('docker_system_prune', {
        volumes: options.volumes || false,
        all: options.all || false
      });

      return {
        success: result.success !== false,
        exitCode: 0,
        stdout: result.output || '',
        stderr: result.error || '',
        data: result
      };

    } catch (error) {
      return {
        success: false,
        exitCode: -1,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // =============================================================================
  // ENVIRONMENT VERIFICATION
  // =============================================================================

  /**
   * Verify Docker environment and services directory structure
   */
  async verifyEnvironment(params: EnvironmentVerifyParams): Promise<MCPCommandResult> {
    try {
      // Check Docker daemon status
      const dockerInfo = await this.getSystemInfo();
      if (!dockerInfo.success) {
        throw new Error('Docker daemon not accessible');
      }

      // Check services directory structure via file system MCP calls
      const fileChecks = [];
      for (const file of params.requiredFiles) {
        const filePath = `${params.servicesPath}/${file}`;
        try {
          const fileResult = await this.mcpClient.call('fs_exists', {
            path: filePath
          });
          fileChecks.push({
            file: filePath,
            exists: fileResult.exists === true
          });
        } catch {
          fileChecks.push({
            file: filePath,
            exists: false
          });
        }
      }

      const missingFiles = fileChecks.filter(check => !check.exists);
      
      return {
        success: missingFiles.length === 0,
        exitCode: missingFiles.length === 0 ? 0 : 1,
        stdout: `Environment verification completed`,
        stderr: missingFiles.length > 0 ? `Missing files: ${missingFiles.map(f => f.file).join(', ')}` : '',
        data: {
          dockerInfo: dockerInfo.data,
          fileChecks,
          missingFiles
        }
      };

    } catch (error) {
      return {
        success: false,
        exitCode: -1,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // =============================================================================
  // CONNECTION MANAGEMENT
  // =============================================================================

  /**
   * Test MCP connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.getVersion();
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Get available MCP tools
   */
  async getAvailableTools(): Promise<string[]> {
    try {
      const result = await this.mcpClient.call('list_tools');
      return result.tools || [];
    } catch {
      return [];
    }
  }
}