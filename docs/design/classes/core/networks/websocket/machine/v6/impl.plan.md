

From the design document, we should implement in this order:

1. **Core State Machine** using xstate v5
   - Implement the state transitions
   - Actions and guards
   - Context management

2. **WebSocket Manager**
   - Basic ws integration
   - Message handling
   - Error handling
   - Integration with state machine

3. **Message Queue**
   - FIFO implementation
   - Size management
   - Queue operations

4. **Rate Limiter**
   - Window tracking
   - Rate calculations
   - Limit enforcement
