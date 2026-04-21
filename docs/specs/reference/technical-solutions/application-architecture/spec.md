# Application Architecture

## Scope

This spec covers the repository layer boundaries, state transition shape, and content organization model.

## Current Solution

- `src/game` contains gameplay and simulation rules.
- `src/app` contains app orchestration, hydration, persistence wiring, clock wiring, and controller hooks.
- `src/ui/components` contains React window components and presentational UI.
- `src/ui/world` contains Pixi world rendering, render math, scene caches, pools, and atmosphere helpers.
- `src/persistence` contains local save storage helpers.
- Feature-local hooks, selectors, utilities, and tests are colocated in neighboring `hooks/`, `selectors/`, `utils/`, and `tests/` directories.
- Hooks, selectors, and utilities move to shared `src/*` directories only when multiple areas depend on the same module.
- Game mutations are performed through state transition functions in `src/game/state.ts` that clone the incoming game state and return the next state.
- Reusable world-query helpers such as tile lookup, claimed-tile lookup, and enemy lookup live in focused gameplay modules like `src/game/stateWorldQueries.ts`, while reward and event internals live in modules such as `src/game/stateRewards.ts` and `src/game/stateWorldEvents.ts`; `src/game/state.ts` re-exports or orchestrates those helpers so the public gameplay API can stay stable while the broad module surface is decomposed over time.
- Canonical runtime registries such as `LOG_KINDS`, `SKILL_NAMES`, and the app window-key lists back repeated defaults and record builders, so normalization, fixtures, and view derivation do not each keep their own hand-maintained key inventories.
- Shared claim and world-query scans cache off stable container identities such as the `tiles` map, so unrelated React updates can reuse derived world data instead of rescanning the full explored tile object.
- React controllers invoke these transitions with the current world time injected from refs.
- Shared selectors derive view-ready data without pushing gameplay logic down into windows.
- Unique items, enemies, and structures live in dedicated content files under `src/game/content`.

## Main Implementation Areas

- `src/game`
- `src/app`
- `src/ui/components`
- `src/ui/world`
