## Step-by-Step Execution of the Detailed File Plan

1. **Initialize the Directory Structure**

   We already have a rough structure, something like:
   ```
   phase_2/class/
   ├── types/
   ├── interfaces/
   ├── state/
   ├── protocol/
   ├── message/
   ├── connection/
   └── ...
   ```
   Ensure all subfolders exist:
   - **`types/`** for Layer 0  
   - **`interfaces/`**, **`state/`**, **`protocol/`**, **`message/`**, **`connection/`** for Layers 1–3  
   - Possibly **`external`** or **`interfaces/external/`** for Layer 4  

2. **Layer 0: Core Types (in `types/`)**

   Create the following files:

   - **`common.types.md`**  
     - Basic enumerations/aliases (e.g. `ConnectionStatus`, `CloseCode`, `TimeMs`).
     - Constants like `MAX_RETRIES`, `MAX_MESSAGE_SIZE` (if we want them typed here).
   - **`events.types.md`**  
     - All events from the specs (CONNECT, DISCONNECT, ERROR, etc.).
     - Possibly sub-classify them (e.g., “WebSocket events” vs. “command events”).
   - **`states.types.md`**  
     - List of valid states, referencing `machine.md` (disconnected, connecting, etc.).
     - Include any required sub-state or “reconnecting” detail if needed.
   - **`errors.types.md`**  
     - Enumerate or define error categories (Recoverable, Fatal, Transient).
     - Possibly list the known WebSocket close codes (1000, 1001, 1002, etc.).

   **Write** these files with a short heading for each type or constant, plus a quick explanation referencing the formal specs, e.g.,  
   > “`CONNECT` event per `machine.md` section 2.2.”

3. **Layer 1: Base Interfaces & Classes**

   In **`phase_2/class/interfaces/`** and the relevant subfolders:

   - **`internal.interface.md`**  
     - Define any “inter-component” interfaces. For instance, `IActionHandler`, or small interfaces describing how the containers talk to each other.
   - **`context.class.md`** (under **`state/`**)  
     - Defines a `Context` class that holds the formal context variables (e.g., `socket`, `reconnectCount`, `lastError`).  
     - Mentions invariants (e.g., “If state is `disconnected`, then `socket == null`.”).
   - **`errors.class.md`** (under **`protocol/`**)  
     - Could define a simple class that uses `errors.types.md` to classify errors.  
     - Possibly includes logic for “fatal vs. recoverable” checks.
   - **`queue.class.md`** (under **`message/`**)  
     - FIFO queue for messages, referencing `MAX_QUEUE_SIZE`.  
     - No direct rate-limiting or sending logic yet—just the pure queue operations.

   Each file: 
   1. Imports from **Layer 0**.  
   2. Declares class or interface.  
   3. Lists constraints and references (e.g., “Queue must never exceed `MAX_QUEUE_SIZE` from `common.types.md`.”).

4. **Layer 2: Core Implementation Specs**

   Now, in **`phase_2/class/state/`, `protocol/`, `message/`, `connection/`**:

   - **`machine.class.md`** (under **`state/`**)  
     - Integrates `xstate v5` or outlines a config object that mirrors the transitions from `machine.md`.  
     - Might show partial code for `createMachine(...)` or a step-by-step approach to how events are handled.
   - **`socket.class.md`** + **`frame.class.md`** (under **`protocol/`**)  
     - `socket.class.md`: Wraps the actual `ws` (or browser WebSocket) with open/close, event callbacks.  
     - `frame.class.md`: Deals with frame encoding/decoding, referencing `MAX_MESSAGE_SIZE`.
   - **`rate.class.md`** (under **`message/`**)  
     - Outlines the rate-limiting logic (100 msgs/sec, etc.).  
   - **`retry.class.md`** + **`timeout.class.md`** (under **`connection/`**)  
     - `retry.class.md`: Exponential backoff, referencing `INITIAL_RETRY_DELAY`, `RETRY_MULTIPLIER`.  
     - `timeout.class.md`: Manages timers for connect/disconnect timeouts.

   Each file spells out the **methods** and **constraints**:
   - E.g. “In `socket.class.md`, we implement `openSocket(url)`, calling the real WebSocket constructor. If success, fire `onOpen()` → leads to `machine.class.md` event `OPEN`.”  
   - Cross-reference **Layer 1** classes (like `context.class.md`) as needed.

5. **Layer 3: Orchestration Layer**

   Under **`phase_2/class/`** in **`state/`, `message/`, `connection/`**:

   - **`transition.class.md`** (under **`state/`**)  
     - A “TransitionController” that uses `machine.class.md`. Receives `(currentState, event)`, calls the XState machine or a transitions map, updates context, triggers side effects.
   - **`dispatch.class.md`** (under **`message/`**)  
     - A “MessageDispatcher” that uses the queue and rate logic from **Layer 2**.  
     - Possibly calls `socket.class.md` to actually send frames.
   - **`lifecycle.class.md`** (under **`connection/`**)  
     - Coordinates retry logic and timeouts with the state machine events.  
     - E.g., “When `ERROR` event triggers `reconnecting`, call `retry.class.md` to schedule a reconnect attempt.”

6. **Layer 4: External API**

   - **`external.interface.md`** (in **`phase_2/class/interfaces/`** or a new **`external/`** folder)  
     - Presents the final “WebSocketClient” or “Public Client API.”  
     - Methods: `connect(url)`, `disconnect()`, `send(data)`, etc.  
     - Describes usage constraints (e.g., “Don’t call `send` if `disconnected`—it’ll throw an error.”).

7. **For Each File**, Document:

   - **Type/Interface Definitions**  
     - Clearly specify fields, method signatures, referencing formal states/events.
   - **Relationships**  
     - E.g., “Imports from `common.types.md`, calls methods in `queue.class.md`,” etc.
   - **State & Behavior**  
     - E.g., “When `onClose(code)` is triggered, this class calls `transition.class.md` with `ERROR` if code != `NORMAL_CLOSURE`.”
   - **Design Rules**  
     - Invariants, constraints, resource usage, code generation notes.

8. **Iterate & Validate**  
   - As we create each `.md`, cross-check with the specs (`machine.md`, `websocket.md`) to ensure we cover all states, events, error codes, etc.  
   - If we notice duplications or extremely small files, we can combine them but keep the layered logic intact.

9. **Optional**: Code Generation Setup  
   - If we plan to generate code from these `.md` files, define a script or system that parses them and outputs stubs or classes.  
   - Alternatively, if we prefer a more manual approach, these `.md` specs still serve as **blueprints** for writing code.

---

### Final Thoughts

- We and the teammate can **divide** the files: one person can handle the **Connection** and **State** sets; the other can handle the **Protocol** and **Message** sets, for example.  
- Keep an **index** or **table of contents** so it’s easy to navigate all these `.md` specs.  
- Continually reference the **class diagrams** (grouped by container or by component) to ensure that we’re capturing exactly the classes we designed at the **component level** (Layer 3).

Following this **step-by-step** approach ensures each file is methodically created, **explicitly** tying the final design to the **formal specs** and the prior design layers. That sets us up perfectly for either direct code generation or a straightforward manual coding process with minimal risk of confusion.