# Application Architecture

## Scope

This spec covers the repository layer boundaries, state transition shape, and content organization model.

## Current Solution

- `src/game` contains gameplay and simulation rules.
- `src/app` contains app orchestration, hydration, persistence wiring, clock wiring, and controller hooks.
- `src/ui/components` contains React window components and presentational UI.
- `src/ui/world` contains Pixi world rendering, render math, scene caches, pools, and atmosphere helpers.
- `src/persistence` contains local save storage helpers.
- Game mutations are performed through state transition functions in `src/game/state.ts` that clone the incoming game state and return the next state.
- Save hydration enters through `src/app/normalize.ts`, while focused helpers such as `src/app/normalizeGameState.ts`, `src/app/normalizeCombat.ts`, `src/app/normalizeItems.ts`, `src/app/normalizeUiState.ts`, `src/app/normalizeShared.ts`, and `src/app/normalizeCompatibility.ts` own narrower validation and compatibility concerns.
- Read-only game creation, queries, and shared gameplay types are split across `src/game/stateFactory.ts`, `src/game/stateSelectors.ts`, and `src/game/stateTypes.ts`, which keeps UI and renderer imports off the broad mutation entrypoint.
- `src/game/state.ts` remains the stable mutation facade, while focused neighbors such as `src/game/stateWorldQueries.ts`, `src/game/stateRewards.ts`, `src/game/stateWorldEvents.ts`, `src/game/stateInventoryActions.ts`, and `src/game/stateItemActions.ts` own narrower gameplay responsibilities.
- Shared consumable effect descriptors live in `src/game/consumables.ts`, and both tooltip formatting plus item-use resolution consume that shared descriptor model instead of rebuilding parallel consumable-effect rules in UI and gameplay modules.
- Item, enemy, and structure content keep thin public facades under `src/game/content/**/index.ts`, with neighboring catalog, selection, and builder helpers assembling the live registries.
- World generation enters through `src/game/world.ts`, with deterministic tile assembly and generated-item factories split into `src/game/worldTileGeneration.ts` and `src/game/worldGeneratedItems.ts`.
- Progression, abilities, crafting, world actions, and combat each use stable public facades with focused neighboring modules for runtime details, keeping the public import surface narrower than the full implementation graph.
- Canonical runtime registries such as `LOG_KINDS`, `SKILL_NAMES`, and the app window-key lists back repeated defaults and record builders, so normalization, fixtures, and view derivation do not each keep their own hand-maintained key inventories.
- Shared claim and world-query scans cache off stable container identities such as the `tiles` map, so unrelated React updates can reuse derived world data instead of rescanning the full explored tile object.
- React controllers invoke these transitions with the current world time injected from refs.
- Shared selectors derive view-ready data without pushing gameplay logic down into windows.
- Unique items, enemies, and structures live in dedicated content files under `src/game/content`.

## Main Implementation Areas

- `src/game`
- `src/game/consumables.ts`
- `src/game/stateItemActions.ts`
- `src/game/stateFactory.ts`
- `src/game/stateSelectors.ts`
- `src/game/stateTypes.ts`
- `src/app`
- `src/ui/components`
- `src/ui/world`
