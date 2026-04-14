# Implementation Plan: Redux State And Connected Components

**Branch**: `master` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `docs/specs/improvements/redux-state-and-connected-components/spec.md`

## Summary

Adopt Redux Toolkit as the source of truth for shared gameplay and persisted UI state, then migrate window entry points to connected containers so `App` and `AppWindows` stop acting as the central prop router. Keep gameplay rules in `src/game`, preserve lazy-loaded windows, and explicitly keep Pixi refs, timers, DOM refs, and other hot-path transient runtime values out of Redux.

## Technical Context

**Language/Version**: TypeScript 6.x, React 18  
**Primary Dependencies**: React 18, Pixi.js 7, Redux Toolkit, React Redux  
**Storage**: Existing encrypted local persistence in `src/persistence/storage.ts`  
**Testing**: `pnpm test`, `pnpm lint`, `pnpm typecheck`, targeted app hydration and Storybook parity checks  
**Target Platform**: Browser client  
**Project Type**: Web application with Pixi world rendering and React window UI  
**Performance Goals**: Reduce broad React rerenders from root-level prop drilling without moving high-frequency world interaction into Redux  
**Constraints**: Preserve save normalization; preserve lazy-loaded secondary windows; keep `src/game` as gameplay source of truth; do not push Pixi/DOM/timer refs into Redux  
**Scale/Scope**: App bootstrap, app orchestration hooks, persistence wiring, window entry points, and shared selectors

## Constitution Check

_GATE: Must pass before implementation. Re-check after store design._

- `docs/RULES.md` Architecture: keep gameplay in `src/game`, React orchestration in `src/app`, and avoid adding more responsibility to `src/app/App/App.tsx`.
- `docs/RULES.md` React UI: keep heavy app coordination in dedicated hooks, preserve lazy loading for secondary windows, and maintain Storybook coverage expectations.
- `docs/RULES.md` Persistence: preserve normalize-before-hydrate and avoid rewriting identical save payloads when persisted data has not meaningfully changed.
- `docs/RULES.md` Pixi And Performance: keep high-frequency pointer and world interaction off broad shared state paths where refs or invalidation flags are sufficient.

Gate result: Pass, provided the migration defines a strict boundary between Redux-owned shared state and ref-owned runtime state.

## Project Structure

### Documentation

```text
docs/specs/improvements/redux-state-and-connected-components/
|- research.md
|- spec.md
`- plan.md
```

### Proposed Source Structure

```text
src/app/store/
|- store.ts
|- hooks.ts
|- gameSlice.ts
|- uiSlice.ts
|- selectors/
|  |- gameSelectors.ts
|  `- uiSelectors.ts
`- actions/

src/ui/components/<ComponentName>/
|- <ComponentName>.tsx
|- <ComponentName>.connect.tsx
`- index.ts
```

**Structure Decision**: Add store-specific code under `src/app/store` and preserve existing component folders by layering connected entry points on top of current presentational components.

## Phase 0: Design Decisions

### Decision 1: Use Redux Toolkit, not manual Redux wiring

- **Decision**: Build the store with Redux Toolkit and typed hooks.
- **Rationale**: The repo is already TypeScript-heavy and benefits from a small, opinionated store surface.
- **Alternatives considered**: Manual Redux setup was rejected as unnecessary boilerplate for this migration.

### Decision 2: Wrap existing pure gameplay transitions inside reducers or thunks

- **Decision**: Reuse functions from `src/game/state.ts` as the implementation of Redux state transitions where practical.
- **Rationale**: The existing controller layer already treats gameplay mutations as pure state-to-state transformations.
- **Alternatives considered**: Rewriting gameplay rules directly into slice reducers was rejected because it duplicates established domain logic and raises migration risk.

### Decision 3: Connected component roots are the default store boundary for windows

- **Decision**: Add `{ComponentName}.connect.tsx` files at component roots and re-export connected variants from each root `index.ts`.
- **Rationale**: This removes prop drilling while preserving presentational components for Storybook and isolated tests.
- **Alternatives considered**: Connecting everything in `AppWindows` was rejected because it only moves the prop fan-out point instead of removing it.

### Decision 4: `useGameState()` is optional and must stay narrow

- **Decision**: Allow `useGameState()` only when it returns a domain-scoped bundle of selectors/actions with a clear consumer boundary.
- **Rationale**: A broad "grab the game state" hook would recreate the same rerender problems under a new abstraction.
- **Alternatives considered**: Making `useGameState()` the default API for all consumers was rejected because it encourages oversized subscriptions.

## Phase 1: Foundation

1. Add `@reduxjs/toolkit` and `react-redux`.
2. Introduce `src/app/store/store.ts` and typed hooks such as `useAppDispatch` and `useAppSelector`.
3. Wrap the app root in a Redux provider in `src/main.tsx`.
4. Create initial `gameSlice` and `uiSlice` boundaries.
5. Move default window/layout/filter state definitions into store-owned initial state where appropriate.

## Phase 2: Persistence And Hydration

1. Refactor `useAppPersistence` so it hydrates the Redux store instead of top-level React state.
2. Preserve `normalizeLoadedGame` before dispatching hydrated data.
3. Keep debounced autosave behavior and identical-snapshot suppression.
4. Split persisted snapshot assembly by slice so gameplay and persisted UI can remain explicit.
5. Verify rehydration preserves current save compatibility.

## Phase 3: Gameplay Action Migration

1. Convert controller callbacks in `useAppControllers` into dispatchers over slice actions and thunks.
2. Reuse existing `src/game/state.ts` transition helpers inside the store layer.
3. Keep `worldTimeMs` handling explicit so current `worldTimeMsRef.current` semantics are preserved or cleanly redesigned.
4. Move stable shared UI state from `useAppControllers` into Redux:
   - window positions
   - window sizes
   - window visibility
   - log filters
   - item context menu if it remains shared React UI state
5. Leave non-serializable runtime refs outside the store.

## Phase 4: Connected Window Migration

1. Start with the highest-value window containers:
   - `HexInfoWindow`
   - `InventoryWindow`
   - `EquipmentWindow`
   - `RecipeBookWindow`
   - `LogWindow`
   - `LootWindow`
   - `CombatWindow`
2. Add `{ComponentName}.connect.tsx` for each migrated window.
3. Update each component root `index.ts` to export `ComponentNameConnected as ComponentName`.
4. Keep the underlying presentational component props small and Storybook-friendly.
5. Shrink `AppWindows` toward layout, lazy-loading, and a small set of non-store runtime props only.

## Phase 5: Selector Strategy

1. Create narrow selectors under `src/app/store/selectors`.
2. Extract domain selectors for:
   - player stats
   - current tile and claim state
   - inventory counts
   - town stock and gold
   - combat snapshot
   - filtered logs
3. Prefer selector composition over one large "view model" selector object.
4. Introduce `useGameState()` only if a concrete feature boundary benefits from a grouped interface.
5. Document and enforce that `useGameState()` should never return the entire store-derived app view model.

## Phase 6: Cleanup

1. Remove obsolete root-level state from `App.tsx`.
2. Simplify or delete `useAppGameView` once selectors replace its role.
3. Reduce `useAppControllers` to runtime-only concerns that truly belong outside Redux.
4. Reassess whether `AppWindows` is still necessary in its current form or should become a thinner layout coordinator.
5. Update or add the corresponding reference technical-solution spec once the migration is implemented.

## Verification Plan

1. Run `pnpm typecheck`.
2. Run `pnpm test`.
3. Run `pnpm lint`.
4. Verify saved-game hydration and autosave still behave correctly.
5. Verify secondary windows remain lazy-loaded in the production build.
6. Verify Storybook stories still target the presentational components cleanly.
7. Profile or inspect rerender behavior around window dragging and common inventory/hex interactions to confirm the migration reduces broad React churn rather than moving it elsewhere.

## Risks And Mitigations

- **Risk**: A naive Redux migration broadens subscriptions and worsens rerender cost.
  **Mitigation**: Use narrow selectors and connected entry points instead of broad aggregated hooks.

- **Risk**: Persisted save behavior regresses during hydration refactors.
  **Mitigation**: Preserve `normalizeLoadedGame`, keep current snapshot shape explicit, and add regression coverage around hydration.

- **Risk**: Window lazy loading regresses when connected components are introduced.
  **Mitigation**: Keep connected files colocated with the lazy-loaded module boundary instead of pulling heavy imports into the root app path.

- **Risk**: Contributors interpret the migration as a mandate to put all runtime state in Redux.
  **Mitigation**: Document a strict boundary that excludes refs, timers, Pixi objects, and pointer-hot-path transient state.

- **Risk**: Storybook becomes harder to use if presentational components disappear behind connected exports.
  **Mitigation**: Keep unconnected presentational components exported by filename and let stories target those directly.

## Recommended `useGameState()` Policy

- Use connected components by default when the component root exists mainly to bind store data and actions to a presentational component.
- Use `useGameState()` only for narrow feature hooks or orchestration helpers that need a stable, cohesive subset of selectors and actions.
- Do not use `useGameState()` as a convenience wrapper that returns the full game state or the full app view model.
- If a hook would subscribe to many unrelated domains, split it into smaller selectors or multiple feature hooks instead.

## Complexity Tracking

This is a medium-to-large architectural migration. The safest path is staged adoption: store foundation first, then persistence, then controller dispatchers, then connected windows. The migration should be considered successful only if it reduces both prop drilling and rerender scope without violating the repo's Pixi/performance rules.
