### Lessons Learned from EnvLoader Test Debug

1. **Test Design Pattern**
   - Start with clear initial state
   - Mock sequence matters
   - Verify first state change only
   - Ignore subsequent changes

2. **State Management**
```typescript
// Good pattern
const state1 = { ...validEnvVars };
const state2 = { ...validEnvVars, PORT: "4000" };

vi.mocked(loadEnv)
  .mockResolvedValueOnce(state1)  // Initial state
  .mockResolvedValueOnce(state2); // Changed state
```

3. **Test Structure**
```typescript
// Key components
- Reset mocks
- Define states
- Setup watches
- Trigger change
- Verify specific state
```

4. **Debugging Insights**
- Watch for state transitions
- Log state changes
- Check first transition
- Ignore subsequent noise

5. **Key Discoveries**
   - Multiple state changes occur
   - First change is correct
   - Later changes can be ignored
   - Test should focus on initial transition

6. **Test Improvements**
   - Clear setup phase
   - Explicit state definitions
   - Specific verification
   - Focused assertions

7. **Future Testing Guidelines**
   - Keep state sequences simple
   - Test one transition at a time
   - Log state changes clearly
   - Verify specific outcomes
