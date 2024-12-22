### Comprehensive Testing Methodology Learned from EnvLoader Debug

1. **Review Implementation First**
```markdown
### Source Code Analysis
1. Read implementation (EnvLoader.ts)
   - State management approach
   - Event handling logic
   - Callback system design
   - Interface contracts

2. Document Key Behaviors
   - State transitions
   - Event triggers
   - Expected callbacks
   - Error scenarios
```

2. **Test Design Pattern**
```markdown
### Structure
1. Clear initial state setup
2. Mock sequence definition
3. Watch/event setup
4. State change trigger
5. Specific state verification

### State Management
1. Define explicit states
2. Setup mock sequences
3. Track transitions
4. Verify specific changes
```

3. **Implementation**
```typescript


// Standard Pattern
describe("component", () => {
  // 1. Define states
  const state1 = { ...initialState };
  const state2 = { ...changedState };

  // 2. Setup mocks
  vi.mocked(dependency)
    .mockResolvedValueOnce(state1)
    .mockResolvedValueOnce(state2);

  // 3. Track changes
  const changes = [];
  const callback = vi.fn(change => {
    console.log("State:", change);
    changes.push(change);
  });

  // 4. Trigger change
  await triggerChange();

  // 5. Verify specific state
  expect(changes[0]).toEqual(
    expect.objectContaining({
      previous: state1,
      current: state2
    })
  );
});
```

4. **Debug Process**
```markdown
### Steps
1. Log state transitions
2. Verify mock sequences
3. Check event triggers
4. Validate state changes
5. Focus on specific transitions

### Common Issues
1. Multiple state changes
2. Mock sequence issues
3. Async timing
4. State pollution
```

5. **Best Practices**
```markdown
### Development Flow
1. READ implementation first
2. DOCUMENT expected behavior
3. DESIGN focused tests
4. IMPLEMENT test cases
5. DEBUG with logs
6. VERIFY specific states

### Anti-patterns
1. Testing without code review
2. Assuming test correctness
3. Ignoring implementation
4. Unfocused assertions
```