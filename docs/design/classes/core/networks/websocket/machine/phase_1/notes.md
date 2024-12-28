### `actions.ts`

#### Formal definition

1. Actions ($\gamma$) defined as:
   $\gamma : C\times E → C$

   - Actions transform context based on state
   - Actions require state information
   - Actions follow state transitions

2. Transition Function ($\delta$):
   $\delta: S\times E\rightarrow S\times\Gamma$
   - Maps state and event to new state and actions
   - Actions tied to transitions

#### Requirements

1. Actions need:
   - Current state information
   - Target state information
   - State validation
   - State metadata

2. Dependencies:
   `actions.ts` must import:
   - `states.ts` [L3]
   - `transitions.ts` [L3]