import type { MCPTool } from "./registry";
/**
 * High-Performance Time-Series Query Tool
 */
export declare class TimeSeriesQueryTool implements MCPTool {
    name: string;
    description: string;
    private client;
    constructor(connectionString: string);
    execute(params: {
        query: "latest_prices" | "ohlcv_range" | "market_summary" | "custom";
        symbols?: string[];
        timeRange?: {
            start: number;
            end: number;
        };
        interval?: string;
        customSQL?: string;
    }): Promise<any>;
}
/**
 * High-Performance Data Insertion Tool
 */
export declare class TimeSeriesInsertTool implements MCPTool {
    name: string;
    description: string;
    private client;
    constructor(connectionString: string);
    execute(params: {
        table: "crypto_prices" | "ohlcv_data" | "market_analytics";
        data: any[];
        batchSize?: number;
    }): Promise<any>;
    private insertBatch;
}
/**
 * High-Performance Hypertable Management Tool
 */
export declare class HypertableManagementTool implements MCPTool {
    name: string;
    description: string;
    private client;
    constructor(connectionString: string);
    execute(params: {
        operation: "create" | "list" | "compress" | "retention" | "initialize";
        tableName?: string;
        timeColumn?: string;
        chunkInterval?: string;
        compressionPolicy?: string;
        retentionPolicy?: string;
    }): Promise<any>;
}
