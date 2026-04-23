# Deterministic World Generation

## Scope

This spec covers the seeded generation model used for terrain, structures, enemies, loot, and faction placement.

## Current Solution

- The world is generated deterministically from a seed combined with coordinates and scoped sub-seeds.
- Terrain, structures, loot, factions, and many event outcomes rely on deterministic noise or seeded RNG helpers.
- Terrain generation samples several low-frequency deterministic biome fields, then maps those climate signals into clustered terrain families and transition terrains instead of picking terrain from a single independent roll per hex.
- This keeps the world reproducible across sessions and compatible with persisted saves.
- The origin and immediate neighbor hexes are explicitly cached as safe plains tiles.
- This prevents the initial spawn from producing blocked or hostile world states.
- The early exploration ring softens blocked or highly corrupted biome results into safer transition terrain so the opening movement space stays navigable even when the broader biome field trends harsh.
- Terrain and coordinate context are converted into progression tier data that influences enemies, loot, and generated equipment.
- `src/game/world.ts` remains the public facade for tile reads and callers, while deterministic tile assembly lives in `src/game/worldTileGeneration.ts` and generated-equipment or consumable factories live in `src/game/worldGeneratedItems.ts`.
- Structure and enemy terrain appearance tables can stay keyed to their existing biome families because new transition terrains resolve through shared terrain metadata back to the closest content spawn family.
- Dungeons and blood moon systems layer additional scaling on top of the base tier model.

## Main Implementation Areas

- `src/game/world.ts`
- `src/game/worldTileGeneration.ts`
- `src/game/worldGeneratedItems.ts`
- `src/game/shared.ts`
- `src/game/random.ts`
- `src/game/territories.ts`
