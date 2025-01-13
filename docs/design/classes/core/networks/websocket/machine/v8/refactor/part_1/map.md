# Specification Change Mapping for v9

## 1. Core Documentation Impact Matrix

### 1.1 machine.part.1.md
| Change | Location | Impact | Dependencies |
|--------|----------|---------|--------------|
| State Space Extension | Section 2.1 | Add states (disconnecting, reconnected) | None |
| Event Space Extension | Section 2.2 | Add events (disconnected, reconnected, stabilized) | State Space |
| Action Space Extension | Section 2.4 | Add actions (initDisconnect, completeDisconnect, stabilizeReconnection) | Events |
| Context Extension | Section 2.3 | Add properties (disconnectReason, reconnectCount, lastStableConnection) | None |

Required Changes:
```diff
- S = {s_i | i=1,2,...,n; n=4}
+ S = {s_i | i=1,2,...,n; n=6}

- E = {e_i | i=1,2,...,m; m=12}
+ E = {e_i | i=1,2,...,m; m=15}

- Γ = {γ_i | i=1,2,...,p; p=11}
+ Γ = {γ_i | i=1,2,...,p; p=14}
```

### 1.2 machine.part.1.websocket.md
| Change | Location | Impact | Dependencies |
|--------|----------|---------|--------------|
| Protocol State Mapping | Section 1.1 | Map new states to WebSocket states | State Space |
| Protocol Event Mapping | Section 1.2 | Map new events to WebSocket events | Event Space |
| Protocol Properties | Section 1.6 | Add symmetric state properties | State Mappings |

Required Changes:
```diff
WebSocketState = {
+ CLOSING: State.disconnecting,
+ RESTORED: State.reconnected,
  ...existing mappings...
}

WebSocketEvent = {
+ CLOSE_INITIATED: Events.disconnected,
+ RECONNECTION_STABLE: Events.stabilized,
  ...existing mappings...
}
```

### 1.3 impl.map.md
| Change | Location | Impact | Dependencies |
|--------|----------|---------|--------------|
| State Mapping | Section 2.1 | Add Θ_S mappings for new states | State Space |
| Event Mapping | Section 2.2 | Add Θ_E mappings for new events | Event Space |
| Action Mapping | Section 2.3 | Add Ω mappings for new actions | Action Space |
| Context Mapping | Section 3.1 | Add Θ_C mappings for new context | Context Space |

Required Changes:
```diff
Θ_S: S → StateEnum where:
+ Θ_S(disconnecting) = StateEnum.DISCONNECTING
+ Θ_S(reconnected) = StateEnum.RECONNECTED

Θ_E: E → EventEnum where:
+ Θ_E(disconnected) = EventEnum.DISCONNECTED
+ Θ_E(reconnected) = EventEnum.RECONNECTED
+ Θ_E(stabilized) = EventEnum.STABILIZED
```

### 1.4 governance.md
| Change | Location | Impact | Dependencies |
|--------|----------|---------|--------------|
| Fixed Core Elements | Section 2.1 | Add new states to immutable core | State Space |
| State Invariants | Section 5.1 | Add invariants for new states | State Properties |
| Extension Points | Section 6.2 | Update state transition handlers | State Mappings |

Required Changes:
```diff
Fixed Core Elements:
  States:
+ - disconnecting
+ - reconnected
  ...existing states...

State Invariants:
+ - disconnecting: socket != null && disconnectReason != null
+ - reconnected: socket != null && reconnectCount > 0
```

## 2. Property Preservation Matrix

### 2.1 Safety Properties
| Property | Impacted Docs | Changes Required |
|----------|---------------|------------------|
| Single Active State | machine.part.1.md | Extend proof for new states |
| State-Socket Consistency | impl.map.md | Add mappings for new states |
| Transition Determinism | machine.part.1.md | Update transition matrix |

### 2.2 Liveness Properties
| Property | Impacted Docs | Changes Required |
|----------|---------------|------------------|
| Progress Guarantee | machine.part.1.md | Add progress proofs for new states |
| Connection Stability | machine.part.1.websocket.md | Add stability properties |
| Resource Cleanup | impl.map.md | Add cleanup mappings |

### 2.3 Protocol Properties
| Property | Impacted Docs | Changes Required |
|----------|---------------|------------------|
| Frame Handling | machine.part.1.websocket.md | Update protocol mappings |
| Error Recovery | machine.part.1.websocket.md | Add recovery paths |
| State Symmetry | machine.part.1.md | Add symmetry proofs |

## 3. Verification Requirements

### 3.1 Mathematical Verification
```
For each new state s ∈ S:
1. Verify ∀e ∈ E: δ(s,e) is defined
2. Prove state reachability
3. Verify context invariants
4. Prove progress properties
```

### 3.2 Implementation Verification
```
For each new mapping Θ:
1. Verify bijective property
2. Check type safety
3. Verify context preservation
4. Test state transitions
```

### 3.3 Protocol Verification
```
For each protocol mapping:
1. Verify WebSocket compliance
2. Check error handling
3. Verify cleanup procedures
4. Test recovery paths
```

## 4. Required Updates Order

1. Core Mathematical Updates:
   - State space extension
   - Event space extension
   - Action space extension
   - Context extension

2. Protocol Mappings:
   - WebSocket state mappings
   - Event mappings
   - Error handling
   - Recovery procedures

3. Implementation Mappings:
   - Type definitions
   - Context mappings
   - Action mappings
   - Property preservation

4. Governance Updates:
   - Core elements
   - Stability rules
   - Extension points
   - Review procedures

## 5. Risk Areas

### 5.1 Backward Compatibility
- Existing state transitions must be preserved
- Context properties must maintain types
- Event handlers must remain valid

### 5.2 Property Preservation
- Safety properties must extend to new states
- Liveness properties must be maintained
- Protocol properties must be preserved

### 5.3 Implementation Stability
- Type system must remain consistent
- Mappings must be bijective
- Extensions must respect boundaries