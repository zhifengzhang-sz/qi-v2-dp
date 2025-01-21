Below is a **Phase 1 Design Outline** that **unifies** both formal specs—  
- **`machine.md`** (“WebSocket Client” spec)  
- **`websocket.md`** (“WebSocket Protocol State Machine” extension)  

—and lays out, at a high level, the structure (the *what*) needed to cover *all* requirements. We follow a C4-inspired approach, focusing on:

1. **System Context** (Level 1)  
2. **Containers** (Level 2)  
3. **Components** (Level 3)  
4. **High-Level DSL** (Level 4, but only as a placeholder—detailed classes/interfaces come later)

The result is an outline that shows how both specs combine into a single design, leaving actual low-level *how* details for Phase 2.

---

## 1. System Context (C4 Level 1)

### 1.1 Purpose

We have two formal specifications:

1. **`machine.md`**: Defines a **“WebSocket Client system”** as a 7-tuple \((S, E, \delta, s_0, C, \gamma, F)\), describing states, events, context, transitions, invariants, etc.  
2. **`websocket.md`**: Extends the core “WebSocket Client” state machine with **WebSocket protocol** details (close codes, message queue, error classification, etc.).

Combined, they form a **complete specification** for a robust WebSocket Client. The design must:

- Use **`xstate v5`** for the state machine itself (since both specs revolve around states & transitions).
- Potentially use **`ws`** or a similar library for the actual WebSocket transport.  
- Satisfy the **invariants**, **timing constraints**, and **safety/liveness** properties from *both* specs.

**Key top-level goal**: Build a minimal-yet-complete design so that code generation is consistent, repeatable, and captures all formal aspects (state transitions, error handling, queueing, rate-limiting, timeouts, close codes, etc.).

### 1.2 External Actors / Dependencies

1. **External WebSocket Servers**:  
   - Our client must connect/disconnect, handle server-sent messages and close codes, etc.
2. **`xstate v5`**:  
   - The library we use to represent states \(S\), transitions \(\delta\), actions \(\gamma\), context \(C\).
3. **`ws`** (or similar) for transport**:  
   - Under the hood, we might rely on a Node or browser WebSocket object. The formal specs treat this transport as `socket`.
4. **Timers** (system-level) for timeouts & scheduling**:  
   - We must handle `CONNECT_TIMEOUT`, `DISCONNECT_TIMEOUT`, backoff delays, etc.

### 1.3 High-Level Responsibilities

- **Core State Management**:  
  - Implement the states (`disconnected`, `connecting`, `connected`, etc.) and transitions from both specs.
- **Protocol Extensions**:  
  - Incorporate additional WebSocket protocol details (close codes, queueing, error codes, etc.) from `websocket.md`.
- **Context & Constraints**:  
  - Track and update context (URL, retry counts, queue, timing info) while enforcing constraints (`MAX_RETRIES`, `MAX_QUEUE_SIZE`, `WINDOW_SIZE`, etc.).
- **I/O with Real Transport**:  
  - Translate actual socket events (`onOpen`, `onMessage`, `onError`, `onClose`) into the formal events in the machine (`OPEN`, `MESSAGE`, `ERROR`, `CLOSE`).  
  - Perform real send/close operations as side effects of actions (`sendMessage`, `initDisconnect`, etc.).

---

## 2. Container Diagram (C4 Level 2)

We can view the **WebSocket Client** as one major container that has sub-containers (or modules) to separate concerns:

1. **State Machine Container**  
   - Holds the unified machine logic from both `machine.md` (core) and `websocket.md` (protocol specifics).  
   - Responsible for transitions, context, invariants, and actions.

2. **Transport / Connection Container**  
   - Abstracts the real WebSocket object (from `ws` or the browser).  
   - Emits events to the machine (e.g., `open`, `close`, `error`, `message`).  
   - Listens to machine requests to send data or close the socket.

3. **Auxiliary Services** (optional or embedded)  
   - **Timer / Scheduler**: for backoff, timeouts, stability checks.  
   - **Queue Management**: for storing outgoing messages if not connected.  
   - **Rate Limiting**: if needed (the specs mention `MAX_MESSAGES` in a `WINDOW_SIZE`, from `machine.md`).

*(In a minimal design, some of these could be combined.)*

---

## 3. Component-Level Inputs/Outputs (C4 Level 3)

### 3.1 State Machine Components

1. **Unified State Machine Definition**  
   - **Inputs**:  
     - “External” events from the Transport Container (`open`, `message`, `close`, `error`)  
     - “Internal” or “command” events (e.g. `CONNECT`, `DISCONNECT`, `SEND`, `RETRY`).  
     - Timer or scheduler events (e.g., a delayed `RETRY` event).  
   - **Outputs**:  
     - Actions that modify the context (like `gamma_{store}`, `gamma_{retry}`, etc.).  
     - Possibly new events or callbacks to trigger in the Transport Container (e.g., “actually call `socket.send(...)`”).

2. **Context Manager**  
   - **Inputs**:  
     - The context structure from `machine.md` plus the extended fields in `websocket.md` (like `closeCode`, `lastError`, `reconnectCount`, `queue`, etc.).  
     - Actions that update context: `storeUrl`, `initDisconnect`, `completeDisconnect`, etc.  
   - **Outputs**:  
     - Updated context that must always satisfy the invariants (socket must be null in `disconnected`, `socket != null` in `connecting`, etc.).

3. **Actions Implementation** (the \(\gamma\) set)  
   - **Inputs**:  
     - Current context + an event.  
   - **Outputs**:  
     - Possibly updated context, or side effects (socket operations, logs, queue operations).  
   - **Reference**:  
     - In `machine.md`: `handleError`, `sendMessage`, `processMessage`...  
     - In `websocket.md`: `gamma_{store}`, `gamma_{connect}`, `gamma_{retry}`, `gamma_{stabilizeReconnection}`, etc.  
   - These must unify so that we have *one consistent set* of actions implementing all required transformations.

### 3.2 Transport / Connection Components

1. **WebSocket Adapter**  
   - **Inputs**:  
     - Real WebSocket events (onOpen, onClose, onMessage, onError).  
     - Commands from the State Machine to connect, disconnect, or send messages.  
   - **Outputs**:  
     - The corresponding machine events: `OPEN`, `CLOSE`, `ERROR`, `MESSAGE`, etc.  
     - Actual network I/O calls to create a socket, close it, or send data.

2. **Retry / Timer Service**  
   - **Inputs**:  
     - Requests from the state machine: e.g. “Wait `delay_n` ms and then dispatch `RETRY`.”  
   - **Outputs**:  
     - After the delay, triggers the `RETRY` event into the machine.  
   - **Constraints**:  
     - Follows the exponential backoff formula from both specs (`INITIAL_RETRY_DELAY * RETRY_MULTIPLIER^n`, etc.).  
     - Must keep track of `MAX_RETRIES` to eventually give up if needed.

3. **Queue / Rate Limiter** (if needed)  
   - **Inputs**:  
     - Outgoing messages when the socket is not in `connected` or `reconnected` state.  
   - **Outputs**:  
     - Once in `connected` state, flush messages from queue.  
   - **Constraints**:  
     - Must enforce `MAX_QUEUE_SIZE`, ordering, and rate-limiting (`MAX_MESSAGES` in `WINDOW_SIZE`).

### 3.3 Auxiliary Components (Optional / Merged)

- **Configuration Loader**  
  - Pulls from environment variables or a config file (e.g. `WS_MAX_RETRIES`, `WS_CONNECT_TIMEOUT`).  
  - Populates the machine’s context or references for `maxRetries`, `timeouts`, etc.
- **Logging & Monitoring**  
  - React to machine events or transitions to log errors, state changes, close codes.

---

## 4. Class-Level DSL Overview (C4 Level 4 – Placeholder)

At this phase, we only outline the potential **interfaces/classes** that will eventually appear in the code. The design’s final step (Phase 2 and beyond) is to fill in these with actual members, methods, etc.

1. **`IWebSocketMachine`** (the unified state machine interface)
   - Might have methods like:
     - `send(event: MachineEvent)`
     - `subscribe(listener: (state) => void)`
     - `getContext(): Context`
   - Under the hood, this is **one** XState machine that merges the sets of states, events, and actions from *both* `machine.md` and `websocket.md`.

2. **`IWebSocketAdapter`** (transport abstraction)
   - Could be a wrapper for `ws` or the browser `WebSocket`.
   - Exposes methods like:
     - `connect(url: string, protocols?: string[])`
     - `close(code?: number, reason?: string)`
     - `send(data: unknown)`
   - Exposes events/callbacks that map to the state machine events.

3. **Actions** (e.g., `gamma_store`, `gamma_retry`, `gamma_send`, etc.)  
   - Each action in the specs can be implemented as a discrete function or method.  
   - Examples:
     - `function storeUrl(context, event) { ... }`
     - `function retry(context) { ... }`
     - `function sendMessage(context, event) { ... }`
   - These can either be direct code or embedded in XState “actions.”

4. **Optional**:  
   - `QueueManager` / `RateLimiter` classes.  
   - `TimerService` or `Scheduler` class that generalizes delay-based events.

---

## 5. Iteration Notes (Top-Down & Bottom-Up)

- **Top-Down**:  
  1. We know from `machine.md` + `websocket.md` that we need states, events, context, transitions, queueing, retry logic, etc.  
  2. We define the main container (State Machine) and subcontainers (Transport, Timers, etc.).
- **Bottom-Up**:  
  1. As we implement each action or each event, we must revisit constraints (e.g. `MAX_QUEUE_SIZE`, close codes, invariants about `socket=null` in certain states).  
  2. Might discover additional utility code is needed (like “cleanup socket,” “flush queue,” etc.) and incorporate it back into the container design.

---

## 6. Next Steps (Toward Phase 2)

1. **Combine Transition Tables**:  
   - The specs partly overlap: states `disconnected`, `connecting`, etc. appear in both `machine.md` and `websocket.md`.  
   - We must unify them carefully in an XState config. For example, `machine.md` might define transitions for `ERROR`, while `websocket.md` defines transitions for a `close` code or event. Ensure they do *not* conflict.
2. **Define the Merged Context**:  
   - Combine the base context `C` from `machine.md` with the extended fields from `websocket.md` (`closeCode`, `lastError`, etc.).
3. **Map the Combined Actions**:  
   - Merge the two sets of actions from each spec into *one* set (some are identical in function, but differently named).  
   - For instance, `machine.md` has `handleError`; `websocket.md` references `gamma_{error}`. Possibly unify them under the same function.
4. **Check All Constraints**:  
   - The final machine must enforce all constraints (timing, queue size, rate limit, close codes, etc.).  
   - If any spec property is optional or conflicts, we decide how to reconcile it, in the simplest manner that still meets “completeness.”
5. **Produce Detailed Class and Sequence Diagrams** (in Phase 2):  
   - Show how the real WebSocket events flow into the machine, how the machine transitions, how it triggers queue operations, etc.  
   - Each action method and transition guard should be spelled out.

---

## Summary

This **Phase 1** outline merges **`machine.md`** and **`websocket.md`** into a single design approach:

- **System Context**: We are building a single WebSocket Client that must satisfy all the states, transitions, and constraints from both specs.  
- **Containers**:  
  - **State Machine**: Unified XState definition that references all states/events/actions.  
  - **Transport**: Abstract real socket calls + map them to/from the machine events.  
  - **Support**: Timer scheduling for retries/timeouts, queue & rate limit logic, etc.  
- **Components**:  
  - The machine’s internal structure (transitions, context management, action implementations).  
  - The adapter for actual WebSocket connections.  
- **DSL / Class Overview**:  
  - Will revolve around an XState-based machine plus a simple transport adapter.  
  - Additional classes for queue, timer, error handling as needed.  

It addresses **simplicity** (only the components strictly needed for the specs), **completeness** (covers all states, transitions, constraints), and **workability** (allows for minimal logging, error-handling, config, etc. without unnecessary complexity).

From here, **Phase 2** will dive deeper: reconciling the combined transitions in code, specifying each action in detail, and iterating until all formal invariants (timing, queue, constraints, liveness) are clearly enforced in the design.