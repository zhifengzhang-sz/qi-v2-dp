// lib/examples/docker-service-management.ts
// Example: Complete Docker Service Management using Agent/MCP paradigm

import { DockerServiceAgent } from '../src/services/docker-service-agent';
import { MCPClient } from '@qicore/agent-lib/qimcp/client';
import type { AgentConfig } from '@qicore/agent-lib/qiagent';

/**
 * Complete Docker Service Management Example
 * 
 * Demonstrates Agent/MCP paradigm:
 * Agent = QiAgent + DSL + MCPWrapper
 * 
 * Architecture:
 * DockerServiceAgent → DockerServiceDSL → DockerMCPWrapper → Official Docker MCP Server → Docker Engine
 */

async function demonstrateDockerServiceManagement() {
  console.log('🚀 Docker Service Management with Agent/MCP Paradigm');
  console.log('====================================================');
  
  // =============================================================================
  // 1. SETUP AGENT (No LLM needed for infrastructure operations)
  // =============================================================================
  
  const agentConfig: AgentConfig = {
    id: 'docker-service-manager',
    name: 'Docker Service Manager',
    description: 'Manages QiCore crypto platform Docker services',
    version: '1.0.0',
    // No LLM configuration - pure infrastructure operations
    capabilities: ['docker-compose', 'container-management', 'health-monitoring']
  };

  // Connect to Official Docker MCP Server
  // In real implementation, this would connect to running Docker MCP server
  const mcpClient = new MCPClient({
    transport: 'stdio',
    command: 'docker-mcp-server', // Official Docker MCP server
    args: []
  });

  // Initialize agent with MCP client
  const dockerAgent = new DockerServiceAgent(
    agentConfig,
    mcpClient,
    '/home/zzhang/dev/qi/github/mcp-server/dp/services'
  );

  try {
    await dockerAgent.initialize();
    console.log('✅ Docker Service Agent initialized successfully');

    // =============================================================================
    // 2. START CRYPTO PLATFORM SERVICES
    // =============================================================================
    
    console.log('\n🏗️ Starting Crypto Platform Services...');
    
    // Start all critical services
    const startResult = await dockerAgent.executeTask({
      id: `start-all-${Date.now()}`,
      type: 'start_services',
      params: {
        services: ['redpanda', 'timescaledb', 'clickhouse', 'redis'],
        detached: true,
        recreate: false
      },
      priority: 'high',
      createdAt: new Date(),
      createdBy: agentConfig.id
    });

    if (startResult.success) {
      console.log('✅ Services started successfully');
      console.log('📊 Start result:', startResult.data);
    } else {
      console.error('❌ Failed to start services:', startResult.error);
      return;
    }

    // =============================================================================
    // 3. HEALTH MONITORING
    // =============================================================================
    
    console.log('\n🏥 Monitoring Service Health...');
    
    // Wait for services to initialize
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check health using convenience method
    const platformHealth = await dockerAgent.startCryptoPlatform();
    
    console.log('📊 Platform Health Status:');
    console.log(`Overall Health: ${platformHealth.overallHealth}`);
    console.log(`Healthy Services: ${platformHealth.healthyCount}/${platformHealth.totalCount}`);
    
    for (const service of platformHealth.services) {
      console.log(`  ${service.name}: ${service.status} (${service.health}) - ${service.uptime}`);
    }

    // =============================================================================
    // 4. SERVICE LOGS MONITORING
    // =============================================================================
    
    console.log('\n📋 Checking Service Logs...');
    
    // Get logs for Redpanda
    const logsResult = await dockerAgent.executeTask({
      id: `logs-redpanda-${Date.now()}`,
      type: 'get_service_logs',
      params: {
        service: 'redpanda',
        lines: 20
      },
      priority: 'medium',
      createdAt: new Date(),
      createdBy: agentConfig.id
    });

    if (logsResult.success) {
      const logs = logsResult.data as any;
      console.log(`📋 Recent Redpanda logs (${logs.logs.length} lines):`);
      logs.logs.slice(-5).forEach((line: string, i: number) => {
        console.log(`  ${i + 1}: ${line}`);
      });
    }

    // =============================================================================
    // 5. RESOURCE MONITORING
    // =============================================================================
    
    console.log('\n💾 Checking Resource Usage...');
    
    const statsResult = await dockerAgent.executeTask({
      id: `stats-all-${Date.now()}`,
      type: 'get_service_stats',
      params: {
        services: ['redpanda', 'timescaledb', 'clickhouse', 'redis']
      },
      priority: 'medium',
      createdAt: new Date(),
      createdBy: agentConfig.id
    });

    if (statsResult.success) {
      const stats = statsResult.data as any[];
      console.log('📊 Resource Usage:');
      for (const stat of stats) {
        console.log(`  ${stat.service}:`);
        console.log(`    CPU: ${stat.cpu.percentage.toFixed(1)}%`);
        console.log(`    Memory: ${stat.memory.usage} / ${stat.memory.limit} (${stat.memory.percentage.toFixed(1)}%)`);
        console.log(`    Network: ↓${stat.network.rx} ↑${stat.network.tx}`);
      }
    }

    // =============================================================================
    // 6. AUTOMATED HEALTH MONITORING
    // =============================================================================
    
    console.log('\n🔄 Starting Automated Health Monitoring...');
    
    // Monitor health every 30 seconds
    const healthMonitor = setInterval(async () => {
      try {
        const health = await dockerAgent.getCryptoPlatformStatus();
        
        if (health.overallHealth === 'unhealthy') {
          console.log('🚨 ALERT: Platform unhealthy!');
          console.log(`Healthy services: ${health.healthyCount}/${health.totalCount}`);
          
          // Auto-restart unhealthy services
          const unhealthyServices = health.services
            .filter(s => s.status !== 'running' || s.health === 'unhealthy')
            .map(s => s.name);
          
          if (unhealthyServices.length > 0) {
            console.log(`🔄 Auto-restarting unhealthy services: ${unhealthyServices.join(', ')}`);
            
            await dockerAgent.executeTask({
              id: `auto-restart-${Date.now()}`,
              type: 'start_services',
              params: {
                services: unhealthyServices,
                recreate: true
              },
              priority: 'high',
              createdAt: new Date(),
              createdBy: agentConfig.id
            });
          }
        } else {
          console.log(`💚 Platform healthy (${health.healthyCount}/${health.totalCount} services)`);
        }
      } catch (error) {
        console.error('❌ Health monitoring error:', error);
      }
    }, 30000);

    // =============================================================================
    // 7. GRACEFUL SHUTDOWN DEMO
    // =============================================================================
    
    console.log('\n⏰ Running for 2 minutes, then demonstrating graceful shutdown...');
    
    // Run for 2 minutes
    await new Promise(resolve => setTimeout(resolve, 120000));
    
    // Stop health monitoring
    clearInterval(healthMonitor);
    
    console.log('\n🛑 Demonstrating Graceful Shutdown...');
    
    // Stop all services
    const stopResult = await dockerAgent.stopCryptoPlatform();
    
    if (stopResult.success) {
      console.log('✅ All services stopped successfully');
    } else {
      console.error('❌ Error stopping services:', stopResult.error);
    }

  } catch (error) {
    console.error('❌ Docker service management error:', error);
  } finally {
    // Always cleanup agent
    await dockerAgent.shutdown();
    console.log('🔌 Docker Service Agent shutdown completed');
  }
}

/**
 * Real-World Integration Example
 * 
 * Shows how Docker Service Agent integrates with other platform components
 */
async function realWorldIntegration() {
  console.log('\n🌟 Real-World Integration Example');
  console.log('==================================');
  
  // This would typically be part of a larger application
  // where multiple agents work together
  
  const dockerAgent = new DockerServiceAgent(
    {
      id: 'infra-manager',
      name: 'Infrastructure Manager',
      description: 'Manages platform infrastructure',
      version: '1.0.0'
    },
    new MCPClient({ transport: 'stdio', command: 'docker-mcp-server' })
  );

  try {
    await dockerAgent.initialize();
    
    // 1. Platform startup sequence
    console.log('1️⃣ Starting platform infrastructure...');
    await dockerAgent.startCryptoPlatform();
    
    // 2. Wait for health
    console.log('2️⃣ Waiting for services to be healthy...');
    let healthy = false;
    let attempts = 0;
    
    while (!healthy && attempts < 10) {
      const health = await dockerAgent.getCryptoPlatformStatus();
      healthy = health.overallHealth === 'healthy';
      
      if (!healthy) {
        console.log(`⏳ Waiting... (${health.healthyCount}/${health.totalCount} healthy)`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;
      }
    }
    
    if (healthy) {
      console.log('✅ Platform ready for data processing');
      
      // 3. At this point, other agents can start their work:
      // - CoinGecko data agent can start fetching data
      // - Redpanda streaming agent can start processing
      // - TimescaleDB agent can start storing data
      // - Analytics agents can start processing
      
      console.log('📊 Platform services ready:');
      console.log('   • Redpanda: Ready for streaming data');
      console.log('   • TimescaleDB: Ready for time-series storage');
      console.log('   • ClickHouse: Ready for analytics');
      console.log('   • Redis: Ready for caching');
      
    } else {
      console.error('❌ Platform failed to become healthy');
    }
    
  } finally {
    await dockerAgent.shutdown();
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

if (import.meta.main) {
  console.log('🎯 Docker Service Management Examples');
  console.log('=====================================');
  
  try {
    // Run basic example
    await demonstrateDockerServiceManagement();
    
    // Run integration example
    await realWorldIntegration();
    
    console.log('\n🎉 All Docker service management examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Example execution failed:', error);
    process.exit(1);
  }
}

export {
  demonstrateDockerServiceManagement,
  realWorldIntegration
};