# WebSocket Client Class-Level Design: Full Updated Plan

## 1. Overview

- **Purpose**: Define how we will organize, document, and implement the **class-level** design for the WebSocket Client, using a layered approach.  
- **Goal**: Maintain **simplicity**, **completeness**, **workability**, and **stability** by mapping formal specs directly into class structures, interfaces, and constraints.  
- **Reference**: Each file or class at this level can be traced back to the **containers** and **components** outlined in prior design phases (Layers 2 and 3).

### Terminology
- **Layer 0–4**: Internal sub-levels of the class-level design.  
- **machine.md & websocket.md**: The source of formal definitions (events, states, constraints).  
- **xstate v5**: The library for actual state machine logic.  
- **`ws`** or equivalent**: The WebSocket implementation we’ll integrate.

---

## 2. Layer 0: Core Types Foundation

```
phase_2/class/types/
├── common.types.md       # Shared type definitions (enums, basic structs)
├── events.types.md       # Event & action type hierarchy
├── states.types.md       # State definitions & transitions references
└── errors.types.md       # Error categories, codes, classification
```

### Purpose & Scope

1. **Basic, Reusable Types**: Shared across the entire codebase, with **no** direct implementation logic or external library calls.  
2. **Formal Mapping**: Where we establish direct references to `machine.md` and `websocket.md` definitions—for instance, enumerating states (`disconnected`, `connecting`, etc.) and events (`ERROR`, `CONNECT`, etc.).  
3. **Constraints & Invariants**: 
   - E.g., `MAX_RETRIES`, `WINDOW_SIZE`, or message size limits, typically declared as constants or typed fields.

### Example Contents

- **`common.types.md`**: Might define `ConnectionStatus`, `CloseCode`, or `TimeMs` types.  
- **`events.types.md`**: Enumerates `CONNECT`, `DISCONNECT`, `OPEN`, `CLOSE`, `ERROR`, etc. referencing the formal event definitions in `machine.md`.  
- **`states.types.md`**: Lists each state (`disconnected`, `connecting`) and possibly “allowed transitions” or short references to the constraints.  
- **`errors.types.md`**: Outlines error categories (fatal vs. recoverable) from `websocket.md` close codes.

### Dependencies
- **None** outside of basic language features. This ensures maximum reusability.

---

## 3. Layer 1: Base Interfaces & Classes

```
phase_2/class/
├── interfaces/
│   └── internal.interface.md      # Inter-component interface stubs
└── state/
    ├── context.class.md           # Context structure & management
└── protocol/
    ├── errors.class.md            # Error classification core logic
└── message/
    └── queue.class.md             # Basic queue data structure
```

### Purpose & Scope

1. **Interface Contracts**: Define how our internal components communicate. (e.g., “IQueue” with methods like `enqueue`, `dequeue`.)  
2. **Core Behavior Specs**: High-level class definitions that reflect the “component” responsibilities (e.g., a `Context` class to store state machine context, or an `Errors` class referencing `errors.types.md`).  
3. **Resource Management Rules**: Outline what must happen to remain within memory or queue limits.

### Example Contents

- **`internal.interface.md`**:  
  - Could define generic methods like `IActionHandler.handle(event)` or references to the containers we introduced at the previous level.  
- **`context.class.md`**:  
  - Stores `retries`, `socket`, `disconnectReason`, `closeCode`.  
  - Enforces small invariants: `socket != null` if state is `connecting`, etc.
- **`errors.class.md`**:  
  - Uses `errors.types.md` for classification, possibly has methods like `classifyCloseCode(code)`.
- **`queue.class.md`**:  
  - Minimal queue logic (FIFO, capacity limit) but no direct “send” or “rate-limit” yet.

### Dependencies
- **Depends on Layer 0** (types) but **not** on external libs like `xstate` or `ws`.

---

## 4. Layer 2: Core Implementation Specifications

```
phase_2/class/
├── state/
│   └── machine.class.md           # State machine config & xstate integration
├── protocol/
│   ├── socket.class.md            # Socket management (ws library usage)
│   └── frame.class.md             # Frame handling specs (encoding/decoding)
├── message/
│   └── rate.class.md              # Rate limiting specs
└── connection/
    ├── retry.class.md             # Retry logic
    └── timeout.class.md           # Timeout handling
```

### Purpose & Scope

1. **Integration with External Libraries**:  
   - `xstate v5` for the machine in `machine.class.md`.  
   - `ws` (or browser WebSocket) in `socket.class.md`.
2. **Apply Resource Constraints**:  
   - `rate.class.md` implements 100 messages/sec logic.  
   - `retry.class.md` implements `MAX_RETRIES`, exponential backoff.  
   - `timeout.class.md` imposes `CONNECT_TIMEOUT`, etc.
3. **Error Handling Patterns**:  
   - If `frame` size is too large, call `errors.class.md`.

### Example Contents

- **`machine.class.md`**:  
  - The XState configuration for the states (`disconnected`, `connecting`, etc.), referencing transitions from `states.types.md`.  
  - A “machine definition” that triggers actions like “connect socket,” “schedule retry,” etc.  
- **`socket.class.md`**:  
  - A wrapper for the actual `ws` or WebSocket instance, hooking into events like `onopen`, `onerror`, `onclose`.  
  - Exposes methods like `openSocket(url)`, `closeSocket(code?)`, or `sendFrame(frame)`.  
- **`frame.class.md`**:  
  - Logic for validating frame size, encoding/decoding text/binary data.  
  - Possibly references `MAX_MESSAGE_SIZE` from `common.types.md`.  
- **`retry.class.md`** & **`timeout.class.md`**:  
  - Specific classes or modules that handle scheduling (e.g., using setTimeout) and incorporate backoff policies.

### Dependencies
- **Relies** on Levels 0 & 1 for types and base interfaces.  
- **Introduces** `xstate v5`, `ws`, or equivalent real libraries.

---

## 5. Layer 3: Orchestration Layer

```
phase_2/class/
├── state/
│   └── transition.class.md        # Manages machine transitions
├── message/
│   └── dispatch.class.md          # High-level message dispatch orchestration
└── connection/
    └── lifecycle.class.md         # Coordinates lifecycle steps
```

### Purpose & Scope

1. **Component Coordination**: Orchestrates how the modules from Layer 2 interact in real time. E.g., “After `OPEN` event from `socket.class.md`, notify `machine.class.md` to transition to `connected`.”  
2. **State & Lifecycle Control**: Aggregates retry logic, socket open/close requests, queue transitions, etc.  
3. **Message Flow**: The `dispatch.class.md` might combine `queue.class.md`, `rate.class.md`, and `socket.class.md` into a cohesive path for sending/receiving messages.

### Example Contents

- **`transition.class.md`**:  
  - A “controller” that, upon receiving an event from `socket.class.md` (like `onError`), calls the right method in `machine.class.md` and updates the `context.class.md`.  
- **`dispatch.class.md`**:  
  - Decides if messages go directly to `socket.class.md` or remain queued.  
  - Applies rate-limiter from `rate.class.md`.  
- **`lifecycle.class.md`**:  
  - Ties together `retry.class.md`, `timeout.class.md`, and `machine.class.md` to handle “connecting → connected → disconnecting → disconnected → reconnecting” cycles.

### Dependencies
- **Depends** on all lower layers (0–2) for definitions, socket integration, and machine logic.

---

## 6. Layer 4: External API

```
phase_2/class/interfaces/
└── external.interface.md          # Public API specification
```

### Purpose & Scope

1. **Public-Facing Interface**: The main user entry point (e.g., `connect(url)`, `sendMessage(...)`, `onMessage(...)`, etc.).  
2. **Usage Constraints**: Documents do’s/don’ts for calling these methods (e.g., “You cannot call `sendMessage` when `disconnected`; an error event will occur.”).  
3. **Integration Patterns**: Possibly shows how an app can import or instantiate the “WebSocketClient” class.

### Example Contents

- **Methods**: `connect(url)`, `disconnect()`, `send(data)`, `configure(options)`, etc.  
- **Events**: `onMessage`, `onError`, `onStateChange`.  
- **References**: 
  - Summarizes the internal machine states but only in user-friendly terms like `ConnectionStatus`.

---

## 7. For Each File, We Will Define

1. **Type & Interface Definitions**  
   - List all relevant fields, enums, and method signatures.  
   - Reference **formal specs** with direct citations (e.g., “Event `ERROR` from `machine.md` section 2.2.”).

2. **Relationships**  
   - Dependencies on other files within or below the same layer.  
   - Composition or inheritance patterns.

3. **State & Behavior**  
   - Valid states, transitions, side effects, referencing `machine.md` or `websocket.md`.  
   - Error handling flows, referencing `errors.types.md`.

4. **Design Rules**  
   - Implementation constraints (e.g., “Must not create multiple sockets simultaneously”).  
   - Resource management (e.g., queue capacity, timeouts).  
   - Code-generation or build guidelines if applicable (e.g., “Use `generate.sh` to produce TypeScript stubs from `.md` specs”).

---

## 8. Implementation Strategy

1. **Start at Layer 0**  
   - Create the fundamental type definitions (`common.types.md`, `events.types.md`, etc.).  
   - No external dependencies. Reference the formal specs to ensure coverage of all states and events.

2. **Proceed to Layer 1**  
   - Write out base interfaces/classes (`context.class.md`, `queue.class.md`) that rely on the types.  
   - Still avoid external libs like `xstate`—only if it’s relevant to the raw structures.

3. **Build Layer 2**  
   - Integrate `xstate v5` in `machine.class.md`.  
   - Implement real WebSocket usage in `socket.class.md`.  
   - Add rate-limiting, retry, and timeout logic with direct resource constraints from `machine.md`/`websocket.md`.

4. **Compose at Layer 3**  
   - Orchestrate how these classes talk to each other in real time (`transition.class.md`, `dispatch.class.md`, `lifecycle.class.md`).  
   - This is where the behavior becomes “complete” at the system level.

5. **Finalize External API in Layer 4**  
   - Expose public methods and events.  
   - Provide usage constraints and initialization patterns.

6. **Iterate**  
   - If new insights emerge (e.g., a queue approach changes), revise lower layers.  
   - Maintain references so changes remain consistent with the formal specs and the earlier Container/Component designs.

---

## 9. Concluding Remarks

With this **Layered Class-Level Design**, we:

- Maintain **direct ties** to the formal specs in `machine.md` and `websocket.md` at each level.  
- Ensure **simplicity** by isolating concerns (types vs. base interfaces vs. full implementation vs. orchestration vs. API).  
- Guarantee **completeness** by systematically building from fundamental types up to a robust public interface.  
- Preserve **workability** and **stability** by specifying each file’s constraints, references, and design rules, allowing for consistent changes or expansions later.  

Since we are **still in the design phase**, this plan outlines *what* each file or module will contain and *how* they relate, **not** the final code. The next step is to gradually fill each file with actual definitions, method stubs, and references to your chosen programming language (e.g. TypeScript with `xstate v5` and `ws`). By following these layers, the resulting implementation will be both **rigorous** (faithful to formal specs) and **usable** (well-structured for real-world needs).