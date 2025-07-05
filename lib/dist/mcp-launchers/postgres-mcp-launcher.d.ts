export interface PostgresMCPConfig {
    connectionString: string;
    readOnly?: boolean;
    maxConnections?: number;
    allowDangerous?: boolean;
}
export declare class OfficialPostgresMCPLauncher {
    private process?;
    private isRunning;
    private config;
    constructor(config: PostgresMCPConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    private waitForReady;
    getStatus(): {
        isRunning: boolean;
        pid?: number;
        config: Omit<PostgresMCPConfig, "connectionString">;
    };
    getAvailableTools(): string[];
    getServerInfo(): object;
    isWriteEnabled(): boolean;
    getConnectionInfo(): object;
}
