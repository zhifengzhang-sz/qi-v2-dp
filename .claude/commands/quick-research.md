# Quick Technology Research

Research current state of specified technology for the Data Platform Actor System.

## Usage: /quick-research [technology]

**Research checklist for any technology integration:**

1. **MCP Server Availability**:
   - Search: "[technology] MCP server" site:github.com/modelcontextprotocol
   - Check: @modelcontextprotocol npm packages and mcpservers.org
   - Look for: Official servers that could replace direct API integrations

2. **Current Version & Compatibility**:
   - Search: "[technology] latest version" TypeScript Bun 2024 2025
   - Check: npm registry for latest stable versions
   - Verify: Compatibility with Bun runtime and TypeScript 5.7+

3. **Integration Patterns**:
   - Search: "[technology] API integration" Node.js TypeScript
   - Check: Official SDKs and recommended client libraries
   - Look for: Rate limiting, authentication, error handling patterns

4. **Performance & Reliability**:
   - Search: "[technology] performance" benchmarks 2024 2025
   - Check: Service uptime, rate limits, pricing tiers
   - Verify: Suitability for real-time cryptocurrency data processing

## Technology Categories for Data Platform:

### **Data Sources (for new Source actors)**
- **Financial APIs**: TwelveData, Alpha Vantage, Polygon.io
- **News APIs**: NewsAPI, Financial News API, CryptoPanic
- **On-chain Data**: Moralis, Alchemy, Infura blockchain APIs
- **Social Sentiment**: Twitter API, Reddit API, Discord APIs

### **Data Targets (for new Target actors)**  
- **Analytics Databases**: ClickHouse, BigQuery, Snowflake
- **File Systems**: AWS S3, Azure Blob Storage, local file systems
- **APIs & Webhooks**: Discord webhooks, Slack API, custom REST APIs
- **Message Queues**: RabbitMQ, AWS SQS, Google Pub/Sub

### **Infrastructure Technologies**
- **Runtime**: Bun performance updates and features
- **Databases**: TimescaleDB extensions, PostgreSQL optimizations
- **Streaming**: Redpanda features, Kafka compatibility updates
- **Monitoring**: OpenTelemetry, Prometheus, Grafana integrations

## Quick Research Template:

```markdown
## Research: [Technology Name]

### MCP Server Status:
- Official MCP Server: [exists/doesn't exist/third-party]
- Server Capabilities: [what tools/endpoints it provides]
- Recommendation: [use MCP server vs direct API integration]

### Integration Feasibility:
- Official SDK: [language/platform support]
- API Design: [REST/GraphQL/WebSocket]
- Authentication: [API key/OAuth/other]
- Rate Limits: [requests per minute/hour]

### Actor Implementation:
- Actor Type: [Source/Target]
- Base Class: [BaseReader/BaseWriter]
- Plugin Methods Needed: [list required plugins]
- Data Transformation: [input format → unified types]

### Performance Considerations:
- Latency: [typical response times]
- Throughput: [requests per second limitations]
- Reliability: [uptime/SLA information]
- Cost: [free tier/pricing structure]

### Implementation Complexity:
- Effort Level: [low/medium/high]
- Dependencies: [additional packages needed]
- Configuration: [environment variables/secrets needed]
- Testing: [sandbox/demo environment available]

### Recommendation:
- Priority: [high/medium/low] for inclusion in Data Platform
- Reasoning: [value proposition for cryptocurrency data processing]
- Next Steps: [proof of concept/full implementation/research more]
```

## Example Research Queries:

### **Financial Data Sources**
```
"TwelveData API TypeScript SDK"
"Alpha Vantage MCP server model context protocol"
"Polygon.io real-time crypto data API"
"Financial data API comparison 2024"
```

### **Analytics Targets**
```
"ClickHouse TypeScript client performance"
"BigQuery streaming inserts cryptocurrency data"
"TimescaleDB vs ClickHouse time series comparison"
"S3 file upload TypeScript best practices"
```

### **Infrastructure Updates**
```
"Bun 2024 performance improvements Node.js comparison"
"TimescaleDB 2024 features compression updates"
"Redpanda vs Kafka latency benchmarks 2024"
"MCP servers directory cryptocurrency finance"
```

## Research Workflow:

1. **Start with MCP**: Check if official MCP server exists first
2. **Official SDKs**: Look for official TypeScript/JavaScript libraries
3. **Community Solutions**: Check GitHub for popular integration libraries
4. **Performance Data**: Find real-world benchmarks and comparisons
5. **Integration Complexity**: Assess effort required for Data Platform integration
6. **Document Findings**: Use template above for consistent research results

**Complete research before suggesting any new technology integrations.**