# Developer Guide: Adding a New AI Agent

This guide provides a step-by-step process for creating and integrating a new AI agent into the QiCore Crypto Data Platform.

## 1. Prerequisites

Before you begin, you should have a basic understanding of:
- TypeScript and modern asynchronous programming (`async`/`await`).
- The overall platform architecture, as described in `docs/gemini/architecture/overview.md`.
- The purpose of AI agents in this system (to perceive, reason, and act on data).

## 2. Step-by-Step Guide

For this example, we will create a **Technical Analysis Agent** that calculates a moving average and uses an AI model to interpret its significance.

### Step 1: Define the Agent's Purpose

First, clearly define what the agent will do.
- **Name**: `TechnicalAnalysisAgent`
- **Goal**: To perform technical analysis on market data.
- **Action**: 
    1. Fetch the last 100 data points for a specific trading pair.
    2. Calculate the 20-period Simple Moving Average (SMA).
    3. Send the recent price and the SMA value to an AI model.
    4. Ask the AI to interpret whether the price being above or below the SMA is a bullish or bearish signal.
    5. Log the AI's interpretation.

### Step 2: Create the Agent File

Create a new file in the agents directory.
- **File Path**: `src/agents/technical-analysis-agent.ts`

### Step 3: Implement the Agent Logic

Add the following code to your new file. This provides a basic structure for your agent.

```typescript
// src/agents/technical-analysis-agent.ts

import { Database } from '../database'; // Assuming a database client exists
import { aiModel } from '../ai'; // Assuming a unified AI model client

// A simple function to calculate SMA
function calculateSMA(data: { close: number }[], period: number): number | null {
    if (data.length < period) {
        return null;
    }
    const sum = data.slice(-period).reduce((acc, val) => acc + val.close, 0);
    return sum / period;
}

export class TechnicalAnalysisAgent {
    private db: Database;
    private symbol: string;

    constructor(symbol: string) {
        this.db = new Database();
        this.symbol = symbol;
        console.log(`[TechnicalAnalysisAgent] Initialized for ${this.symbol}`);
    }

    public async run(): Promise<void> {
        console.log(`[TechnicalAnalysisAgent] Running analysis for ${this.symbol}...`);
        try {
            // 1. Fetch data from the database
            const marketData = await this.db.getLatestCandles(this.symbol, 100);
            if (marketData.length < 20) {
                console.log('[TechnicalAnalysisAgent] Not enough data to perform analysis.');
                return;
            }

            // 2. Calculate the technical indicator
            const sma20 = calculateSMA(marketData, 20);
            const latestPrice = marketData[marketData.length - 1].close;

            if (sma20 === null) {
                console.log('[TechnicalAnalysisAgent] Could not calculate SMA.');
                return;
            }

            // 3. Prepare the prompt for the AI model
            const prompt = `
                The current price of ${this.symbol} is ${latestPrice.toFixed(2)}.
                The 20-period Simple Moving Average (SMA) is ${sma20.toFixed(2)}.
                Is the current price being above or below the SMA considered a bullish or bearish signal in technical analysis?
                Please provide a brief, one-sentence explanation.
            `;

            // 4. Send to the AI model for interpretation
            const interpretation = await aiModel.generateText(prompt);

            // 5. Log the result
            console.log(`[TechnicalAnalysisAgent] AI Interpretation for ${this.symbol}: ${interpretation}`);

        } catch (error) {
            console.error('[TechnicalAnalysisAgent] Error during analysis:', error);
        }
    }
}
```

### Step 4: Integrate the Agent into the Application

Now, you need to make the main application aware of your new agent. Open index.ts and add the following:

```typescript
// src/index.ts
// ... existing imports
import { MarketMonitoringAgent } from './agents/market-monitoring-agent';
import { TechnicalAnalysisAgent } from './agents/technical-analysis-agent'; // 1. Import the new agent

async function main() {
    console.log('Starting QiCore Data Platform...');

    // Initialize existing agents
    const marketMonitor = new MarketMonitoringAgent('BTC/USD');
    
    // 2. Initialize your new agent
    const techAnalysisAgent = new TechnicalAnalysisAgent('BTC/USD');

    // Run agents on a schedule (e.g., every minute)
    setInterval(() => {
        marketMonitor.run();
        techAnalysisAgent.run(); // 3. Call the run method
    }, 60 * 1000); 
}

main().catch(console.error);
```

### Step 5: Run and Verify

Start the application as you normally would (e.g., `bun run start`). You should see the log output from your new `TechnicalAnalysisAgent` in the console each time it runs.

Congratulations, you have successfully added a new AI agent to the platform!

