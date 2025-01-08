Implementation order and process follows the governance rules defined in `governance.md`. Each implementation step must:
1. Comply with stability requirements
2. Follow extension patterns
3. Maintain core boundaries
4. Pass governance review process

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
