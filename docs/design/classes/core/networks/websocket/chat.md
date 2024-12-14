Key changes made to WebSocketContext:
1. Added `state: ConnectionStateInfo` for better connection state tracking
2. Added `queue: QueueState` for improved queue management
3. Added `options: ConnectionOptions` to store configuration
4. Removed redundant properties now handled by state and queue objects

Files that need to be updated:

1. `machine.ts`:
   - Update createInitialContext to match new WebSocketContext
   - Update state machine setup and type definitions
   - Modify actions and guards handling in machine creation

2. `actions.ts`:
   - Update all state mutations to use new structure
   - Modify queue handling to use new QueueState
   - Update connection state management

3. `guards.ts`:
   - Update guard conditions to use new state structure
   - Modify queue-related guards
   - Update connection state checks

4. `constants.ts`:
   - No structural changes needed
   - May need to update DEFAULT_CONFIG to match new types

In the next chat, we'll need to:
1. Review these type changes
2. Update each file one by one
3. Ensure all files compile correctly
4. Add any necessary tests
