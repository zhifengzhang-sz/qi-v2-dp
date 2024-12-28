# XState v5 Compliance Verification

## 1. Factory Pattern Compliance

### 1.1 Setup Pattern Verification
```typescript
describe('XState v5 Setup Pattern', () => {
  test('uses setup pattern correctly', () => {
    const machine = createWebSocketMachine(config);
    
    // Verify machine structure
    expect(machine.config).toHaveProperty('types');
    expect(machine.config.types).toHaveProperty('context');
    expect(machine.config.types).toHaveProperty('events');
    expect(machine.config.types).not.toHaveProperty('input'); // Should not have input type
  });

  test('no direct machine creation', () => {
    // ❌ This should not exist in codebase
    const source = readSourceFile('machine.ts');
    expect(source).not.toMatch(/createMachine\(/);
    expect(source).toMatch(/setup\(/);
  });

  test('no callable machines', () => {
    const source = readSourceFile('machine.ts');
    expect(source).not.toMatch(/\.provide\(/);
    expect(source).not.toMatch(/\.withContext\(/);
  });
});
```

### 1.2 Context Assignment Verification
```typescript
describe('Context Assignment Pattern', () => {
  test('uses direct context assignment', () => {
    const machine = createWebSocketMachine(config);
    
    // Verify context is assigned directly in machine config
    expect(machine.config.context).toBeDefined();
    expect(typeof machine.config.context).not.toBe('function');
  });

  test('no context providers', () => {
    const source = readAllSourceFiles();
    expect(source).not.toMatch(/\.provide\(\s*{\s*context:/);
    expect(source).not.toMatch(/withContext\(/);
  });
});
```

## 2. Action Implementation Compliance

### 2.1 Pure Actions Verification
```typescript
describe('Action Implementation', () => {
  test('actions return new context', () => {
    const machine = createWebSocketMachine(config);
    const allActions = extractActions(machine);

    allActions.forEach(action => {
      const initialContext = createMockContext();
      const result = action({ context: initialContext, event: mockEvent });

      // Verify immutability
      expect(result).not.toBe(initialContext);
      // Verify returns partial context
      expect(result).toEqual(expect.any(Object));
    });
  });

  test('no assign usage', () => {
    const source = readAllSourceFiles();
    expect(source).not.toMatch(/assign\(/);
    expect(source).not.toMatch(/assign\({/);
  });
});
```

## 3. Type System Compliance

### 3.1 Type Definition Verification
```typescript
describe('Type System Usage', () => {
  test('types defined in setup', () => {
    const machine = createWebSocketMachine(config);
    
    type MachineTypes = typeof machine.config.types;
    
    // Should have context and events, but no input
    type HasCorrectProperties = keyof MachineTypes extends 'context' | 'events' 
      ? true 
      : false;
      
    const hasCorrectProps: HasCorrectProperties = true;
    expect(hasCorrectProps).toBe(true);
  });

  test('uses satisfies operator', () => {
    const source = readAllSourceFiles();
    expect(source).toMatch(/satisfies\s+/);
  });
});
```

## 4. Actor Usage Compliance

### 4.1 Actor Creation Verification
```typescript
describe('Actor Creation Pattern', () => {
  test('uses createActor', () => {
    const source = readAllSourceFiles();
    expect(source).not.toMatch(/interpret\(/);
    expect(source).toMatch(/createActor\(/);
  });

  test('proper actor lifecycle', () => {
    const machine = createWebSocketMachine(config);
    const actor = createActor(machine);
    
    expect(() => {
      actor.start();
      actor.stop();
    }).not.toThrow();
  });
});
```

## 5. Service Implementation Compliance

### 5.1 Promise Actor Verification
```typescript
describe('Promise Actor Pattern', () => {
  test('uses fromPromise', () => {
    const source = readAllSourceFiles();
    expect(source).toMatch(/fromPromise\(/);
    expect(source).not.toMatch(/invoke:/);
  });

  test('implements cleanup', () => {
    const machine = createWebSocketMachine(config);
    const services = extractServices(machine);

    services.forEach(service => {
      const result = service.src({}, {} as any);
      expect(typeof result.then).toBe('function');
      expect(result).resolves.toEqual(expect.any(Function)); // Cleanup function
    });
  });
});
```

## 6. Event Handling Compliance

### 6.1 Event Handler Verification
```typescript
describe('Event Handler Pattern', () => {
  test('uses emit for events', () => {
    const source = readAllSourceFiles();
    expect(source).toMatch(/emit\(\s*{\s*type:/);
    expect(source).not.toMatch(/send\(\s*{\s*type:/);
  });

  test('proper event typing', () => {
    const machine = createWebSocketMachine(config);
    const eventCreators = extractEventCreators(machine);

    eventCreators.forEach(creator => {
      const event = creator();
      expect(event).toHaveProperty('type');
      // Should be union type
      type EventType = typeof event.type;
      type IsUnion = [EventType] extends [string] ? false : true;
      const isUnion: IsUnion = true;
      expect(isUnion).toBe(true);
    });
  });
});
```

## 7. Integration Pattern Compliance

### 7.1 Module Integration Verification
```typescript
describe('Module Integration Pattern', () => {
  test('proper module structure', () => {
    const source = readAllSourceFiles();
    
    // Should use proper import pattern
    expect(source).toMatch(/import\s*{\s*setup\s*}\s*from\s*['"]xstate['"]/);
    
    // Should not use v4 patterns
    expect(source).not.toMatch(/import\s*{\s*Machine\s*}\s*from/);
    expect(source).not.toMatch(/import\s*{\s*interpret\s*}\s*from/);
  });

  test('exports machine type', () => {
    const types = extractExportedTypes('machine.ts');
    expect(types).toContain('WebSocketMachine');
    
    // Should be ReturnType of factory
    type MachineType = ReturnType<typeof createWebSocketMachine>;
    expect(types.includes('type WebSocketMachine = ' + MachineType)).toBe(true);
  });
});
```

## 8. Compliance Checklist

### 8.1 Factory Pattern
- [ ] Uses setup() pattern
- [ ] No direct machine creation
- [ ] No callable machines
- [ ] Direct context assignment
- [ ] No context providers

### 8.2 Actions & Guards
- [ ] Pure functions
- [ ] Returns new context
- [ ] No assign usage
- [ ] Proper type inference

### 8.3 Type System
- [ ] Types in setup
- [ ] Uses satisfies
- [ ] Proper type exports
- [ ] No input types

### 8.4 Actor Usage
- [ ] Uses createActor
- [ ] No interpret
- [ ] Proper lifecycle
- [ ] Cleanup implementation

### 8.5 Services
- [ ] Uses fromPromise
- [ ] No invoke
- [ ] Implements cleanup
- [ ] Proper error handling

### 8.6 Event Handling
- [ ] Uses emit
- [ ] Union type events
- [ ] Proper type inference
- [ ] No send usage

### 8.7 Integration
- [ ] Proper imports
- [ ] Type exports
- [ ] Module structure
- [ ] No v4 patterns