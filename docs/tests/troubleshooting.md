# Testing Troubleshooting Guide

## Common Issues & Solutions

### Phase 1: Data Collection Issues

#### Rate Limiting (HTTP 429)
```bash
❌ CoinGecko API unavailable: SSE error: Non-200 status code (429)
```

**Cause**: Too many API calls in short time period

**Solutions**:
1. **Wait and Retry**: Wait 1-2 minutes, then retry
   ```bash
   # Wait for rate limit to reset
   sleep 120
   bun run test:setup:phase1
   ```

2. **Check Recent Activity**: Verify no other processes hitting the API
   ```bash
   # Check if any other QiCore processes running
   ps aux | grep bun | grep test
   ```

3. **Increase Retry Delays**: Modify retry configuration
   ```bash
   export TEST_API_BASE_DELAY=3000  # Increase from 1s to 3s
   bun run test:setup:phase1
   ```

#### Connection Timeouts
```bash
❌ Connection timeout after 15000ms
```

**Cause**: Network issues or external service degradation

**Solutions**:
1. **Check Network Connectivity**:
   ```bash
   # Test basic connectivity
   curl -I https://api.coingecko.com/api/v3/ping
   
   # Test MCP endpoint
   curl -I https://mcp.api.coingecko.com/sse
   ```

2. **Increase Timeout**:
   ```bash
   export TEST_API_TIMEOUT=30000  # Increase to 30s
   bun run test:setup:phase1
   ```

#### Invalid API Response Format
```bash
❌ Failed to parse API response: unexpected token
```

**Cause**: API format changes or corrupted response

**Solutions**:
1. **Check API Status**:
   ```bash
   # Verify CoinGecko API is operational
   curl https://api.coingecko.com/api/v3/ping
   ```

2. **Clear Cached Data**:
   ```bash
   rm -rf lib/tests/data/fixtures/coingecko/*
   bun run test:setup:phase1
   ```

### Phase 2: Service Validation Issues

#### TimescaleDB Connection Failed
```bash
❌ TimescaleDB unavailable: ECONNREFUSED 127.0.0.1:5432
```

**Cause**: PostgreSQL/TimescaleDB not running

**Solutions**:
1. **Start PostgreSQL**:
   ```bash
   # Using Docker
   docker compose up -d postgres
   
   # Using system service
   sudo systemctl start postgresql
   
   # Using Homebrew (macOS)
   brew services start postgresql
   ```

2. **Check PostgreSQL Status**:
   ```bash
   # Docker
   docker compose ps postgres
   
   # System service
   sudo systemctl status postgresql
   
   # Direct connection test
   psql -h localhost -p 5432 -U postgres -c "SELECT 1"
   ```

3. **Verify Connection Settings**:
   ```bash
   # Check environment variables
   echo $POSTGRES_HOST $POSTGRES_PORT $POSTGRES_USER
   
   # Test with different credentials
   export POSTGRES_PASSWORD=your_password
   bun run test:setup:phase2
   ```

#### Database Does Not Exist
```bash
❌ TimescaleDB unavailable: database "crypto_data_test" does not exist
```

**Cause**: Test database not created

**Solutions**:
1. **Auto-Creation** (usually works automatically):
   ```bash
   bun run test:setup:phase2  # Should auto-create database
   ```

2. **Manual Database Creation**:
   ```bash
   # Connect to PostgreSQL
   psql -h localhost -U postgres
   
   # Create test database
   CREATE DATABASE crypto_data_test;
   
   # Connect to test database
   \c crypto_data_test
   
   # Enable TimescaleDB
   CREATE EXTENSION IF NOT EXISTS timescaledb;
   ```

3. **Run Setup Script**:
   ```bash
   bun run test:setup:timescaledb
   ```

#### Redpanda Connection Failed
```bash
❌ Redpanda cluster unavailable: ECONNREFUSED localhost:19092
```

**Cause**: Redpanda/Kafka not running

**Solutions**:
1. **Start Redpanda**:
   ```bash
   # Using Docker
   docker compose up -d redpanda
   
   # Check status
   docker compose ps redpanda
   ```

2. **Test Kafka Connection**:
   ```bash
   # Using kafkajs (if installed globally)
   npx kafkajs admin --brokers localhost:19092 --list-topics
   
   # Using docker exec
   docker compose exec redpanda rpk topic list
   ```

3. **Check Port Availability**:
   ```bash
   # Check if port is in use
   netstat -an | grep 19092
   lsof -i :19092
   ```

### Unit Test Issues

#### Test Timeouts
```bash
Test timed out in 5000ms
```

**Cause**: Test trying to connect to external services in unit test mode

**Solutions**:
1. **Verify useRemoteServer Flag**:
   ```typescript
   // Unit tests should use local mode
   const reader = createCoinGeckoMarketDataReader({ 
     useRemoteServer: false  // ← Should be false for unit tests
   });
   ```

2. **Check Test Configuration**:
   ```typescript
   // vitest.config.unit.ts should exclude integration tests
   export default defineConfig({
     test: {
       include: ["./lib/tests/unit/**/*.test.ts"],
       exclude: ["./lib/tests/integration/**"],  // ← Exclude integration
     },
   });
   ```

3. **Increase Timeout for Debugging**:
   ```bash
   bun test --timeout=10000 lib/tests/unit/specific-test.test.ts
   ```

#### Import Path Errors
```bash
Cannot resolve module '@qi/core/base'
```

**Cause**: TypeScript path aliases not configured correctly

**Solutions**:
1. **Check tsconfig.json**:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@qi/core/base": ["./lib/src/qicore/base"],
         "@qi/dp/abstract/*": ["./lib/src/abstract/*"]
       }
     }
   }
   ```

2. **Check Vitest Config**:
   ```typescript
   // vitest.config.unit.ts
   export default defineConfig({
     resolve: {
       alias: {
         "@qi/core/base": resolve(__dirname, "./lib/src/qicore/base"),
         "@qi/dp/abstract/*": resolve(__dirname, "./lib/src/abstract/*"),
       },
     },
   });
   ```

3. **Use Relative Imports** (temporary fix):
   ```typescript
   // Instead of: import { success } from '@qi/core/base';
   import { success } from '../../../src/qicore/base';
   ```

### Integration Test Issues

#### MCP Client Not Initialized
```bash
❌ External MCP server failed: No client available
```

**Cause**: Rate limiting or connection issues during initialization

**Solutions**:
1. **Check Phase 2 Validation**:
   ```bash
   # Ensure services are available
   bun run test:setup:phase2
   
   # Should show all services available
   # ✅ CoinGecko API available
   # ✅ TimescaleDB available
   ```

2. **Enable Debug Logging**:
   ```typescript
   const reader = createCoinGeckoMarketDataReader({
     name: "debug-reader",
     debug: true,  // ← Enable debug output
     useRemoteServer: true,
   });
   ```

3. **Manual Connection Test**:
   ```bash
   # Test MCP connection manually
   node -e "
   const { Client } = require('@modelcontextprotocol/sdk/client');
   const { SSEClientTransport } = require('@modelcontextprotocol/sdk/client/sse');
   
   const client = new Client({name: 'test'}, {capabilities: {}});
   const transport = new SSEClientTransport(new URL('https://mcp.api.coingecko.com/sse'));
   
   client.connect(transport)
     .then(() => console.log('✅ Connection successful'))
     .catch(err => console.error('❌ Connection failed:', err));
   "
   ```

#### Data Validation Failures
```bash
AssertionError: expected 45000 to be close to 50000
```

**Cause**: Real-time price data differs from fixture expectations

**Solutions**:
1. **Update Fixtures**:
   ```bash
   # Collect fresh data
   bun run test:setup:phase1
   ```

2. **Increase Tolerance**:
   ```typescript
   // Allow larger variance for volatile markets
   const variance = Math.abs(price - expectedPrice) / expectedPrice;
   expect(variance).toBeLessThan(0.10); // 10% instead of 5%
   ```

3. **Check Market Conditions**:
   ```bash
   # Verify current Bitcoin price manually
   curl "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
   ```

### Service Management Issues

#### Docker Services Not Starting
```bash
ERROR: failed to start container
```

**Solutions**:
1. **Check Docker Status**:
   ```bash
   docker --version
   docker compose --version
   
   # Ensure Docker daemon is running
   docker ps
   ```

2. **Clean Docker State**:
   ```bash
   # Stop all containers
   docker compose down
   
   # Remove containers and volumes
   docker compose down -v --remove-orphans
   
   # Rebuild and start
   docker compose up -d --build
   ```

3. **Check Logs**:
   ```bash
   # View service logs
   docker compose logs postgres
   docker compose logs redpanda
   
   # Follow logs in real-time
   docker compose logs -f
   ```

#### Port Conflicts
```bash
Error: Port 5432 is already in use
```

**Solutions**:
1. **Find Process Using Port**:
   ```bash
   # Find what's using the port
   lsof -i :5432
   netstat -tulpn | grep 5432
   ```

2. **Use Different Ports**:
   ```bash
   # Update docker-compose.yml
   services:
     postgres:
       ports:
         - "5433:5432"  # Use different host port
   
   # Update environment variables
   export POSTGRES_PORT=5433
   ```

3. **Stop Conflicting Services**:
   ```bash
   # Stop system PostgreSQL
   sudo systemctl stop postgresql
   
   # Or kill specific process
   sudo kill -9 <PID>
   ```

## Debug Commands

### Quick Diagnostics
```bash
# Check all service status
bun run services:status

# Test database connection
psql -h localhost -p 5432 -U postgres -c "SELECT version()"

# Test Kafka connection  
docker compose exec redpanda rpk cluster info

# Test CoinGecko API
curl -s "https://api.coingecko.com/api/v3/ping" | jq .

# Check test fixtures
ls -la lib/tests/data/fixtures/coingecko/

# Validate test data freshness
node -e "
const data = require('./lib/tests/data/fixtures/coingecko/bitcoin-market-data.json');
const age = (Date.now() - new Date(data.content[0].text[0].last_updated)) / 1000 / 60;
console.log(\`Data age: \${age.toFixed(1)} minutes\`);
"
```

### Detailed Logging
```bash
# Enable debug logging for all tests
export DEBUG=qi:*
export TEST_API_DEBUG_RATE_LIMITING=true

# Run with verbose output
bun test --reporter=verbose lib/tests/unit/
bun test --reporter=verbose lib/tests/integration/

# Save test output to file
bun run test:integration:v1 2>&1 | tee test-debug.log
```

### Reset Everything
```bash
# Nuclear option: Reset all test state
docker compose down -v --remove-orphans
rm -rf lib/tests/data/fixtures/*
rm -rf lib/tests/data/real-time/*
docker compose up -d
bun run test:setup:phase1
bun run test:setup:phase2
bun run test:integration:v1
```

## Environment-Specific Issues

### macOS
```bash
# PostgreSQL via Homebrew
brew services restart postgresql@14

# Check Homebrew services
brew services list | grep postgres
```

### Ubuntu/Debian
```bash
# System PostgreSQL
sudo systemctl restart postgresql
sudo systemctl enable postgresql

# Check service status
systemctl status postgresql
```

### Windows (WSL)
```bash
# Start PostgreSQL in WSL
sudo service postgresql start

# Or use Docker Desktop
docker compose up -d
```

### CI/CD Environments
```bash
# GitHub Actions
- name: Start services
  run: |
    docker compose up -d
    sleep 10  # Wait for services to be ready
    
- name: Wait for PostgreSQL
  run: |
    until pg_isready -h localhost -p 5432; do
      echo "Waiting for PostgreSQL..."
      sleep 2
    done
```

## Getting Help

### Log Analysis
Always check logs when troubleshooting:
```bash
# Application logs
tail -f test-debug.log

# Service logs
docker compose logs -f postgres
docker compose logs -f redpanda

# System logs (Linux)
journalctl -f -u postgresql
```

### Reporting Issues
When reporting test issues, include:
1. **Test command used**: `bun run test:integration:v1`
2. **Environment**: OS, Node/Bun version, Docker version
3. **Error output**: Full error message and stack trace
4. **Service status**: Output of `bun run services:status`
5. **Recent changes**: Any code or configuration changes

### Contact & Support
- **Documentation**: Check other files in `docs/tests/`
- **Issues**: Report bugs in project repository
- **Logs**: Always include relevant log output

---

*This troubleshooting guide covers the most common issues with QiCore's testing system. For additional help, check the service-specific documentation.*