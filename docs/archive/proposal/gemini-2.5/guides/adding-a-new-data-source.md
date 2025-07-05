# Developer Guide: Adding a New Data Source

This guide explains how to integrate a new data source into the QiCore Crypto Data Platform. The platform's decoupled architecture makes this process straightforward, requiring no changes to existing agents or database consumers.

## 1. The "Write to the Stream" Principle

Our architecture is designed around a central streaming bus (Redpanda). New data producers, like the streamer we're about to build, simply need to:
1.  Fetch data from the external source.
2.  Transform it into our standard internal format.
3.  Publish it to the appropriate Redpanda topic.

Existing consumers will automatically pick up, process, and store this new data without any modifications.

## 2. Step-by-Step Guide

For this example, we will add **CoinGecko** as a new source for real-time price data.

### Step 1: Research the API

First, consult the documentation for the new data source. For CoinGecko, you would find their API endpoints, data format, and any rate limits or API key requirements. For this example, we'll assume they have a WebSocket API for real-time prices.

### Step 2: Create the Streamer File

Create a new, dedicated file for your streamer logic. This keeps concerns separated.
- **File Path**: `src/streaming/coingecko-streamer.ts`

### Step 3: Implement the Streamer Logic

Add the following code to your new file. This class will manage the connection to CoinGecko and publish data to Redpanda.

```typescript
// src/streaming/coingecko-streamer.ts

import { WebSocket } from 'ws';
import { redpandaProducer } from '../streaming/redpanda'; // Assume a Redpanda producer client

// This is our platform's standard data format.
interface StandardizedOHLCV {
    source: string;
    symbol: string;
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

// This is the format we get from CoinGecko's WebSocket (hypothetical).
interface CoinGeckoMessage {
    ticker: string;
    price: string;
    volume: string;
    time: string;
}

export class CoinGeckoStreamer {
    private ws: WebSocket | null = null;
    private symbols: string[];

    constructor(symbols: string[]) {
        this.symbols = symbols;
        console.log('[CoinGeckoStreamer] Initialized.');
    }

    public connect(): void {
        // NOTE: This is a simplified example. A real implementation
        // would need robust error handling and reconnection logic.
        this.ws = new WebSocket('wss://api.coingecko.com/api/v3/realtime_price');

        this.ws.on('open', () => {
            console.log('[CoinGeckoStreamer] Connected to CoinGecko WebSocket.');
            // Subscribe to symbols
            this.ws?.send(JSON.stringify({ action: 'subscribe', tickers: this.symbols }));
        });

        this.ws.on('message', (data: Buffer) => {
            const message: CoinGeckoMessage = JSON.parse(data.toString());
            this.handleMessage(message);
        });

        this.ws.on('close', () => {
            console.log('[CoinGeckoStreamer] Disconnected. Will attempt to reconnect...');
            // Add reconnection logic here
        });

        this.ws.on('error', (error) => {
            console.error('[CoinGeckoStreamer] WebSocket error:', error);
        });
    }

    private async handleMessage(message: CoinGeckoMessage): Promise<void> {
        // 1. Transform the external format to our internal standard
        const transformedData: StandardizedOHLCV = {
            source: 'CoinGecko',
            symbol: message.ticker,
            timestamp: new Date(message.time).getTime(),
            open: parseFloat(message.price), // Simplified: OHLC would be the same for a tick
            high: parseFloat(message.price),
            low: parseFloat(message.price),
            close: parseFloat(message.price),
            volume: parseFloat(message.volume),
        };

        // 2. Publish to the Redpanda topic
        try {
            await redpandaProducer.send({
                topic: 'ohlcv-raw', // The SAME topic as other streamers
                messages: [{ value: JSON.stringify(transformedData) }],
            });
            console.log(`[CoinGeckoStreamer] Published ${transformedData.symbol} to Redpanda.`);
        } catch (error) {
            console.error('[CoinGeckoStreamer] Failed to publish to Redpanda:', error);
        }
    }
}
```

### Step 4: Integrate the New Streamer

Finally, update index.ts to initialize and run your new streamer. In a real application, this would be driven by a configuration file.

```typescript
// src/index.ts
// ... existing imports
import { CryptoCompareStreamer } from './streaming/crypto-streamer';
import { CoinGeckoStreamer } from './streaming/coingecko-streamer'; // 1. Import the new streamer

async function main() {
    console.log('Starting QiCore Data Platform...');

    // Initialize the existing CryptoCompare streamer
    const cryptoCompare = new CryptoCompareStreamer(['BTC/USD', 'ETH/USD']);
    cryptoCompare.connect();

    // 2. Initialize and connect the new CoinGecko streamer
    // In a real app, you'd check a config file to see if this should be enabled.
    const coinGecko = new CoinGeckoStreamer(['BTC/USD', 'SOL/USD']);
    coinGecko.connect();

    // ... rest of the application logic
}

main().catch(console.error);
```

### Step 5: Run and Verify

Start the application. You should see logs from both the `CryptoCompareStreamer` and the `CoinGeckoStreamer`. More importantly, the database consumers will automatically start processing data from CoinGecko without any code changes, because they only care about the `ohlcv-raw` topic, not who publishes to it.

This demonstrates the power of a decoupled, event-driven architecture for building extensible data platforms.

