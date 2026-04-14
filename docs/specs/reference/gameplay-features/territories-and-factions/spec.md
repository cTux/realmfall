# Territories And Factions

## Scope

This spec covers generated faction territories plus player land-claim behavior.

## Current Behavior

- The world can generate deterministic faction territories away from the origin.
- Faction territories claim groups of connected hexes.
- Territory borders render as one continuous outline even when some same-owner neighboring tiles are outside the current visible tile slice.
- Faction tiles may include a town, camp, forge, workshop, and a non-hostile NPC occupant.
- The player can claim eligible empty passable tiles.
- Claims must connect to the existing player territory after the first claim.
- Claims cannot be placed next to foreign claims.
- Claiming consumes banner materials from inventory.

## Main Implementation Areas

- `src/game/territories.ts`
- `src/game/state.ts`
- `src/ui/world/renderScene.ts`
