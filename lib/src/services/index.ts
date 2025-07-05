// lib/src/services/index.ts
// Docker Service Management has been moved to ../mcp-tools/datastream/
// This module exists for backward compatibility

export { DockerServiceAgent } from '../mcp-tools/datastream/docker-service-agent';
export { DockerServiceDSL } from '../mcp-tools/datastream/docker-service-dsl';
export { DockerMCPWrapper } from '../mcp-tools/datastream/docker-mcp-wrapper';

// Types
export type {
  StartServicesTask,
  StopServicesTask,
  ServiceHealthTask,
  ServiceLogsTask,
  ServiceStatsTask,
  DockerServiceTask,
  ServiceStatus,
  ServiceHealthResult,
  ServiceLogResult,
  ServiceStatsResult
} from '../mcp-tools/datastream/docker-service-agent';

export type {
  StartServicesParams,
  StopServicesParams,
  HealthCheckParams,
  LogParams,
  StatsParams
} from '../mcp-tools/datastream/docker-service-dsl';

export type {
  DockerComposeParams,
  ContainerInspectParams,
  ContainerStatsParams,
  EnvironmentVerifyParams,
  MCPCommandResult
} from '../mcp-tools/datastream/docker-mcp-wrapper';