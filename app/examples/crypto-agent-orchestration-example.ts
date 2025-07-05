// lib/src/examples/crypto-agent-orchestration-example.ts
// Complete example of QiAgent + AI Orchestra workflow orchestration
// Demonstrates proper architecture: Agent = QiAgent + DSL + MCPWrapper

import { 
  createQiWorkflow,
  type QiWorkflowContext,
  type AgentWorkflow,
  type OrchestrationPattern,
  type AgentCoordinator,
  type AgentMessage,
  type AgentTask
} from '@qicore/agent-lib/qiagent';
import { MCPClient } from '@qicore/agent-lib/qimcp/client';
import { CryptoMarketAgent } from '../agents/crypto-market-agent';
import { CryptoDSL } from '../coingecko/crypto-dsl';
import { CryptoMCPWrapper } from '../coingecko/crypto-mcp-wrapper';

// =============================================================================
// ORCHESTRATION CONFIGURATION
// =============================================================================

export interface CryptoOrchestrationConfig {
  apiKey?: string;
  environment?: 'free' | 'demo' | 'pro';
  rateLimit?: number;
  debug?: boolean;
  agents?: {
    marketMonitor?: boolean;
    technicalAnalyst?: boolean;
    riskAssessor?: boolean;
    alertManager?: boolean;
  };
}

// =============================================================================
// ORCHESTRATION RESULTS
// =============================================================================

export interface OrchestrationResult {
  workflowId: string;
  status: 'completed' | 'failed' | 'partial';
  duration: number;
  results: {
    marketData?: any;
    technicalAnalysis?: any;
    riskAssessment?: any;
    alerts?: any;
    recommendations?: string[];
  };
  metrics: {
    totalTasks: number;
    successfulTasks: number;
    failedTasks: number;
    averageTaskDuration: number;
  };
  timestamp: Date;
}

// =============================================================================
// CRYPTO AGENT ORCHESTRATOR
// =============================================================================

/**
 * CryptoAgentOrchestrator - Complete QiAgent + AI Orchestra example
 * 
 * Demonstrates:
 * 1. Agent = QiAgent + DSL + MCPWrapper
 * 2. Workflows USE DSL and MCP wrappers
 * 3. Proper AI Orchestra coordination patterns
 * 4. Multi-agent collaboration
 */
export class CryptoAgentOrchestrator {
  private agents: Map<string, CryptoMarketAgent> = new Map();
  private mcpClient: MCPClient;
  private coordinator: AgentCoordinator;
  private config: CryptoOrchestrationConfig;

  constructor(config: CryptoOrchestrationConfig = {}) {
    this.config = {
      environment: 'free',
      rateLimit: 10,
      debug: false,
      agents: {
        marketMonitor: true,
        technicalAnalyst: true,
        riskAssessor: true,
        alertManager: true,
      },
      ...config,
    };

    // Initialize MCP client
    this.mcpClient = new MCPClient('stdio://coingecko-mcp-server');
    
    // Initialize agent coordinator
    this.coordinator = this.createAgentCoordinator();
  }

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  /**
   * Initialize the orchestration system
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Crypto Agent Orchestration System...');

    try {
      // Create and initialize agents
      await this.createAgents();
      
      // Register agents with coordinator
      await this.registerAgents();
      
      // Start coordinator
      await this.coordinator.start();

      console.log('✅ Crypto Agent Orchestration System initialized successfully');
      console.log(`   - Agents: ${this.agents.size}`);
      console.log(`   - Environment: ${this.config.environment}`);
      console.log(`   - Rate Limit: ${this.config.rateLimit} req/min`);

    } catch (error) {
      console.error('❌ Failed to initialize orchestration system:', error);
      throw error;
    }
  }

  /**
   * Create agent coordinator
   */
  private createAgentCoordinator(): AgentCoordinator {
    // This would use the actual AgentCoordinator from qiagent
    // For now, we'll create a simplified version
    return {
      async start() { console.log('🎯 Agent coordinator started'); },
      async stop() { console.log('🛑 Agent coordinator stopped'); },
      async registerAgent(agent: any) { console.log(`📝 Registered agent: ${agent.config.id}`); },
      async executeWorkflow(workflowId: string, context: any) { 
        console.log(`▶️ Executing workflow: ${workflowId}`);
        return context;
      },
      async submitTaskToAgent(agentType: string, task: any) {
        console.log(`📋 Submitting task to ${agentType}: ${task.type}`);
        return 'task-id-' + Date.now();
      },
      async relayMessage(message: AgentMessage) {
        console.log(`💬 Relaying message from ${message.from} to ${message.to}`);
      },
    } as AgentCoordinator;
  }

  /**
   * Create specialized agents
   */
  private async createAgents(): Promise<void> {
    console.log('🤖 Creating specialized crypto agents...');

    const agentConfigs = [
      {
        id: 'market-monitor-agent',
        name: 'Market Monitor',
        specialization: 'market_monitoring',
        enabled: this.config.agents?.marketMonitor,
      },
      {
        id: 'technical-analyst-agent',
        name: 'Technical Analyst',
        specialization: 'technical_analysis',
        enabled: this.config.agents?.technicalAnalyst,
      },
      {
        id: 'risk-assessor-agent',
        name: 'Risk Assessor',
        specialization: 'risk_assessment',
        enabled: this.config.agents?.riskAssessor,
      },
      {
        id: 'alert-manager-agent',
        name: 'Alert Manager',
        specialization: 'alerting',
        enabled: this.config.agents?.alertManager,
      },
    ];

    for (const agentConfig of agentConfigs) {
      if (agentConfig.enabled) {
        const agent = await this.createAgent(agentConfig);
        this.agents.set(agentConfig.id, agent);
        console.log(`   ✓ Created ${agentConfig.name} agent`);
      }
    }
  }

  /**
   * Create individual agent with DSL + MCP wrapper
   */
  private async createAgent(agentConfig: any): Promise<CryptoMarketAgent> {
    // Create agent configuration
    const config = {
      id: agentConfig.id,
      name: agentConfig.name,
      specialization: agentConfig.specialization,
      capabilities: this.getAgentCapabilities(agentConfig.specialization),
      mcpServers: ['coingecko'],
    };

    // Create agent with QiAgent + DSL + MCPWrapper
    const agent = new CryptoMarketAgent(
      config,
      this.mcpClient,
      console // Simple logger
    );

    // Initialize agent
    await agent.initialize();

    return agent;
  }

  /**
   * Get capabilities for agent specialization
   */
  private getAgentCapabilities(specialization: string): string[] {
    const capabilityMap: Record<string, string[]> = {
      market_monitoring: ['price_tracking', 'volume_analysis', 'market_cap_monitoring'],
      technical_analysis: ['trend_analysis', 'indicator_calculation', 'pattern_recognition'],
      risk_assessment: ['volatility_analysis', 'anomaly_detection', 'risk_scoring'],
      alerting: ['threshold_monitoring', 'notification_generation', 'alert_prioritization'],
    };

    return capabilityMap[specialization] || [];
  }

  /**
   * Register agents with coordinator
   */
  private async registerAgents(): Promise<void> {
    console.log('📝 Registering agents with coordinator...');

    for (const [agentId, agent] of this.agents) {
      await this.coordinator.registerAgent(agent);
    }
  }

  // =============================================================================
  // WORKFLOW ORCHESTRATION
  // =============================================================================

  /**
   * Execute comprehensive market analysis workflow
   * Demonstrates PIPELINE orchestration pattern
   */
  async executeMarketAnalysisWorkflow(symbols: string[]): Promise<OrchestrationResult> {
    console.log('📊 Starting comprehensive market analysis workflow...');
    console.log(`   Symbols: ${symbols.join(', ')}`);

    const workflowId = `market-analysis-${Date.now()}`;
    const startTime = Date.now();
    const taskResults: any[] = [];

    try {
      // Create workflow context
      const context: QiWorkflowContext = {
        messages: [],
        currentAgent: 'orchestrator',
        workflowStep: 'initialization',
        data: {
          symbols,
          workflowId,
          startTime,
        },
        metadata: {
          startTime,
          stepHistory: [],
          performance: {},
        },
      };

      // Step 1: Market Data Collection (Market Monitor Agent)
      console.log('📈 Step 1: Market data collection...');
      const marketAgent = this.agents.get('market-monitor-agent');
      if (marketAgent) {
        const marketDataTask = {
          id: `market-data-${Date.now()}`,
          type: 'get_market_data' as const,
          params: {
            symbols,
            includeMarketCap: true,
            includePriceChange: true,
          },
          priority: 'high' as const,
          createdAt: new Date(),
          createdBy: 'orchestrator',
        };

        const marketResult = await marketAgent.executeTask(marketDataTask);
        taskResults.push(marketResult);
        context.data.marketData = marketResult.data;
        
        console.log(`   ✓ Market data collected: ${symbols.length} symbols`);
      }

      // Step 2: Technical Analysis (Technical Analyst Agent)
      console.log('📊 Step 2: Technical analysis...');
      const analystAgent = this.agents.get('technical-analyst-agent');
      if (analystAgent && context.data.marketData) {
        const analysisTask = {
          id: `analysis-${Date.now()}`,
          type: 'analyze_market' as const,
          params: {
            symbols,
            timeframe: '1d' as const,
            indicators: ['sma', 'rsi', 'macd'],
          },
          priority: 'high' as const,
          createdAt: new Date(),
          createdBy: 'orchestrator',
        };

        const analysisResult = await analystAgent.executeTask(analysisTask);
        taskResults.push(analysisResult);
        context.data.technicalAnalysis = analysisResult.data;
        
        console.log(`   ✓ Technical analysis completed`);
      }

      // Step 3: Risk Assessment (Risk Assessor Agent)
      console.log('⚠️ Step 3: Risk assessment...');
      const riskAgent = this.agents.get('risk-assessor-agent');
      if (riskAgent) {
        const riskTask = {
          id: `risk-${Date.now()}`,
          type: 'detect_anomalies' as const,
          params: {
            threshold: 10,
            timeWindow: '24h',
          },
          priority: 'medium' as const,
          createdAt: new Date(),
          createdBy: 'orchestrator',
        };

        const riskResult = await riskAgent.executeTask(riskTask);
        taskResults.push(riskResult);
        context.data.riskAssessment = riskResult.data;
        
        console.log(`   ✓ Risk assessment completed`);
      }

      // Step 4: Alert Generation (Alert Manager Agent)
      console.log('🚨 Step 4: Alert generation...');
      const alertAgent = this.agents.get('alert-manager-agent');
      if (alertAgent && context.data.riskAssessment) {
        // Generate alerts based on risk assessment
        const alerts = this.generateAlerts(context.data);
        context.data.alerts = alerts;
        
        console.log(`   ✓ Generated ${alerts.length} alerts`);
      }

      // Generate final recommendations
      const recommendations = this.generateRecommendations(context.data);

      const duration = Date.now() - startTime;
      const successfulTasks = taskResults.filter(r => r.success).length;

      const result: OrchestrationResult = {
        workflowId,
        status: successfulTasks === taskResults.length ? 'completed' : 'partial',
        duration,
        results: {
          marketData: context.data.marketData,
          technicalAnalysis: context.data.technicalAnalysis,
          riskAssessment: context.data.riskAssessment,
          alerts: context.data.alerts,
          recommendations,
        },
        metrics: {
          totalTasks: taskResults.length,
          successfulTasks,
          failedTasks: taskResults.length - successfulTasks,
          averageTaskDuration: taskResults.reduce((sum, r) => sum + (r.duration || 0), 0) / taskResults.length,
        },
        timestamp: new Date(),
      };

      console.log('✅ Market analysis workflow completed');
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Tasks: ${successfulTasks}/${taskResults.length} successful`);
      console.log(`   Recommendations: ${recommendations.length}`);

      return result;

    } catch (error) {
      console.error('❌ Market analysis workflow failed:', error);
      
      return {
        workflowId,
        status: 'failed',
        duration: Date.now() - startTime,
        results: {},
        metrics: {
          totalTasks: taskResults.length,
          successfulTasks: taskResults.filter(r => r.success).length,
          failedTasks: taskResults.filter(r => !r.success).length,
          averageTaskDuration: 0,
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Execute real-time monitoring workflow
   * Demonstrates COLLABORATIVE orchestration pattern
   */
  async executeRealTimeMonitoringWorkflow(symbols: string[], duration: number = 60000): Promise<void> {
    console.log('📡 Starting real-time monitoring workflow...');
    console.log(`   Symbols: ${symbols.join(', ')}`);
    console.log(`   Duration: ${duration / 1000}s`);

    const monitoringTasks: Promise<void>[] = [];

    // Create parallel monitoring tasks for each symbol
    for (const symbol of symbols) {
      const task = this.createMonitoringTask(symbol, duration);
      monitoringTasks.push(task);
    }

    // Execute all monitoring tasks in parallel (COLLABORATIVE pattern)
    await Promise.allSettled(monitoringTasks);

    console.log('✅ Real-time monitoring workflow completed');
  }

  /**
   * Create individual monitoring task
   */
  private async createMonitoringTask(symbol: string, duration: number): Promise<void> {
    const endTime = Date.now() + duration;
    const marketAgent = this.agents.get('market-monitor-agent');
    
    if (!marketAgent) {
      console.warn(`⚠️ No market agent available for monitoring ${symbol}`);
      return;
    }

    console.log(`📊 Starting monitoring for ${symbol}...`);

    while (Date.now() < endTime) {
      try {
        // Use agent to get current price (Workflow USES DSL via agent)
        const priceTask = {
          id: `price-${symbol}-${Date.now()}`,
          type: 'get_market_data' as const,
          params: {
            symbols: [symbol],
            includeMarketCap: false,
            includePriceChange: true,
          },
          priority: 'low' as const,
          createdAt: new Date(),
          createdBy: 'monitoring-workflow',
        };

        const result = await marketAgent.executeTask(priceTask);
        
        if (result.success && result.data?.prices?.length > 0) {
          const price = result.data.prices[0];
          console.log(`💰 ${symbol}: $${price.usdPrice} (${price.change24h > 0 ? '+' : ''}${price.change24h?.toFixed(2)}%)`);
          
          // Check for significant price movements
          if (Math.abs(price.change24h || 0) > 5) {
            console.log(`🚨 Alert: ${symbol} moved ${price.change24h?.toFixed(2)}% in 24h`);
          }
        }

        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, 5000));

      } catch (error) {
        console.error(`❌ Error monitoring ${symbol}:`, error);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait longer on error
      }
    }

    console.log(`✅ Monitoring completed for ${symbol}`);
  }

  // =============================================================================
  // ALERT AND RECOMMENDATION GENERATION
  // =============================================================================

  /**
   * Generate alerts based on analysis results
   */
  private generateAlerts(data: any): any[] {
    const alerts: any[] = [];

    // Price anomaly alerts
    if (data.riskAssessment?.anomalies?.length > 0) {
      alerts.push({
        type: 'price_anomaly',
        severity: data.riskAssessment.severity,
        count: data.riskAssessment.anomalies.length,
        message: `${data.riskAssessment.anomalies.length} price anomalies detected`,
        timestamp: new Date(),
      });
    }

    // Market trend alerts
    if (data.technicalAnalysis?.sentiment) {
      const sentiment = data.technicalAnalysis.sentiment;
      if (sentiment !== 'neutral') {
        alerts.push({
          type: 'market_trend',
          severity: sentiment === 'bearish' ? 'high' : 'medium',
          trend: sentiment,
          message: `Market showing ${sentiment} trend`,
          timestamp: new Date(),
        });
      }
    }

    return alerts;
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(data: any): string[] {
    const recommendations: string[] = [];

    // Risk-based recommendations
    if (data.riskAssessment?.severity === 'high') {
      recommendations.push('Consider reducing position sizes due to high market volatility');
    }

    // Trend-based recommendations
    if (data.technicalAnalysis?.sentiment === 'bullish') {
      recommendations.push('Market conditions favor long positions');
    } else if (data.technicalAnalysis?.sentiment === 'bearish') {
      recommendations.push('Consider defensive positioning or short opportunities');
    }

    // Performance-based recommendations
    if (data.technicalAnalysis?.topPerformers?.gainers?.length > 0) {
      const topGainer = data.technicalAnalysis.topPerformers.gainers[0];
      recommendations.push(`Monitor ${topGainer.symbol} - showing strong performance (+${topGainer.change24h.toFixed(2)}%)`);
    }

    return recommendations;
  }

  // =============================================================================
  // LIFECYCLE MANAGEMENT
  // =============================================================================

  /**
   * Shutdown orchestration system
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Crypto Agent Orchestration System...');

    try {
      // Shutdown all agents
      for (const [agentId, agent] of this.agents) {
        await agent.shutdown();
        console.log(`   ✓ Shutdown agent: ${agentId}`);
      }

      // Stop coordinator
      await this.coordinator.stop();

      console.log('✅ Crypto Agent Orchestration System shutdown completed');

    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      throw error;
    }
  }

  /**
   * Get orchestration status
   */
  getStatus(): {
    agents: Array<{ id: string; status: string; specialization: string }>;
    coordinator: { running: boolean };
    config: CryptoOrchestrationConfig;
  } {
    return {
      agents: Array.from(this.agents.entries()).map(([id, agent]) => ({
        id,
        status: 'running', // In real implementation, get from agent
        specialization: agent.config.specialization,
      })),
      coordinator: {
        running: true, // In real implementation, get from coordinator
      },
      config: { ...this.config },
    };
  }
}

// =============================================================================
// USAGE EXAMPLE
// =============================================================================

/**
 * Example usage of the complete orchestration system
 */
export async function runCryptoOrchestrationExample(): Promise<void> {
  console.log('🚀 Running Complete Crypto Agent Orchestration Example');
  console.log('=' .repeat(60));

  const orchestrator = new CryptoAgentOrchestrator({
    environment: 'free',
    rateLimit: 10,
    debug: true,
    agents: {
      marketMonitor: true,
      technicalAnalyst: true,
      riskAssessor: true,
      alertManager: true,
    },
  });

  try {
    // Initialize orchestration system
    await orchestrator.initialize();

    // Execute comprehensive market analysis
    console.log('\n📊 Executing Market Analysis Workflow...');
    const analysisResult = await orchestrator.executeMarketAnalysisWorkflow(['BTC', 'ETH', 'BNB']);
    
    console.log('\n📋 Analysis Results:');
    console.log(`   Status: ${analysisResult.status}`);
    console.log(`   Duration: ${analysisResult.duration}ms`);
    console.log(`   Tasks: ${analysisResult.metrics.successfulTasks}/${analysisResult.metrics.totalTasks}`);
    console.log(`   Recommendations: ${analysisResult.results.recommendations?.length || 0}`);

    // Execute real-time monitoring (for 30 seconds)
    console.log('\n📡 Executing Real-time Monitoring Workflow...');
    await orchestrator.executeRealTimeMonitoringWorkflow(['BTC', 'ETH'], 30000);

    // Show final status
    console.log('\n📊 Final System Status:');
    const status = orchestrator.getStatus();
    console.log(`   Active Agents: ${status.agents.length}`);
    console.log(`   Coordinator: ${status.coordinator.running ? 'Running' : 'Stopped'}`);

  } catch (error) {
    console.error('❌ Orchestration example failed:', error);
  } finally {
    // Cleanup
    await orchestrator.shutdown();
  }

  console.log('\n✅ Crypto Agent Orchestration Example Completed');
}

// Run example if executed directly
if (require.main === module) {
  runCryptoOrchestrationExample()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Example failed:', error);
      process.exit(1);
    });
}