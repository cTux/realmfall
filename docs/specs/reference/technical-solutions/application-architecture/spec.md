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
- React controllers invoke these transitions with the current world time injected from refs.
- Shared selectors derive view-ready data without pushing gameplay logic down into windows.
- Unique items, enemies, and structures live in dedicated content files under `src/game/content`.

## Main Implementation Areas

- `src/game`
- `src/app`
- `src/ui/components`
- `src/ui/world`
