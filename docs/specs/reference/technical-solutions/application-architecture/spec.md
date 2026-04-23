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
- Save hydration keeps `src/app/normalize.ts` as a small public entrypoint while focused helpers such as `src/app/normalizeGameState.ts`, `src/app/normalizeCombat.ts`, `src/app/normalizeItems.ts`, `src/app/normalizeUiState.ts`, and `src/app/normalizeShared.ts` own narrower validation concerns.
- Read-only game creation lives in `src/game/stateFactory.ts`, read-only gameplay queries and config-backed selectors live in `src/game/stateSelectors.ts`, and shared gameplay types and registries live in `src/game/stateTypes.ts`, so UI and renderer code can avoid importing the broad mutation entrypoint when they do not need it.
- Reusable world-query helpers such as tile lookup, claimed-tile lookup, and enemy lookup live in focused gameplay modules like `src/game/stateWorldQueries.ts`, while reward and event internals live in modules such as `src/game/stateRewards.ts` and `src/game/stateWorldEvents.ts`; `src/game/state.ts` re-exports or orchestrates those helpers so the public gameplay API can stay stable while the broad module surface is decomposed over time.
- Inventory sorting, prospecting, town trading, tile-loot transfer, and item-lock mutations live in `src/game/stateInventoryActions.ts`, while shared clone/message helpers live in `src/game/stateMutationHelpers.ts`; `src/game/state.ts` re-exports those actions so callers keep the stable gameplay entrypoint.
- Item activation, equip or unequip flows, recipe-page learning, consumable use, and consumable-cooldown mutation live in `src/game/stateItemActions.ts`; `src/game/state.ts` re-exports those actions so the public API stays stable while item behavior stays isolated from the broader state facade.
- Shared consumable effect descriptors live in `src/game/consumables.ts`, and both tooltip formatting plus item-use resolution consume that shared descriptor model instead of rebuilding parallel consumable-effect rules in UI and gameplay modules.
- Item content keeps `src/game/content/items/index.ts` as the public facade while `src/game/content/items/itemCatalog.ts` assembles hydrated configs, `src/game/content/items/itemBuilders.ts` owns configured and generated item construction, and `src/game/content/items/itemClassification.ts` plus `src/game/content/items/itemCategoryRules.ts` own category and tag inference.
- Enemy and structure content keep `src/game/content/enemies/index.ts` and `src/game/content/structures/index.ts` as thin public facades while `enemyCatalog.ts` and `structureCatalog.ts` own catalog assembly, `enemySelection.ts` and `structureSelection.ts` own spawn selection, and neighboring tag-rule helpers keep taxonomy close to the owning configs.
- Home setting, territory claiming, and gather-structure interaction live in `src/game/stateWorldActions.ts`, while claim-status reads remain in `src/game/stateClaims.ts`; `src/game/state.ts` re-exports those actions so the state API can stay stable while world actions move out of the monolith.
- Deterministic world generation keeps `src/game/world.ts` as the public facade while `src/game/worldTileGeneration.ts` owns tile assembly and loot or spawn decisions, and `src/game/worldGeneratedItems.ts` owns generated-item factories reused by world and reward flows.
- Recipe-book selectors and craft-execution mutations live in `src/game/stateCrafting.ts`; `src/game/state.ts` re-exports those helpers so recipe flows stay isolated without changing the public gameplay surface.
- Combat runtime work is split between the public combat entrypoints in `src/game/stateCombat.ts`, the runtime loop facade in `src/game/stateCombatRuntime.ts`, and narrower helpers such as `src/game/stateCombatAutomationTiming.ts`, `src/game/stateCombatCasting.ts`, `src/game/stateCombatAbilityResolution.ts`, and `src/game/stateCombatEncounterSync.ts`.
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
