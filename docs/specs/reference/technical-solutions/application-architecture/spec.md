# Application Architecture

## Scope

This spec covers the repository layer boundaries, state transition shape, and content organization model.

## Current Solution

- Client-side `src/*` paths below live under `packages/client/` after the monorepo split.
- `packages/client/src/game` contains gameplay and simulation rules.
- `packages/client/src/app` contains app orchestration, hydration, persistence wiring, clock wiring, and controller hooks.
- Repeated app-controller command families that only adapt gameplay transitions into UI handlers stay in focused neighbors such as `packages/client/src/app/App/hooks/gameActionHandlers/*` instead of regrowing broad orchestration hooks with hand-wired callback lists.
- `packages/client/src/ui/components` contains client-only React window components and presentational UI, while `packages/ui/src/components` contains shared reusable controls consumed through `@realmfall/ui`.
- Shared `packages/ui` controls keep UI-owned view contracts and helper logic under `packages/ui/src/game` and receive caller-derived action metadata instead of importing client `stateTypes`, app-only controller types, or gameplay config modules into the shared package implementation.
- Shared package-owned helpers for icons, tooltip placement, tooltip lines, compact formatting, and generated icon resolution live under `packages/ui/src/*` instead of re-exporting `packages/client/src/ui/*`.
- `packages/ui/src/game` does not re-export `packages/client/src/game/content/*`, and `packages/ui/src/game/boundary.test.ts` now enforces the broader `packages/ui/src/**` no-client-import boundary outside the explicit bridge modules for i18n, Storybook fixtures, and the UI audio context.
- `packages/client/src/ui/world` contains Pixi world rendering, render math, scene caches, pools, and atmosphere helpers.
- `packages/client/src/persistence` contains local save storage helpers.
- `packages/server/src` contains the server runtime entrypoint, HTTP routes, and server-only version metadata resolution.
- `packages/common/src` is reserved for cross-runtime shared code and remains empty until a client/server abstraction is genuinely shared.
- Game mutations are performed through state transition functions in `src/game/state.ts` that clone the incoming game state and return the next state.
- Save hydration enters through `src/app/normalize.ts`, while focused helpers such as `src/app/normalizeGameState.ts`, `src/app/normalizeCombat.ts`, `src/app/normalizeItems.ts`, `src/app/normalizeUiState.ts`, `src/app/normalizeShared.ts`, and `src/app/normalizeCompatibility.ts` own narrower validation and compatibility concerns.
- Read-only game creation, queries, and shared gameplay types are split across `src/game/stateFactory.ts`, `src/game/stateSelectors.ts`, and `src/game/stateTypes.ts`, which keeps UI and renderer imports off the broad mutation entrypoint.
- Gameplay type definitions now live in focused domain modules such as `src/game/abilityTypes.ts`, `src/game/combatTypes.ts`, `src/game/enemyTypes.ts`, `src/game/gameStateTypes.ts`, `src/game/itemTypes.ts`, `src/game/logTypes.ts`, `src/game/playerTypes.ts`, `src/game/recipeTypes.ts`, and `src/game/worldTypes.ts`.
- `src/game/types.ts` stays as the compatibility facade over those domain type modules, while `src/game/stateTypes.ts` remains the stable app and UI-facing facade.
- `src/game/state.ts` remains the stable mutation facade, while focused neighbors such as `src/game/stateWorldQueries.ts`, `src/game/stateRewards.ts`, `src/game/stateWorldEvents.ts`, `src/game/stateInventoryActions.ts`, and `src/game/stateItemActions.ts` own narrower gameplay responsibilities.
- `src/game/stateRewards.ts` stays as the stable reward entrypoint, while `src/game/stateRewards/gathering.ts` and `src/game/stateRewards/enemyLoot.ts` own the two main reward families behind that facade.
- Active-world and surface-world alias semantics live in `src/game/dungeons/worldState.ts`, and surface-only systems such as blood moon, harvest moon, and earthshake reuse those helpers instead of rebuilding one-off alias shims.
- Shared consumable effect descriptors live in `src/game/consumables.ts`, and both tooltip formatting plus item-use resolution consume that shared descriptor model instead of rebuilding parallel consumable-effect rules in UI and gameplay modules.
- Item, enemy, and structure content keep thin public facades under `src/game/content/**/index.ts`, with neighboring catalog, selection, and builder helpers assembling the live registries.
- Recipe requirement tables use canonical item-key helpers, while structure capability lookups derive from `src/game/content/structures` metadata so gameplay runtime code does not duplicate localized requirement names or structure-name capability branches.
- Broad gameplay families move behind dedicated folders once they outgrow a couple of neighboring files, with root-level facades preserved for stable import paths.
- Ability-definition assembly now lives under `src/game/content/abilities/*`, with `src/game/abilityCatalog.ts` and its school-specific root files kept as compatibility facades.
- Progression implementation and tests now live under `src/game/progression/*`, with `src/game/progression.ts` and the legacy helper entrypoints kept as thin re-export surfaces.
- World generation enters through `src/game/world.ts`, with deterministic tile assembly and generated-item factories split into `src/game/worldTileGeneration.ts` and `src/game/worldGeneratedItems.ts`.
- Progression, abilities, crafting, world actions, and combat each use stable public facades with focused neighboring modules for runtime details, keeping the public import surface narrower than the full implementation graph.
- Canonical runtime registries such as `LOG_KINDS`, `SKILL_NAMES`, and the app window-key lists back repeated defaults and record builders, so normalization, fixtures, and view derivation do not each keep their own hand-maintained key inventories.
- Shared claim and world-query scans cache off stable container identities such as the `tiles` map, so unrelated React updates can reuse derived world data instead of rescanning the full explored tile object.
- React controllers invoke these transitions with the current world time injected from refs.
- Shared selectors derive view-ready data without pushing gameplay logic down into windows.
- Unique items, enemies, and structures live in dedicated content files under `src/game/content`.
- Package-local setup and command notes live in `packages/client/README.md`, `packages/server/README.md`, `packages/common/README.md`, and `packages/ui/README.md`, while `docs/specs` stays canonical for cross-package technical solutions.

## Main Implementation Areas

- `packages/client/src/game`
- `packages/client/src/game/consumables.ts`
- `packages/client/src/game/stateItemActions.ts`
- `packages/client/src/game/stateFactory.ts`
- `packages/client/src/game/stateSelectors.ts`
- `packages/client/src/game/stateTypes.ts`
- `packages/client/src/app`
- `packages/client/src/ui/components`
- `packages/client/src/ui/world`
- `packages/client/src/persistence`
- `packages/ui/src/game`
- `packages/ui/src/components`
- `packages/server/src`
- `packages/common/src`
