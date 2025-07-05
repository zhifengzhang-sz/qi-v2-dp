// lib/src/mcp-tools/timescale-tools.ts
// MCP Tools for TimescaleDB Operations - Using low-level database modules
import { TimescaleClient } from "../database/timescale-client";
/**
 * High-Performance Time-Series Query Tool
 */
export class TimeSeriesQueryTool {
    name = "timeseries_query";
    description = "High-performance TimescaleDB time-series queries";
    client;
    constructor(connectionString) {
        this.client = new TimescaleClient(connectionString);
    }
    async execute(params) {
        const startTime = Date.now();
        try {
            let result;
            const options = {
                symbols: params.symbols,
                timeRange: params.timeRange
                    ? {
                        start: new Date(params.timeRange.start),
                        end: new Date(params.timeRange.end),
                    }
                    : undefined,
                interval: params.interval,
            };
            switch (params.query) {
                case "latest_prices":
                    result = await this.client.getLatestPrices(options);
                    break;
                case "ohlcv_range":
                    if (!options.timeRange)
                        throw new Error("Time range required for OHLCV query");
                    result = await this.client.getOHLCVRange(options);
                    break;
                case "market_summary":
                    result = await this.client.getMarketSummary(options.timeRange);
                    break;
                case "custom":
                    if (!params.customSQL)
                        throw new Error("Custom SQL required");
                    result = await this.client.executeCustomQuery(params.customSQL);
                    break;
                default:
                    throw new Error(`Unknown query: ${params.query}`);
            }
            const latency = Date.now() - startTime;
            return {
                success: true,
                query: params.query,
                latency,
                rows: Array.isArray(result) ? result.length : 1,
                data: result,
            };
        }
        catch (error) {
            throw new Error(`TimescaleDB query failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
/**
 * High-Performance Data Insertion Tool
 */
export class TimeSeriesInsertTool {
    name = "timeseries_insert";
    description = "High-performance TimescaleDB data insertion";
    client;
    constructor(connectionString) {
        this.client = new TimescaleClient(connectionString);
    }
    async execute(params) {
        const startTime = Date.now();
        try {
            const batchSize = params.batchSize || 1000;
            let totalInserted = 0;
            // Process in batches for optimal performance
            for (let i = 0; i < params.data.length; i += batchSize) {
                const batch = params.data.slice(i, i + batchSize);
                await this.insertBatch(params.table, batch);
                totalInserted += batch.length;
            }
            const latency = Date.now() - startTime;
            return {
                success: true,
                table: params.table,
                inserted: totalInserted,
                batches: Math.ceil(params.data.length / batchSize),
                latency,
            };
        }
        catch (error) {
            throw new Error(`TimescaleDB insertion failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async insertBatch(table, data) {
        // High-performance batch insertion using TimescaleClient
        console.log(`Inserting ${data.length} records into ${table}`);
        switch (table) {
            case "crypto_prices":
                await this.client.insertPrices(data.map((item) => ({
                    time: new Date(item.timestamp || item.time),
                    coin_id: item.coin_id,
                    symbol: item.symbol,
                    usd_price: item.usd_price,
                    btc_price: item.btc_price,
                    market_cap: item.market_cap,
                    volume_24h: item.volume_24h,
                    change_24h: item.change_24h,
                    last_updated: item.last_updated,
                })));
                break;
            case "ohlcv_data":
                await this.client.insertOHLCV(data.map((item) => ({
                    time: new Date(item.timestamp || item.time),
                    coin_id: item.coin_id,
                    symbol: item.symbol,
                    open: item.open,
                    high: item.high,
                    low: item.low,
                    close: item.close,
                    volume: item.volume,
                    interval: item.interval,
                })));
                break;
            case "market_analytics":
                for (const item of data) {
                    await this.client.insertMarketAnalytics({
                        time: new Date(item.timestamp || item.time),
                        total_market_cap: item.total_market_cap,
                        total_volume: item.total_volume,
                        btc_dominance: item.btc_dominance,
                        eth_dominance: item.eth_dominance,
                        defi_market_cap: item.defi_market_cap,
                        active_cryptocurrencies: item.active_cryptocurrencies,
                    });
                }
                break;
            default:
                throw new Error(`Unknown table: ${table}`);
        }
    }
}
/**
 * High-Performance Hypertable Management Tool
 */
export class HypertableManagementTool {
    name = "manage_hypertables";
    description = "High-performance TimescaleDB hypertable management";
    client;
    constructor(connectionString) {
        this.client = new TimescaleClient(connectionString);
    }
    async execute(params) {
        const startTime = Date.now();
        try {
            let result;
            switch (params.operation) {
                case "initialize":
                    // Initialize all hypertables, policies, and indexes
                    await this.client.initialize();
                    result = { message: "TimescaleDB initialized with hypertables, policies, and indexes" };
                    break;
                case "list":
                    result = await this.client.listHypertables();
                    break;
                case "create":
                case "compress":
                case "retention":
                    throw new Error(`Operation '${params.operation}' is handled automatically during initialization`);
                default:
                    throw new Error(`Unknown operation: ${params.operation}`);
            }
            const latency = Date.now() - startTime;
            return {
                success: true,
                operation: params.operation,
                latency,
                result,
            };
        }
        catch (error) {
            throw new Error(`Hypertable management failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
