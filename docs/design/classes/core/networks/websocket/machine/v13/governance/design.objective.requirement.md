# Objective and Requirements

The two files, `machine.md` and `websocket.md`, contain the formal specifications. They are independent of the design process and focus only on the **what**, whereas the design process determines the **how**.

Formal notation is simply a precise tool to express the key concepts, relationships, and structures uncovered during the design process.

## Requirement

### Simplicity

We are not looking for an "optimal" design. Instead, we aim for a design that is as simple as possible.

In an “optimal” design, one attempts to maximize the system’s functionalities, but this leads to an endless process: given any design, more functionality can always be added. 

To keep the design process feasible, we adopt a principle of **minimizing** functionalities. This principle is critical and lies at the heart of our design approach.

### Completeness

Completeness means covering all the formal specifications in `machine.md` and `websocket.md`.

### Workability

While simplicity and completeness are important, they are not sufficient by themselves. The design must also be **workable**—that is, it must include the minimal additional features needed to function in a real environment, such as configuration, error handling, logging, or caching. The decision of which features to include is purely a design choice, guided by the principle of simplicity.

## Goal

### Objective

The objective of the design is to guide and govern the source code generation process. The generated code should meet two criteria:

1. **Consistency**: The source code generation results should be consistent across different implementors.
2. **Automaticity**: At the class level, the source code generation should be nearly automatic.

### Nature

A design should:

1. Identify key concepts.  
2. Identify key groupings (avoiding the term “component” here, to prevent confusion with the C4 usage).  
3. Identify logical relationships among the concepts in steps 1 and 2.  
4. Based on steps 1–3, develop the architecture of the solution.  
5. Provide sufficient detail at the class layer, as most of the design work must be reflected there.

The identification process is driven by:
1. The formal specs in `machine.md` and `websocket.md`.
2. The interfaces provided by the `ws` package and **xstate v5**.

### Framework

#### The C4 Framework

Because the design process is central to implementation—being both structural and detail-oriented—we use a framework to break complex problems into manageable steps. We adopt the C4 design framework down to the class level, following a top-down approach.

#### DSL

The interfaces defined at each layer are referred to as the **DSL**.

## Tools

We use `ws` as the WebSocket protocol implementation tool and **xstate v5** (specifically version 5) for the state machine implementation. We do **not** design or modify these packages; we only use them. This point is critical.

Part of our design effort includes specifying how the DSL relates to the interfaces from `ws` and **xstate v5**.

## Outline

1. **Phase 1**:  
   Lay out the design outline by identifying and specifying the inputs and outputs of each layer. Associate these inputs and outputs with the formal definitions or the interfaces provided by `ws` or **xstate v5**.

2. **Phase 2**:  
   Follow the outline step by step from the top to the bottom of the C4 layers. As needed, go from bottom to top in an iterative, “round-trip” process. There may be several such iterations in the design process.

---