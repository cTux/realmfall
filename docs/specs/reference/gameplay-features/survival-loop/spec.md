# Survival Loop

## Scope

This spec covers hunger, thirst, death recovery, home behavior, and player status effects that shape the core survival cycle.

## Current Behavior

- Movement advances the survival loop and can reduce player survivability.
- Hunger and thirst affect combat performance through player stat calculations.
- Low hunger reduces effective combat output.
- Low thirst reduces effective attack speed.
- If the player dies, the run does not hard reset immediately.
- The player is respawned at the nearest town or protected home flow.
- Current recovery behavior includes passive out-of-combat regeneration, home handling, and timed status effects.
- `recentDeath` reduces max HP.
- While not in an active battle, the player regenerates `1%` of max HP and `1%` of max MP each second.
- Death recovery does not grant a separate `restoration` buff.
- The player has a dedicated home hex state.
- Setting home is allowed only on an empty hex, keeping the respawn point free of items, structures, and enemies.
- Home scroll usage teleports the player to the home hex.
- Nearby world rules prevent hostile or conflicting territory states from remaining on the home tile.

## Main Implementation Areas

- `src/game/state.ts`
- `src/game/stateSurvival.ts`
- `src/game/stateWorldActions.ts`
- `src/game/progression.ts`
- `src/ui/statusEffects.ts`
