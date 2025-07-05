import type { MCPTool } from "./registry";
/**
 * High-Performance Technical Analysis Tool
 */
export declare class TechnicalAnalysisTool implements MCPTool {
    name: string;
    description: string;
    execute(params: {
        indicators: ("ma" | "rsi" | "macd" | "bollinger" | "stoch")[];
        symbol: string;
        period: number;
        timeframe: string;
    }): Promise<any>;
    private calculateIndicator;
}
/**
 * Market Sentiment Analysis Tool
 */
export declare class SentimentAnalysisTool implements MCPTool {
    name: string;
    description: string;
    execute(params: {
        sources: ("social" | "news" | "onchain" | "derivatives")[];
        symbols: string[];
        timeRange: {
            start: number;
            end: number;
        };
    }): Promise<any>;
    private calculateSentiment;
}
