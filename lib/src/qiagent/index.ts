#!/usr/bin/env bun

/**
 * QiCore v4.0 QiAgent: Unified AI Agent Framework
 *
 * Mathematical Foundation:
 * - Agent Composition: Agent = (Config → Result<Model>) ∘ (Model → Workflow)
 * - Workflow Monad: Workflow<T> = Context → Promise<Result<T>>
 * - Performance Tier: TypeScript (interpreted) = 100× baseline, target < 5s workflow completion
 *
 * Provides both individual AI agents (Claude Code, OpenAI, Ollama) and
 * multi-agent workflows (AI Orchestra) with functional programming principles
 * and qi/core Result<T> = Either<QiError, T> pattern.
 *
 * Derived from:
 * - QiCore v4.0 mathematical specifications
 * - Functional composition and monad laws
 * - AI Orchestra workflow orchestration patterns
 */

// Re-export everything from AI SDK (AI Orchestra is built on top of it)
export * from "ai";
// Re-export everything from AI Orchestra
export * from "ai-orchestra";

// Re-export QiPrompt for integrated usage
export * from "../qiprompt/index.js";

// Export Claude Code integration
export * from "./claude-code.js";

import { type CoreMessage, type LanguageModel, type Tool, streamText } from "ai";
// Import actual AI Orchestra functionality
import {
  type Dispatch,
  type Handler,
  type HandlerResult,
  createOrchestra,
  orchestraToAIStream,
  processStream,
} from "ai-orchestra";

// QiAgent-specific types that work with AI Orchestra
export interface QiAgentConfig {
  name: string;
  model: LanguageModel;
  systemPrompt: string;
  tools?: Record<string, Tool>;
  maxSteps?: number;
  nextStates?: string[];
}

export interface QiWorkflowContext {
  messages: CoreMessage[];
  currentAgent?: string;
  workflowStep?: string;
  data: Record<string, unknown>;
  metadata?: {
    startTime?: number;
    stepHistory?: string[];
    performance?: Record<string, unknown>;
  };
}

export type QiAgentHandler = Handler<string, QiWorkflowContext>;

/**
 * Create a mathematical reasoning workflow using AI Orchestra
 */
export function createMathematicalWorkflow(config: {
  researcherModel: LanguageModel;
  verifierModel: LanguageModel;
  reporterModel: LanguageModel;
  tools?: Record<string, Tool>;
}) {
  const orchestra = createOrchestra<QiWorkflowContext>();

  return orchestra({
    researcher: async (
      context: QiWorkflowContext,
      dispatch: Dispatch,
    ): Promise<HandlerResult<"researcher" | "verifier" | "reporter", QiWorkflowContext>> => {
      const stream = streamText({
        model: config.researcherModel,
        messages: context.messages,
        system: `You are a mathematical research agent specializing in algebraic structures and category theory.

Your role:
1. Analyze mathematical concepts thoroughly
2. Research relevant theorems and proofs  
3. Identify verification points
4. When analysis is complete, move to verification

Be thorough but concise. Provide structured information for verification.`,
        tools: config.tools || {},
        maxSteps: 5,
      });

      const result = await processStream(stream, dispatch);

      return {
        nextState: "verifier",
        context: {
          ...context,
          messages: [...context.messages, ...result.messages],
          data: { ...context.data, research: "completed" },
        },
      };
    },

    verifier: async (
      context: QiWorkflowContext,
      dispatch: Dispatch,
    ): Promise<HandlerResult<"researcher" | "verifier" | "reporter", QiWorkflowContext>> => {
      const stream = streamText({
        model: config.verifierModel,
        messages: context.messages,
        system: `You are a mathematical verification agent specializing in formal verification and law checking.

Your role:
1. Verify mathematical properties and laws
2. Check algebraic structure implementations
3. Identify violations and provide counterexamples
4. When verification is complete, move to reporting

Be rigorous and provide specific evidence for your conclusions.`,
        tools: config.tools || {},
        maxSteps: 5,
      });

      const result = await processStream(stream, dispatch);

      return {
        nextState: "reporter",
        context: {
          ...context,
          messages: [...context.messages, ...result.messages],
          data: { ...context.data, verification: "completed" },
        },
      };
    },

    reporter: async (
      context: QiWorkflowContext,
      dispatch: Dispatch,
    ): Promise<HandlerResult<"researcher" | "verifier" | "reporter", QiWorkflowContext>> => {
      const stream = streamText({
        model: config.reporterModel,
        messages: context.messages,
        system: `You are a mathematical reporting agent that creates comprehensive analysis summaries.

Your role:
1. Synthesize research and verification findings
2. Generate structured reports with completeness scores
3. Provide implementation recommendations
4. Create final analysis summary

Focus on actionable insights and clear documentation.`,
        tools: config.tools || {},
        maxSteps: 3,
      });

      const result = await processStream(stream, dispatch);

      return {
        context: {
          ...context,
          messages: [...context.messages, ...result.messages],
          data: { ...context.data, report: "completed" },
        },
      };
    },
  });
}

/**
 * Create a QiAgent workflow runner with context
 */
export function createQiWorkflow(handlers: Record<string, QiAgentHandler>) {
  const orchestra = createOrchestra<QiWorkflowContext>();
  return orchestra(handlers);
}

/**
 * Execute a QiAgent workflow with enhanced context
 */
export async function executeQiWorkflow(
  workflowCreator: ReturnType<typeof createOrchestra<QiWorkflowContext>>,
  handlers: Record<string, QiAgentHandler>,
  startingAgent: string,
  messages: CoreMessage[],
  options?: {
    timeout?: number;
    metadata?: Record<string, unknown>;
  },
) {
  const context: QiWorkflowContext = {
    messages,
    currentAgent: startingAgent,
    data: {},
    metadata: {
      startTime: Date.now(),
      stepHistory: [],
      ...options?.metadata,
    },
  };

  try {
    // Create the workflow with handlers
    const workflow = workflowCreator(handlers);

    const run = workflow.createRun({
      agent: startingAgent,
      context,
      onFinish: async (finalState: {
        agent: string;
        context: QiWorkflowContext;
        timestamp: number;
      }) => {
        console.log(
          `Workflow completed in agent: ${finalState.agent} at ${new Date(finalState.timestamp).toISOString()}`,
        );
      },
    });

    // Convert to streamable format if needed
    const stream = await orchestraToAIStream(run);

    return {
      run,
      stream,
      context: {
        ...context,
        metadata: {
          ...context.metadata,
          endTime: Date.now(),
          duration: Date.now() - (context.metadata?.startTime as number),
        },
      },
    };
  } catch (error) {
    throw new Error(`QiWorkflow execution failed: ${error}`);
  }
}

/**
 * Create a specialized verification workflow for mathematical contracts
 */
export function createContractVerificationWorkflow(config: {
  analyzerModel: LanguageModel;
  verifierModel: LanguageModel;
  tools?: Record<string, Tool>;
}) {
  const orchestra = createOrchestra<QiWorkflowContext>();

  return orchestra({
    analyzer: async (
      context: QiWorkflowContext,
      dispatch: Dispatch,
    ): Promise<HandlerResult<"analyzer" | "verifier", QiWorkflowContext>> => {
      const stream = streamText({
        model: config.analyzerModel,
        messages: context.messages,
        system: `You are a mathematical contract analyzer. Analyze TypeScript contracts for algebraic structures, identify mathematical properties, and prepare verification tasks.`,
        tools: config.tools || {},
        maxSteps: 3,
      });

      const result = await processStream(stream, dispatch);

      return {
        nextState: "verifier",
        context: {
          ...context,
          messages: [...context.messages, ...result.messages],
          data: { ...context.data, analysis: "completed" },
        },
      };
    },

    verifier: async (
      context: QiWorkflowContext,
      dispatch: Dispatch,
    ): Promise<HandlerResult<"analyzer" | "verifier", QiWorkflowContext>> => {
      const stream = streamText({
        model: config.verifierModel,
        messages: context.messages,
        system: `You are a formal property verifier. Verify mathematical laws, check implementations, and provide detailed verification reports with completeness scores.`,
        tools: config.tools || {},
        maxSteps: 5,
      });

      const result = await processStream(stream, dispatch);

      return {
        context: {
          ...context,
          messages: [...context.messages, ...result.messages],
          data: { ...context.data, verification: "completed" },
        },
      };
    },
  });
}

/**
 * Convenience function to create a simple math workflow (backward compatibility)
 */
export function createMathWorkflow() {
  // This is a simplified version for backward compatibility
  // In a real implementation, you'd need to provide actual models
  console.warn(
    "createMathWorkflow() is deprecated. Use createMathematicalWorkflow() with proper model configuration.",
  );

  return {
    async execute(initialContext: QiWorkflowContext): Promise<QiWorkflowContext> {
      // Simple mock implementation for backward compatibility
      return {
        ...initialContext,
        currentAgent: "completed",
        data: {
          ...initialContext.data,
          research: "completed",
          verification: "completed",
          report: "completed",
        },
      };
    },
  };
}

// ============================================================================
// CLAUDE CODE ENHANCED WORKFLOWS
// ============================================================================

// Import qi/core functional components
import { type ResultType as Result, failure, flatMap, map, match, success } from "@qi/core/base";
import { type ClaudeCodeConfig, createClaudeCodeModel } from "./claude-code.js";

// ============================================================================
// Functional Workflow Composition
// ============================================================================

/**
 * Create a Claude Code powered mathematical analysis workflow (Functional)
 * createClaudeCodeMathematicalWorkflow: Config? → Result<Workflow>
 * Performance: < 500μs (TypeScript interpreted tier)
 */
export const createClaudeCodeMathematicalWorkflow = (config?: ClaudeCodeConfig) => {
  return map((claudeModel: LanguageModel) =>
    createMathematicalWorkflow({
      researcherModel: claudeModel,
      verifierModel: claudeModel,
      reporterModel: claudeModel,
    }),
  )(createClaudeCodeModel(config));
};

/**
 * Create a Claude Code powered contract verification workflow (Functional)
 * createClaudeCodeContractWorkflow: Config? → Result<Workflow>
 * Performance: < 500μs (TypeScript interpreted tier)
 */
export const createClaudeCodeContractWorkflow = (config?: ClaudeCodeConfig) => {
  return map((claudeModel: LanguageModel) =>
    createContractVerificationWorkflow({
      analyzerModel: claudeModel,
      verifierModel: claudeModel,
    }),
  )(createClaudeCodeModel(config));
};

/**
 * Create a hybrid workflow using Claude Code + other models (Functional)
 * createHybridWorkflow: HybridConfig → Result<Workflow>
 * Performance: < 500μs (TypeScript interpreted tier)
 */
export const createHybridWorkflow = (config: {
  claudeConfig?: ClaudeCodeConfig;
  otherModels?: {
    researcher?: LanguageModel;
    verifier?: LanguageModel;
    reporter?: LanguageModel;
  };
}) => {
  return map((claudeModel: LanguageModel) =>
    createMathematicalWorkflow({
      researcherModel: config.otherModels?.researcher || claudeModel,
      verifierModel: config.otherModels?.verifier || claudeModel,
      reporterModel: config.otherModels?.reporter || claudeModel,
    }),
  )(createClaudeCodeModel(config.claudeConfig));
};

/**
 * Safe workflow creation with error handling
 * createWorkflowSafe: (Config → Result<Workflow>) → Config → Workflow | null
 * Performance: < 100μs (TypeScript interpreted tier)
 */
export const createWorkflowSafe =
  <TConfig, TWorkflow>(createWorkflowFn: (config: TConfig) => Result<TWorkflow>) =>
  (config: TConfig): TWorkflow | null =>
    match(
      (workflow: TWorkflow) => workflow,
      () => null,
    )(createWorkflowFn(config));

/**
 * Enhanced QiAgent factory with Claude Code support
 */
export const QiAgent = {
  // Core workflow creation
  createWorkflow: createQiWorkflow,
  createMathematicalWorkflow,
  createContractVerificationWorkflow,

  // Claude Code powered workflows
  createClaudeCodeMathematicalWorkflow,
  createClaudeCodeContractWorkflow,
  createHybridWorkflow,

  // Safe workflow creation utilities
  createWorkflowSafe,

  // Claude Code agent access (Result-based)
  ClaudeCode: {
    createAgent: createClaudeCodeAgent,
    createAgentSafe: createClaudeCodeAgentSafe,
    createModel: createClaudeCodeModel,
  },

  // Utilities and execution
  executeWorkflow: executeQiWorkflow,
  processStream,
  orchestraToAIStream,

  // Functional programming utilities
  utils: {
    map,
    flatMap,
    match,
    success,
    failure,
  },
} as const;

// Import Claude Code components for functional re-export
import { createClaudeCodeAgent, createClaudeCodeAgentSafe } from "./claude-code.js";
