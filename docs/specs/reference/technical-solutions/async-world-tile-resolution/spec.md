# Async World Tile Resolution

## Scope

This spec covers the worker-first request and response pipeline that resolves visible world tiles outside the main thread.

## Current Solution

- `GameState.tiles` and `GameState.enemies` mirror the currently active world aliases, and the worker merge path writes through the shared active-world alias helpers instead of mutating root maps plus `worlds[...]` separately.
- The client computes the visible ring around the player and requests missing coords in batches through a `TileResolutionSource`.
- A focused `useWorldTileResolutionLifecycle` hook under `src/app/App/world/tileResolution` owns coordinator bootstrap, overlay state, active-world alias merges, visible-tile reuse, and `syncVisibleCoords` orchestration, while `usePixiWorld` consumes the resulting `visibleTilesRef` for rendering and movement transitions.
- Coordinator sync derives a narrow visible-frontier payload containing
  `bloodMoonActive`, `playerCoord`, `radius`, `seed`, and `resolvedTiles`, so
  unrelated immutable root-state clones do not retrigger the worker sync path.
- The first `TileResolutionSource` implementation uses a Vite module worker built on `easy-web-worker`.
- Stale frontier requests are canceled through `easy-cancelable-promise`, and late responses are ignored by request id.
- Visible unresolved coords render as unknown placeholders with the random-dice icon and no terrain background until their payload resolves.
- Worker failure falls back to a local synchronous source behind the same interface so the game remains playable.

## Main Implementation Areas

- `src/app/App/world/tileResolution/*`
- `src/ui/world/visibleWorldTiles.ts`
- `src/app/App/usePixiWorld.ts`
- `src/app/App/world/tileResolution/useWorldTileResolutionLifecycle.ts`
- `src/game/worldTileResolutionPayloads.ts`
