# Combat System Implementation

## Scope

This spec covers the internal combat data structures and event-driven enemy stat mutation behavior.

## Current Solution

- Combat uses per-actor state objects that track abilities, cooldowns, effective cooldown adjustments, global cooldown, and optional casting state.
- Player and enemy combat actor states are normalized during save hydration to support old save shapes.
- Ability definitions live in a registry keyed by stable ability ids.
- The current implementation intentionally keeps the runtime surface small, with `kick` as the shipped baseline ability.
- Blood moon stat scaling is applied by synchronizing enemy state against stored base stats rather than permanently overwriting them.
- This lets event state turn on and off without losing the underlying baseline values.

## Main Implementation Areas

- `src/game/combat.ts`
- `src/game/state.ts`
- `src/app/normalize.ts`
