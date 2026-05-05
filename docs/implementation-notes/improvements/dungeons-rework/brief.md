# Dungeons Rework

This note captures the approved transient design for reworking dungeon
entrances into persistent multi-world dungeon instances with dedicated loading,
generation, and save flows.

## Goal

Turn surface dungeon hexes into permanent entrances that lead into their own
generated dungeon dimensions, keep per-entrance dungeon progress across visits,
and support themed dungeon maps with enemies, a final elite, and a closed chest
at the far end.

## Approved Decisions

- Surface dungeon hexes remain permanent `dungeon` structure landmarks.
- Surface dungeon hexes never contain enemies.
- The surface dungeon entrance does not disappear after enemies or loot are
  removed.
- Entering a dungeon starts loading immediately after the player confirms the
  action.
- Entering a dungeon uses the same fullscreen loading overlay the app shows
  during startup and world bootstrap.
- Each surface entrance owns one stable dungeon instance id.
- Re-entering the same entrance resumes the same dungeon instance.
- Leaving a dungeon returns the player to the exact surface hex where they
  entered.
- The dungeon entrance tile inside the dungeon is the default arrival tile and
  the only tile that exposes the `Leave dungeon` action.
- Death inside a dungeon respawns the player by the existing home or town flow
  and preserves the dungeon instance state.
- Dungeon clear state requires defeating a final elite guard and then looting
  the end chest.
- Cleared dungeons remain accessible and retired. Re-entering the same entrance
  loads the same emptied dungeon instead of generating a new run.
- Each dungeon contains at least `200` passable hexes.
- Each dungeon rolls one terrain theme package with several passable terrain
  variants and at least one impassable wall terrain.
- Each dungeon contains at least one closed chest generated near the end of the
  layout.
- The baseline layout family is `rooms-and-corridors`.

## Recommended Additions

- Ship multiple dungeon layout templates in v1 instead of one generator only.
- Weight `rooms-and-corridors` highest as the default family because it gives
  the cleanest combat spaces, clearer end-room placement, and easier themed
  terrain clustering.
- Include at least two additional families beside the baseline:
  - `branching-spine` for a strong main route with detours
  - `dense-maze` for a more labyrinth-heavy variant

## Architecture

- Add a world-instance layer to `GameState`.
- Keep the surface world as the default persistent overworld instance.
- Add `activeWorldId` so movement, combat, lookups, and rendering operate
  against the current world instance instead of assuming one global tile map.
- Store per-world `tiles`, `enemies`, and world-specific metadata inside a
  `worlds` registry.
- Keep shared player state, logs, progression, inventory, and broad runtime
  systems at the top level unless a system must become world-specific.
- Store lightweight dungeon routing metadata in the surface or top-level state:
  - entrance coord to dungeon id
  - current return coord for the active dungeon run
  - dungeon clear status
  - active dungeon loading state
- Store heavier dungeon-body data inside the owning dungeon world instance:
  - theme id
  - template id
  - dungeon entrance coord
  - final room or chest coord
  - final elite enemy id
  - cleared or retired flags

## Surface And Dungeon World Rules

- On the surface, dungeon entrances remain visible and actionable forever.
- Surface dungeon entrance tiles do not spawn ambient enemies, blood moon
  enemies, or other ordinary world spawns.
- Entering a dungeon switches `activeWorldId` from the surface to the entrance's
  dungeon instance.
- The dungeon entrance tile inside the dungeon remains safe and enemy-free.
- Leaving a dungeon switches `activeWorldId` back to the surface world and
  restores the recorded return coord.
- v1 does not treat the dungeon entrance tile as the player's home hex.

## Dungeon Generation

- Generate or load the dungeon immediately after the player triggers
  `Enter dungeon`, before the world switch finishes.
- Generation must be deterministic per dungeon id so the same instance can be
  reconstructed safely if only the dedicated dungeon payload is available.
- The generator should support a template registry keyed by template id rather
  than hardcoding one monolithic algorithm.
- The initial template registry should include multiple families, with
  `rooms-and-corridors` as the default-weighted baseline.
- Each generated dungeon must guarantee:
  - at least `200` passable hexes
  - one safe entrance area
  - one far-end destination room
  - one final elite guard near the end room
  - at least one closed chest near or inside the end room
  - impassable wall terrain around the playable footprint
- Theme packages should define:
  - several passable terrain ids for floor and room variation
  - at least one impassable wall terrain id
  - palette and icon hooks needed for world rendering and hover content
- v1 dungeon terrain themes affect generation, visuals, and traversal
  passability only. They do not add special movement penalties, damage, or
  buffs.

## Runtime Flow

### Enter Dungeon

- The surface hex window shows `Enter dungeon` when the player stands on a
  dungeon entrance.
- Triggering that action starts a dungeon-enter pipeline:
  - raise the fullscreen loading overlay
  - resolve the entrance's dungeon id
  - load the dedicated dungeon payload if it exists
  - otherwise generate the dungeon instance immediately
  - persist the dungeon payload
  - switch `activeWorldId`
  - place the player on the dungeon entrance coord
  - finish when the active world is ready to render
- World interaction should be blocked while this pipeline is active.

### Leave Dungeon

- The dungeon hex window shows `Leave dungeon` only on the dungeon entrance tile
  inside the dungeon world.
- Triggering `Leave dungeon` switches back to the surface world and teleports
  the player to the surface return coord recorded when they entered.

### Death Inside A Dungeon

- Dungeon death uses the existing respawn destination rules.
- Respawned players return to home or the nearest town on the surface world.
- The dungeon world is preserved exactly as it was at the time of death.
- The recorded dungeon instance remains bound to the same surface entrance.

### Clear And Retire

- The final elite must die before the dungeon can be cleared.
- Looting the end chest after the elite dies marks the dungeon as cleared.
- A cleared dungeon remains accessible, persistent, and retired.
- Re-entering a cleared dungeon loads the same emptied dungeon instead of
  generating a fresh layout, chest, or elite.

## UI And Loading

- The hex window should expose `Enter dungeon` on the surface entrance and
  `Leave dungeon` on the dungeon entrance tile inside the dungeon world.
- The same fullscreen loading screen already used for startup or Pixi bootstrap
  should cover dungeon entry until the new active world is ready.
- Deferred windows can continue using their current localized loading shells,
  but dungeon entry must use the top-level fullscreen overlay because the world
  switch is global.
- Loading failure should surface through the same top-level error path used for
  world bootstrap failures.

## Persistence

- Keep the main gameplay save segment narrow and avoid rewriting every dungeon
  payload on each autosave.
- Store dungeon registry metadata inside the main game payload.
- Store each dungeon body under a dedicated persisted key that includes the
  dungeon id, for example `game-state-dungeon-<id>`.
- Loading one dungeon entrance should read only that dungeon's dedicated payload
  plus the main game payload.
- Clearing or mutating one dungeon should rewrite that dungeon's payload and any
  changed main-game routing metadata, not every other dungeon instance.
- Save normalization must tolerate missing or malformed dungeon payloads by
  preserving the main save and regenerating the affected dungeon instance when
  the player enters that entrance again.

## Implementation Direction

- Introduce focused world-instance helpers instead of pushing more mixed logic
  into `packages/client/src/game/state.ts`.
- Keep world switching, dungeon enter or leave actions, and dungeon generation
  in focused neighboring gameplay modules.
- Keep new React loading coordination and dungeon-entry orchestration in narrow
  app hooks rather than expanding `App.tsx` or `useAppRuntime` with another
  broad inline branch.
- Update canonical shipped gameplay specs under `docs/specs` during the
  implementation task. This brief is transient and should trim down to a
  historical note once the feature ships.

## Verification Direction

- Add gameplay tests for:
  - surface dungeon tiles never spawning enemies
  - per-entrance dungeon id stability
  - enter and leave teleport behavior
  - dungeon-death recovery preserving dungeon state
  - final elite plus chest clear gating
  - cleared dungeons staying retired on re-entry
- Add generation tests for:
  - minimum passable hex count
  - entrance safety
  - end-room chest placement
  - supported template selection
  - theme terrain composition including impassable walls
- Add persistence tests for:
  - dedicated dungeon save keys
  - loading an existing dungeon instance by id
  - recovering safely when a dungeon payload is missing or malformed
- Add app or UI tests for:
  - `Enter dungeon` and `Leave dungeon` window actions
  - fullscreen loading overlay during dungeon entry
- Re-run typecheck, lint, test, and strict build-budget validation during the
  implementation task because the feature touches gameplay state, persistence,
  UI flow, and rendering.

## Canonical References

- `packages/client/src/game/types.ts`
- `packages/client/src/game/world.ts`
- `packages/client/src/game/worldTileGeneration.ts`
- `packages/client/src/game/stateMovement.ts`
- `packages/client/src/game/stateWorldActions.ts`
- `packages/client/src/game/stateWorldEvents.ts`
- `packages/client/src/game/stateWorldQueries.ts`
- `packages/client/src/app/App/useAppPersistence.ts`
- `packages/client/src/persistence/storage.ts`
- `packages/client/src/app/App/components/AppShell.tsx`
- `packages/client/src/ui/components/HexInfoWindow/`
- `docs/rules/10-architecture.md`
- `docs/rules/20-persistence.md`
- `docs/rules/30-react-ui.md`
- `docs/rules/60-testing.md`
- `docs/rules/61-documentation.md`
