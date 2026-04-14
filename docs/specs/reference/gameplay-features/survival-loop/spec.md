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
- Current recovery behavior includes survival restoration logic, home handling, and timed status effects.
- `recentDeath` reduces max HP.
- `restoration` recovers HP and mana over time until it expires.
- The player has a dedicated home hex state.
- Setting home sanitizes the tile so it remains safe.
- Home scroll usage teleports the player to the home hex.
- Nearby world rules prevent hostile or conflicting territory states from remaining on the home tile.

## Main Implementation Areas

- `src/game/state.ts`
- `src/game/progression.ts`
- `src/ui/statusEffects.ts`
