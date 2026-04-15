# World Exploration

## Scope

This spec covers deterministic hex-world traversal, visibility, and safe-path travel.

## Current Behavior

- The game world is a deterministic hex grid generated from a seed.
- The player starts at `(0, 0)` on a safe plains tile.
- Terrain currently includes `plains`, `forest`, `swamp`, `desert`, `mountain`, and `rift`.
- `mountain` and `rift` tiles are not passable.
- The player sees a revealed radius around the current position.
- Visible tiles are rendered around the player and update as movement changes the origin.
- Home hex, claims, loot, hostile enemies, structures, and safe-path highlights are surfaced through the world view.
- Claim borders remain visible above home, hover, loot, selection, and safe-path overlays so highlight effects do not cover territory edges.
- Manual movement is one adjacent hex at a time.
- A safe-path move can route to a visible destination when a path exists.
- Safe-path routing avoids impassable terrain and hostile occupied intermediate tiles, but it may still end on a visible hostile destination so long-range travel can start combat there without stepping through danger first.
- Movement is blocked while combat is active or when the run is over.

## Main Implementation Areas

- `src/game/state.ts`
- `src/game/world.ts`
- `src/game/hex.ts`
- `src/ui/world/renderScene.ts`
- `src/app/App/usePixiWorld.ts`
