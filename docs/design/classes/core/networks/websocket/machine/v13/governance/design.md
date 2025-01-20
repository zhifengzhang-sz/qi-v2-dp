# Design Fundamentals

## 1. Nature of Design
- Design discovers and expresses solution structure
- Design is source of truth for code generation
- Code must strictly follow design, not vice versa
- Design uses formal notation for clear expression

## 2. Design Objective 
Minimize solution complexity subject to:
- Complete coverage of formal spec concepts
- Workable implementation with given tools (ws, XState v5)

## 3. Completeness Requirement
- Every concept defined in formal spec must be mapped
- Missing any formal concept is invalid (null set)
- This sets the baseline for minimum solution

## 4. Supporting Features Challenge
- Real implementations need supporting features (config, error handling, etc.)
- These features are:
  - Necessary for workability
  - Unbounded in potential scope
  - Each adds complexity
  - Could always add more
- Must carefully balance workability vs complexity

## 5. Design Process
- Start with formal spec as baseline
- Map every formal concept completely
- Add minimum supporting features needed for workability
- Stop when solution is workable
- Resist adding "one more thing"

## 6. Quality Focus
- Simple = Minimal WORKABLE solution
- Not about maximum features or optimization
- Not about clever solutions
- Just complete formal concept mapping + minimum needed for workability

## 7. Tool Usage
- We use tools (ws, XState v5), not design them
- Design must work within tool capabilities 
- Design maps formal concepts to tool implementations
- No reinvention of tool functionality