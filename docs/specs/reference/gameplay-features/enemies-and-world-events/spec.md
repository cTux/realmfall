# Enemies And World Events

## Scope

This spec covers enemy generation plus the blood moon, harvest moon, and earthshake event loops.

## Current Behavior

- Enemy spawns are deterministic from world seed, terrain, coordinate, and structure context.
- Dungeon enemies are elite by default and scale above regular terrain threats.
- Faction NPCs use non-hostile territory-specific enemy identities so they can participate in the same world systems without behaving like ordinary hostiles.
- Blood moon checks occur during the rise window at night.
- When active, nearby enemies spawn in clusters around the player except on blocked tiles.
- Blood moon scales enemy stats upward.
- Blood moon increases combat danger and improves loot outcomes.
- Harvest moon is an alternate night event.
- It spawns gathering structures around the player on eligible empty passable tiles.
- Spawned resources remain part of the regular gathering loop after appearing.
- Earthshake is a day-cycle event that can open a nearby dungeon.
- Dungeon opening searches for a valid passable empty tile close to the player.
- Forced earthshake triggering is supported for admin-style or debug flows already wired in state logic.

## Main Implementation Areas

- `src/game/state.ts`
- `src/game/combat.ts`
- `src/game/world.ts`
- `src/game/territories.ts`
