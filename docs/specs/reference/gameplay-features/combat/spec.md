# Combat

## Scope

This spec covers encounter activation, actor timing, and combat resolution.

## Current Behavior

- Entering a tile with hostile enemies opens a combat state.
- Combat must be started explicitly from the combat window.
- While combat is active, regular travel is blocked.
- Combat uses actor state for the player and each enemy.
- Every actor has a global cooldown.
- Current baseline global cooldown is `1500ms`.
- Current implemented default ability list is limited to `kick`.
- Actors track cooldowns, cast state, and effective cooldown values.
- Combat progresses through repeated state resolution.
- Winning combat removes enemies from the tile and can leave loot behind.
- Combat end clears the encounter state and logs the outcome.

## Main Implementation Areas

- `src/game/state.ts`
- `src/game/combat.ts`
- `src/ui/components/CombatWindow/CombatWindowContent.tsx`
