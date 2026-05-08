# Territories And Factions

## Scope

This spec covers generated faction territories plus player land-claim behavior.

## Current Behavior

- The world can generate deterministic faction territories away from the origin.
- Faction territories claim groups of connected hexes.
- Territory borders render as one continuous outline even when some same-owner neighboring tiles are outside the current visible tile slice.
- Faction tiles may include a town, camp, forge, workshop, and a non-hostile NPC occupant.
- Faction NPC hexes let the player spend `1` gold to restore HP to maximum and clear debuffs except hunger and thirst.
- The player can claim up to 5 eligible empty passable tiles.
- Claims after the first claim must connect to the existing player territory.
- Claims cannot be placed next to foreign claims.
- Player claims can be removed only when the remaining player-owned claimed hexes stay as a single connected territory, or no claimed territory remains.
- Claiming consumes banner materials from inventory.
- Eligible player-claimed surface hexes now expose `Build outpost` in hex info when the tile is empty and the player can afford at least one build.
- The first outpost build is `Watchtower`, which costs `3 Logs`, `2 Stone`, and `1 Cloth`.
- The second outpost build is `Mana Anchor`, which costs `4 Stone`, `2 Cloth`, and `1 Arcane Dust`.
- Building a watchtower writes the structure onto the claimed tile and currently blocks unclaiming that hex.
- Building a mana anchor writes the structure onto the claimed tile, binds that hex as the primary return point, and also blocks unclaiming that hex.
- Building a new mana anchor removes the previous bound mana-anchor structure and rebinds return behavior to the new claimed hex.
- While the player stands on or adjacent to a player-built watchtower, local scouting range expands and farther visible threats can be selected or routed to through the normal map interactions.
- Home scroll returns and defeat respawns now prefer the active mana anchor and fall back to `homeHex` when no valid mana anchor is bound.
- The hex info window surfaces claim and unclaim from the title-bar action row, and claim hover copy names the banner cost instead of rendering that requirement as body text.
- The hex info window uses the title-bar action row plus an inline body picker for outpost construction instead of opening a separate window.

## Main Implementation Areas

- `src/game/gameStateTypes.ts`
- `src/game/territories.ts`
- `src/game/state.ts`
- `src/game/stateClaims.ts`
- `src/game/stateOutposts.ts`
- `src/game/stateSurvival.ts`
- `src/game/stateWorldActions.ts`
- `src/app/normalizeGameState.ts`
- `src/app/App/hooks/useHexGameplayView.ts`
- `src/app/App/components/appDeferredWindows/hexInfoDeferredWindow.tsx`
- `src/ui/components/HexInfoWindow/HexInfoWindow.tsx`
- `src/ui/world/renderScene.ts`
