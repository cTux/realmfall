# Territories And Factions

## Scope

This spec covers generated faction territories plus player land-claim behavior.

## Current Behavior

- The world can generate deterministic faction territories away from the origin.
- Faction territories claim groups of connected hexes.
- Territory borders render as one continuous outline even when some same-owner neighboring tiles are outside the current visible tile slice.
- Faction tiles may include a town, camp, forge, workshop, and a non-hostile NPC occupant.
- The player can claim up to 5 eligible empty passable tiles.
- Claims after the first claim must connect to the existing player territory.
- Claims cannot be placed next to foreign claims.
- Player claims can be removed only when the remaining player-owned claimed hexes stay as a single connected territory, or no claimed territory remains.
- Claiming consumes banner materials from inventory.
- The hex info window surfaces claim and unclaim from the title-bar action row, and claim hover copy names the banner cost instead of rendering that requirement as body text.

## Main Implementation Areas

- `src/game/territories.ts`
- `src/game/state.ts`
- `src/game/stateClaims.ts`
- `src/game/stateWorldActions.ts`
- `src/ui/world/renderScene.ts`
