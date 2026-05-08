# World Exploration

## Scope

This spec covers deterministic hex-world traversal, visibility, and safe-path travel.

## Current Behavior

- The game world is a deterministic hex grid generated from a seed.
- The player starts at `(0, 0)` on a safe plains tile.
- The runtime now supports a persistent surface world plus persistent dungeon worlds, with one active world selected at a time.
- Terrain includes `plains`, `meadow`, `steppe`, `grove`, `forest`, `marsh`, `swamp`, `dunes`, `desert`, `badlands`, `highlands`, `mountain`, `blasted`, and `rift`.
- Dungeon worlds also use themed terrain families: `dungeon-brick-*`, `dungeon-mud-*`, and `dungeon-obsidian-*`.
- Terrain is generated in deterministic biome clusters with smoother transitions between neighboring hexes instead of independent per-tile random terrain rolls.
- `mountain`, `rift`, and dungeon wall terrain are not passable.
- The player sees a revealed radius around the current position.
- Visible tiles are rendered around the player and update as movement changes the origin.
- The world map supports pointer-wheel zoom plus click-and-drag camera panning, and zoom anchors around the pointer position instead of snapping toward screen center.
- World map camera scale and pan offsets persist in the dedicated world-map settings save area, hydrate before the Pixi world becomes interactive, and can be reset independently from the other saved settings areas.
- Home hex, claims, loot, hostile enemies, structures, and safe-path highlights are surfaced through the world view.
- Surface dungeon entrances are permanent structure landmarks and do not host surface enemies.
- The top global structure band includes rare locked chest hexes above dungeons, and their shared tile tooltip explains that the player must stand on the hex and use a lockpick or chest key.
- A mimic uses the same locked chest world marker and tooltip as an ordinary chest until the player spends an opener on that tile.
- Faction-owned town tiles use a distinct castle marker through shared structure marker resolution logic, while faction NPC claim markers continue using their separate village-style icon.
- The player marker stays visually clean on the current hex, with structure, enemy, and NPC claim marker icons suppressed on that same tile instead of stacking underneath the player icon.
- Claim borders remain visible above home, hover, loot, selection, and safe-path overlays so highlight effects do not cover territory edges.
- Manual movement is one adjacent hex at a time.
- Clicking an adjacent hostile hex stages combat in place instead of moving onto that hostile hex first, then starts the fight only after the short visual lunge completes.
- A safe-path move can route to a visible destination when a path exists.
- Clicking a farther visible hostile hex resolves the nearest reachable adjacent staging hex, paths only to that staging hex, then waits for the full arrival before the short visual lunge starts combat against the originally clicked hostile hex.
- If no reachable adjacent staging hex exists for a hostile destination, the click does not queue travel or start combat.
- Unrevealed distant world-map hexes do not trigger movement, tooltip, or pathfinding work until they fall inside the revealed travel radius.
- Missing visible frontier hexes appear immediately as unknown placeholders, cannot be entered or pathfound through until resolved, and each successful movement step starts a real-time `1000 ms` movement cooldown before the next approved step.
- Each approved movement step updates the player position immediately in state, then runs a `1000 ms` world-slide animation that moves the map behind the player while outgoing edge hexes fade away, newly visible edge hexes slide into view from the new origin, fog-of-war opacity on both transition-edge hexes and reveal-boundary hexes eases over that same `1000 ms` duration instead of flipping instantly, world markers stay anchored to their own hex instead of jumping when the transition adds, removes, or re-exposes matching icons, and the cloud layer tracks world motion at half-speed parallax without popping or disappearing after longer travel.
- Pixi preloads the current viewport plus the next movement ring's terrain and marker icon assets so enemy, structure, and loot icons do not flash in mid-transition when the player moves again before the full background icon catalog finishes warming.
- Safe-path travel auto-continues one resolved hex at a time across cooldown windows and does not advance `worldTimeMs`.
- Safe-path routing avoids impassable terrain and hostile occupied intermediate tiles. For a visible hostile destination, the queued path ends on the nearest reachable adjacent staging hex so the combat intro can begin there without stepping through danger or onto the hostile hex first.
- Intermediate hexes crossed during queued far-target travel are transit-only for automatic window behavior and do not auto-loot pass-through drops.
- Queued far-target travel may still auto-gather an intermediate resource node when the gameplay setting for automatic resource gathering is enabled.
- The arrived final destination may auto-open its normal tile window behavior when queued travel ends without combat.
- Winning a hostile-click encounter can auto-step the player from its staging hex onto the hostile destination, and that `1000 ms` follow-up move continues from the held lunge offset through the normal full-step visual duration while the normal `1000 ms` movement cooldown runs for that step.
- Night ambushes interrupt queued travel, clear the remaining queue, and stop the player on the ambush hex.
- Movement is blocked while combat is active or when the run is over.
- Entering a dungeon activates that entrance's dungeon world and places the player on the dungeon entrance tile at `(0, 0)`.
- Leaving a dungeon is only available on that dungeon entrance tile and returns the player to the owning surface entrance coordinate.

## Main Implementation Areas

- `src/game/state.ts`
- `src/game/world.ts`
- `src/game/stateDungeonActions.ts`
- `src/game/dungeons`
- `src/game/hex.ts`
- `src/ui/world/renderScene.ts`
- `src/app/App/usePixiWorld.ts`
