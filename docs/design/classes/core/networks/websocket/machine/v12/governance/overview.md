
1. `guidelines.md` serves as the entry point:
- Defines file hierarchy and dependencies
- References `machine.md` for formal foundation
- Points to `design.process.outline.md` for C4 model
- Points to `design.validation.procedure.md` for validation
- Points to `governance.md` for rules

2. `design.process.outline.md` defines C4 structure:
- References `machine.md` for formal basis $(S, E, \delta, s_0, C, \gamma, F)$
- Uses level definitions that `governance.md` enforces
- Provides process model that `design.validation.procedure.md` validates

3. `design.validation.procedure.md`:
- Implements Section 7 of `guidelines.md`
- Uses C4 levels from `design.process.outline.md`
- Follows rules from `governance.md`

4. `governance.md`:
- Enforces C4 structure from `design.process.outline.md`
- Implements principles from `guidelines.md`
- Uses validation framework from `design.validation.procedure.md`
