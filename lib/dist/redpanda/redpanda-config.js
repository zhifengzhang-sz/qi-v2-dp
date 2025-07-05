export class RedpandaConfigManager {
    static instance;
    config;
    constructor() {
        this.config = {
            brokers: [process.env.REDPANDA_BROKERS || "localhost:9092"],
            clientId: process.env.REDPANDA_CLIENT_ID || "qicore-crypto-platform",
            groupId: process.env.REDPANDA_GROUP_ID || "crypto-group",
            enableAutoCommit: process.env.REDPANDA_AUTO_COMMIT === "true",
            sessionTimeout: Number.parseInt(process.env.REDPANDA_SESSION_TIMEOUT || "30000"),
            heartbeatInterval: Number.parseInt(process.env.REDPANDA_HEARTBEAT_INTERVAL || "3000"),
        };
    }
    static getInstance() {
        if (!RedpandaConfigManager.instance) {
            RedpandaConfigManager.instance = new RedpandaConfigManager();
        }
        return RedpandaConfigManager.instance;
    }
    getConfig() {
        return { ...this.config };
    }
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
    }
    // MCP Server configuration
    getMCPConfig() {
        return {
            server: "rpk",
            command: "rpk",
            args: ["mcp", "server", "--brokers", this.config.brokers.join(",")],
            transport: "stdio",
            environment: {
                REDPANDA_BROKERS: this.config.brokers.join(","),
                RPK_MCP_LOG_LEVEL: process.env.RPK_MCP_LOG_LEVEL || "info",
                RPK_MCP_CLIENT_ID: this.config.clientId,
            },
        };
    }
}
export const redpandaConfig = RedpandaConfigManager.getInstance();
