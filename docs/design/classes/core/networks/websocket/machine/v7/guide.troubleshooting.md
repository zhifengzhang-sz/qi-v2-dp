# WebSocket Client Troubleshooting Guide

## Common Issues and Solutions

### Connection Failures

1. **Initial Connection Fails**
   - Check URL format and accessibility
   - Verify network connectivity
   - Check for firewall restrictions
   ```typescript
   // Debug logging
   client.on('error', (error) => {
     console.error('Connection error:', {
       type: error.type,
       code: error.code,
       message: error.message
     });
   });
   ```

2. **Frequent Disconnections**
   - Check network stability
   - Verify server keepalive settings
   - Review retry configuration
   ```typescript
   // Monitor reconnection attempts
   client.on('reconnect', (attempt) => {
     console.warn('Reconnecting:', {
       attempt,
       maxRetries: client.config.maxRetries
     });
   });
   ```

3. **Message Delivery Issues**
   - Check queue size and overflow
   - Monitor rate limiting
   - Verify message format
   ```typescript
   // Message queue monitoring
   client.on('queueStatus', (status) => {
     console.info('Queue status:', {
       size: status.currentSize,
       capacity: status.maxSize
     });
   });
   ```

## Diagnostic Steps

1. Enable Debug Mode
```typescript
const client = new WebSocketClient({
  debug: true,
  logLevel: 'debug'
});
```

2. Check State Transitions
```typescript
client.on('stateChange', (from, to) => {
  console.log(`State transition: ${from} -> ${to}`);
});
```

3. Monitor Resource Usage
```typescript
setInterval(() => {
  const metrics = client.getMetrics();
  console.log('Client metrics:', metrics);
}, 60000);
```

## Prevention Guidelines

1. Always handle connection errors
2. Implement proper cleanup on disconnect
3. Monitor queue size and message rate
4. Use appropriate retry settings

## Support Resources

- Check formal specification in `machine.part.1.md`
- Review implementation guide in `machine.part.2.md`
- Consult test cases for expected behavior