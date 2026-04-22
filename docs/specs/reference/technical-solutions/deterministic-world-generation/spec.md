# Deterministic World Generation

## Scope

This spec covers the seeded generation model used for terrain, structures, enemies, loot, and faction placement.

## Current Solution

- The world is generated deterministically from a seed combined with coordinates and scoped sub-seeds.
- Terrain, structures, loot, factions, and many event outcomes rely on deterministic noise or seeded RNG helpers.
- Terrain now resolves from shared smooth biome fields instead of one independent random roll per hex, so regions form coherent batches of related terrain with softer transitions between neighboring biomes.
- The biome field blends deterministic noise with directional climate drift and contrast shaping, which lets the radius-limited world express larger forest, tundra, wetland, desert, badlands, and upland regions in a single seed without returning to tile-by-tile randomness.
- Terrain classification covers `plains`, `forest`, `tundra`, `highlands`, `badlands`, `swamp`, `desert`, `mountain`, and `rift`, and those biome ids feed the same deterministic content selection paths for structures, enemies, loot tiering, territory checks, and world-boss placement.
- This keeps the world reproducible across sessions and compatible with persisted saves.
- The origin and immediate neighbor hexes are explicitly cached as safe plains tiles.
- This prevents the initial spawn from producing blocked or hostile world states.
- Terrain and coordinate context are converted into progression tier data that influences enemies, loot, and generated equipment.
- Dungeons and blood moon systems layer additional scaling on top of the base tier model.

## Main Implementation Areas

- `src/game/world.ts`
- `src/game/shared.ts`
- `src/game/random.ts`
- `src/game/territories.ts`
