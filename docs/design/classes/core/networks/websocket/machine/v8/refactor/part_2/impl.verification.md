# Implementation Verification for v9 (impl.verification.md)

## Preamble

### Document Dependencies
This document depends on and is constrained by:

1. `refactor/part_1/spec.md`: Core mathematical changes
2. `refactor/part_1/map.md`: Specification mapping
3. `refactor/part_2/plan.md`: Implementation planning
4. `refactor/part_2/changes.md`: Implementation changes

### Document Purpose
- Defines verification requirements for v9 changes
- Specifies test cases and validation criteria
- Provides property verification guidelines
- Maps formal properties to tests

### Document Scope
FOCUSES on:
- Test specifications
- Property verification
- Validation criteria
- Coverage requirements

Does NOT cover:
- Implementation details
- Mathematical proofs
- Migration procedures
- Performance optimization

## 1. State Transition Tests

### 1.1 New State Transitions
```typescript
describe('State Transitions', () => {
  // Test disconnecting state
  test('connected -> disconnecting', () => {
    const machine = createMachine('connected')
    machine.send('DISCONNECT')
    expect(machine.state).toBe('disconnecting')
    expect(machine.context.disconnectReason).toBeDefined()
  })

  // Test reconnected state
  test('reconnecting -> reconnected', () => {
    const machine = createMachine('reconnecting')
    machine.send('RECONNECTED')
    expect(machine.state).toBe('reconnected')
    expect(machine.context.reconnectCount).toBeGreaterThan(0)
  })

  // Test complete flows
  test('disconnecting flow', () => {
    const machine = createMachine('connected')
    machine.send('DISCONNECT')
    expect(machine.state).toBe('disconnecting')
    machine.send('DISCONNECTED')
    expect(machine.state).toBe('disconnected')
  })

  test('reconnection flow', () => {
    const machine = createMachine('reconnecting')
    machine.send('RECONNECTED')
    expect(machine.state).toBe('reconnected')
    machine.send('STABILIZED')
    expect(machine.state).toBe('connected')
  })
})
```

## 2. Property Verification

### 2.1 State Properties
```typescript
describe('State Properties', () => {
  // Test state invariants
  test('disconnecting state invariants', () => {
    const machine = createMachine('disconnecting')
    expect(machine.context.socket).not.toBeNull()
    expect(machine.context.disconnectReason).not.toBeNull()
  })

  test('reconnected state invariants', () => {
    const machine = createMachine('reconnected')
    expect(machine.context.socket).not.toBeNull()
    expect(machine.context.reconnectCount).toBeGreaterThan(0)
  })

  // Test state constraints
  test('single active state', () => {
    const machine = createMachine()
    const states = ['disconnected', 'disconnecting', 'connecting', 
                   'connected', 'reconnecting', 'reconnected']
    
    states.forEach(state => {
      machine.transition(state)
      const activeStates = machine.configuration.length
      expect(activeStates).toBe(1)
    })
  })
})
```

### 2.2 Context Properties
```typescript
describe('Context Properties', () => {
  test('context type safety', () => {
    const machine = createMachine()
    
    // Test new properties
    expect(typeof machine.context.disconnectReason).toBe('string')
    expect(typeof machine.context.reconnectCount).toBe('number')
    expect(typeof machine.context.lastStableConnection).toBe('number')
  })

  test('context state consistency', () => {
    const machine = createMachine('disconnecting')
    expect(machine.context.disconnectReason).not.toBeNull()
    
    machine.transition('disconnected')
    expect(machine.context.disconnectReason).toBeNull()
  })
})
```

## 3. Protocol Verification

### 3.1 WebSocket Events
```typescript
describe('Protocol Events', () => {
  test('disconnecting protocol handling', async () => {
    const client = createClient()
    await client.connect()
    
    const closePromise = new Promise(resolve => {
      client.onClose = resolve
    })
    
    client.disconnect('test reason')
    expect(client.state).toBe('disconnecting')
    
    await closePromise
    expect(client.state).toBe('disconnected')
  })

  test('reconnection protocol handling', async () => {
    const client = createClient()
    await client.connect()
    
    // Force reconnection
    client.socket.close()
    expect(client.state).toBe('reconnecting')
    
    await client.socket.open()
    expect(client.state).toBe('reconnected')
    
    await sleep(1000) // Wait for stabilization
    expect(client.state).toBe('connected')
  })
})
```

## 4. Integration Tests

### 4.1 Component Integration
```typescript
describe('Component Integration', () => {
  test('state machine and protocol handler', async () => {
    const machine = createMachine()
    const protocol = createProtocolHandler(machine)
    
    await protocol.connect()
    expect(machine.state).toBe('connected')
    
    protocol.disconnect()
    expect(machine.state).toBe('disconnecting')
    
    await protocol.waitForClose()
    expect(machine.state).toBe('disconnected')
  })

  test('error handler integration', async () => {
    const machine = createMachine()
    const errorHandler = createErrorHandler(machine)
    
    // Test disconnecting error
    machine.transition('disconnecting')
    errorHandler.handle(new Error('test error'))
    expect(machine.state).toBe('disconnected')
    
    // Test reconnected error
    machine.transition('reconnected')
    errorHandler.handle(new Error('test error'))
    expect(machine.state).toBe('reconnecting')
  })
})
```

## 5. Coverage Requirements

### 5.1 State Coverage
- All states must be reached
- All transitions must be tested
- All guards must be evaluated
- All actions must be executed

### 5.2 Event Coverage
- All events must be triggered
- All event handlers must be called
- All error paths must be tested
- All timeout scenarios must be validated

### 5.3 Property Coverage
- All invariants must be verified
- All constraints must be checked
- All type safety must be validated
- All context consistency must be confirmed

## 6. Validation Criteria

### 6.1 Test Requirements
1. All tests must pass
2. 100% coverage of new code
3. No regression in existing tests
4. All properties verified

### 6.2 Implementation Requirements
1. Type safety maintained
2. No runtime errors
3. All states reachable
4. All properties preserved

### 6.3 Protocol Requirements
1. WebSocket compliance
2. Error handling complete
3. Recovery paths tested
4. Resource cleanup verified

## 7. Success Metrics

### 7.1 Quality Metrics
- Test coverage ≥ 95%
- Type coverage 100%
- No type assertions
- No runtime exceptions

### 7.2 Performance Metrics
- State transitions < 1ms
- Protocol operations < 100ms
- Memory usage < 10MB
- CPU usage < 5%

### 7.3 Stability Metrics
- No flaky tests
- Deterministic behavior
- Consistent recovery
- Predictable cleanup

## 8. Verification Tools

### 8.1 Test Frameworks
```typescript
// Jest configuration
module.exports = {
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  testMatch: [
    '**/tests/**/*.spec.ts'
  ]
}
```

### 8.2 Property Testing
```typescript
import { check, property } from 'fast-check'

// Property-based test examples
describe('Property Tests', () => {
  test('state transitions are deterministic', () => {
    check(property(
      fc.constantFrom(...allStates),
      fc.constantFrom(...allEvents),
      (state, event) => {
        const machine1 = createMachine(state)
        const machine2 = createMachine(state)
        
        machine1.send(event)
        machine2.send(event)
        
        return machine1.state === machine2.state
      }
    ))
  })

  test('context is always valid', () => {
    check(property(
      fc.constantFrom(...allStates),
      state => {
        const machine = createMachine(state)
        return validateContext(machine.context)
      }
    ))
  })
})
```

## 9. Continuous Verification

### 9.1 Pre-commit Checks
```bash
#!/bin/bash
# pre-commit.sh

# Run type checks
npm run type-check

# Run tests
npm run test

# Verify coverage
npm run coverage

# Check formatting
npm run lint
```

### 9.2 CI Pipeline Verification
```yaml
# .github/workflows/verify.yml
name: Verification
on: [push, pull_request]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Type Check
        run: npm run type-check
        
      - name: Test
        run: npm run test
        
      - name: Coverage
        run: npm run coverage
        
      - name: Integration
        run: npm run test:integration
```

## 10. Manual Verification Checklist

### 10.1 State Machine Verification
- [ ] All states reachable
- [ ] All transitions work
- [ ] Context always valid
- [ ] Properties preserved

### 10.2 Protocol Verification
- [ ] WebSocket compliance
- [ ] Error handling works
- [ ] Recovery succeeds
- [ ] Resource cleanup complete

### 10.3 Integration Verification
- [ ] Components interact correctly
- [ ] Error propagation works
- [ ] State consistency maintained
- [ ] No resource leaks

### 10.4 Performance Verification
- [ ] State transitions fast
- [ ] Memory usage acceptable
- [ ] CPU usage reasonable
- [ ] No memory leaks

## 11. Verification Documentation

### 11.1 Required Documentation
1. Test coverage report
2. Property verification report
3. Integration test results
4. Performance test results

### 11.2 Review Requirements
1. Code review completed
2. Test review completed
3. Property verification reviewed
4. Documentation reviewed

### 11.3 Sign-off Requirements
1. All tests passing
2. All properties verified
3. All documentation complete
4. All reviews completed