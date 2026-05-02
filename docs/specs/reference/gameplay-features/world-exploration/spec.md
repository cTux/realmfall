# World Exploration

## Scope

This spec covers deterministic hex-world traversal, visibility, and safe-path travel.

## Current Behavior

- The game world is a deterministic hex grid generated from a seed.
- The player starts at `(0, 0)` on a safe plains tile.
- Terrain includes `plains`, `meadow`, `steppe`, `grove`, `forest`, `marsh`, `swamp`, `dunes`, `desert`, `badlands`, `highlands`, `mountain`, `blasted`, and `rift`.
- Terrain is generated in deterministic biome clusters with smoother transitions between neighboring hexes instead of independent per-tile random terrain rolls.
- `mountain` and `rift` tiles are not passable.
- The player sees a revealed radius around the current position.
- Visible tiles are rendered around the player and update as movement changes the origin.
- The world map supports pointer-wheel zoom plus click-and-drag camera panning, and zoom anchors around the pointer position instead of snapping toward screen center.
- World map camera scale and pan offsets persist in the dedicated world-map settings save area, hydrate before the Pixi world becomes interactive, and can be reset independently from the other saved settings areas.
- Home hex, claims, loot, hostile enemies, structures, and safe-path highlights are surfaced through the world view.
- Faction-owned town tiles use a distinct castle marker, while faction NPC claim markers continue using their separate village-style icon.
- The player marker stays visually clean on the current hex, with structure, enemy, and NPC claim marker icons suppressed on that same tile instead of stacking underneath the player icon.
- Claim borders remain visible above home, hover, loot, selection, and safe-path overlays so highlight effects do not cover territory edges.
- Manual movement is one adjacent hex at a time.
- A safe-path move can route to a visible destination when a path exists.
- Unrevealed distant world-map hexes do not trigger movement, tooltip, or pathfinding work until they fall inside the revealed travel radius.
- Missing visible frontier hexes appear immediately as unknown placeholders, cannot be entered or pathfound through until resolved, and each successful movement step starts a real-time `1000 ms` movement cooldown before the next approved step.
- Each approved movement step updates the player position immediately in state, then runs a `1000 ms` world-slide animation that moves the map behind the player while outgoing edge hexes fade away, newly visible edge hexes slide into view from the new origin, both transition edge sets keep their correct fog-of-war treatment, and world markers stay anchored to their own hex instead of jumping when the transition adds, removes, or re-exposes matching icons.
- Pixi preloads the current viewport plus the next movement ring's terrain and marker icon assets so enemy, structure, and loot icons do not flash in mid-transition when the player moves again before the full background icon catalog finishes warming.
- Safe-path travel auto-continues one resolved hex at a time across cooldown windows and does not advance `worldTimeMs`.
- Safe-path routing avoids impassable terrain and hostile occupied intermediate tiles, but it may end on a visible hostile destination so long-range travel can start combat there without stepping through danger first.
- Intermediate hexes crossed during queued far-target travel are transit-only for automatic window behavior.
- The arrived final destination may auto-open its normal tile window behavior when queued travel ends without combat.
- Night ambushes interrupt queued travel, clear the remaining queue, and stop the player on the ambush hex.
- Movement is blocked while combat is active or when the run is over.

## Main Implementation Areas

- `src/game/state.ts`
- `src/game/world.ts`
- `src/game/hex.ts`
- `src/ui/world/renderScene.ts`
- `src/app/App/usePixiWorld.ts`
