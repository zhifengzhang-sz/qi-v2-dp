# Objective and Requirements

The two files, `machine.md` and `websocket.md`, contain the formal specifications. They are independent from design and used by the design process. They focuses only on "what", while the design process is the key on "how".

Formal notation is simply a precise tool to express the key concepts, relationships and structures uncovered during the design process.

## Requirement

### Simplicity

We are not looking for "optimal" design. Instead, we are looking for design that is as simple as possible.

In the optimal design, one maximizes the functionalities of the system, this is proved to be an endless process, as given a design, one can always find more functionality to add on.

To make the design process feasible, we adapt the minimization of the functionalities. This is critical, and is the heart of the design principle.

### Completeness

The completeness is to cover all the formal specs.

### Workability

Simplicity and completeness are not enough to make a good design, we need to add workability. To make a design work, we need to add features, for example, configuration, error handling, logging and caching, etc. What features should be added is a pure design decision, and the simplicity principle comes in as the critical judgement.

## Goal

### Objective

The objective of the design is to guide and govern the source code generation process. Such code generation should have the following properties:

1. consistency: the source code generation result should be consistent across different implementors.
2. aromaticity: in the class level, the source code generation should be close to be automatic.

### Nature

A design is to

1. identify key concepts
2. identify key grouping (i am not using component here so that we don't confuse with component in c4)
3. identify logical relations among all the concepts in 1 & 2
4. based on 1-3, design the architecture of the solution
5. the class layer should consume most of the design work and must be detailed oriented.

The source of the identification process are
1. The formal specs: `machine.md` and `websocket.md`
2. The interfaces from package `ws` and `xstate v5`.

### Framework

#### The C4 framework

Since the design process is the heart of the implementation process, it is structural and detailed oriented. To handle such complicated process, we need framework to transfer complicated problems into sequence of simple problems to solve. The framework adapted is the C4 design framework down to the class level. Notice that this is the top-down approach framework.

#### DSL

The interfaces defined in each layer are called DSL.

## Tools

We are using `ws` as websocket protocol implementation tool, using `xstate v5` (must be version 5) for state machine implementation. we are not design either package, we are the user of them, this is critical.

Part of the design efforts should be specifying the relationship between DSL and the interfaces provided by these two packages.


## Outline

1. Phase 1: Layout the design outline: identifying and specifying the inputs and the outputs of each layer. Associating the inputs and outputs with formal definitions or the interfaces provided by `ws` or `xstate v5`.
2. Phase 2: Follow the outline step by step by step from top to bottom of the C4 layers, often we need to go from bottom to top, we call such round trip process an iteration. There are might be several such iterations in the design process.
