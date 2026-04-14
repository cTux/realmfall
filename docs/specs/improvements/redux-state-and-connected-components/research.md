# Research: Redux State And Connected Components

## Observation 1: The current app keeps almost all shared state at the top of `App`

- **Finding**: `src/app/App/App.tsx` owns the main `game` state plus controller-driven UI state indirectly through `useAppControllers`, then passes a large derived view model into `AppWindows`.
- **Rationale**: `App.tsx` creates `game` with `useState`, computes derived values through `useAppGameView`, and forwards both state and handlers into `AppWindows`.
- **Planning implication**: A Redux migration can reduce root orchestration pressure, but only if selectors and dispatchable actions replace broad top-level prop assembly rather than recreating the same pattern around a global store.

## Observation 2: Prop drilling is concentrated in the window layer

- **Finding**: `src/app/App/AppWindows.tsx` is the main prop fan-out point and currently carries more than forty props spanning game state, derived state, UI state, and event handlers.
- **Rationale**: `AppWindowsProps` mixes window layout state, player and tile data, logs, combat snapshots, tooltip handlers, and item interaction callbacks before re-splitting them into individual windows.
- **Planning implication**: The most valuable first connected containers are the window entry points and other components that currently sit behind `AppWindows`.

## Observation 3: The repo already documents that `App` is overloaded

- **Finding**: `docs/PROJECT_REVIEW.md` and `docs/PROJECT_REVIEW_CODEX.md` both call out `src/app/App/App.tsx` as a large orchestration root with too much derived work attached to broad game changes.
- **Rationale**: The review docs explicitly recommend breaking more selector and orchestration load out of `App`.
- **Planning implication**: A Redux-based selector layer is aligned with already-documented improvement goals, provided the migration narrows recomputation instead of broadening it.

## Observation 4: "Move all state to Redux" needs a repo-specific boundary

- **Finding**: Some current state is appropriate for Redux, but some state is not.
- **Rationale**: `docs/RULES.md` explicitly says high-frequency pointer, hover, and world-interaction updates should stay off broad React state paths when refs or narrower state can avoid rerenders. `usePixiWorld.ts` and `useWorldClockFps.ts` also rely on DOM refs, Pixi refs, animation frame bookkeeping, and mutable timing refs that should not become Redux state.
- **Planning implication**: The migration should move durable application state and shared UI state into Redux, but keep ephemeral refs, timers, DOM handles, Pixi objects, and per-frame transient interaction state outside the store.

## Observation 5: The current gameplay model is already reducer-friendly

- **Finding**: `src/game/state.ts` exposes pure state transition helpers such as `equipItem`, `dropInventoryItem`, `interactWithStructure`, `moveToTile`, `moveAlongSafePath`, and `startCombat`.
- **Rationale**: The top-level controllers already update state with `setGame((current) => pureFunction(current, ...))`.
- **Planning implication**: Redux reducers can wrap the existing pure game transition functions instead of rewriting gameplay rules into a new mutation model immediately.

## Observation 6: Persistence and hydration should be store-driven after migration

- **Finding**: `src/app/App/useAppPersistence.ts` currently hydrates top-level React state and autosaves combined gameplay and UI snapshots.
- **Rationale**: It owns loading, normalization, window layout hydration, window visibility hydration, log filter hydration, and debounced save scheduling. After the latest master changes, `WindowPosition` also includes optional `width` and `height`, so persisted UI state now covers resizable window dimensions in addition to `x` and `y`.
- **Planning implication**: After Redux adoption, persistence should subscribe to store slices and dispatch hydration actions, while preserving the existing normalize-before-hydrate behavior and duplicate-save avoidance.

## Observation 7: Connected containers fit the existing presentational component split

- **Finding**: Most windows already have a separation between a shell component and content component, and their root exports are isolated by folder.
- **Rationale**: Components such as `InventoryWindow`, `EquipmentWindow`, `HexInfoWindow`, `RecipeBookWindow`, and `LogWindow` already expose stable folder-level entry points and explicit props interfaces.
- **Planning implication**: Adding `{ComponentName}.connect.tsx` files at component roots is a low-friction way to keep current presentational components testable while removing store knowledge from callers.

## Observation 8: A `useGameState()` hook is useful, but it should not replace all connected containers

- **Finding**: A single `useGameState()` hook can centralize selectors and dispatch helpers, but it can also recreate wide subscriptions if overused.
- **Rationale**: If `useGameState()` returns a broad object similar to the current `useAppGameView` output, many consumers will resubscribe to unrelated changes and the app will keep broad rerender behavior under a new API.
- **Planning implication**: Prefer connected components or narrow selector hooks for window entry points and feature-specific consumers. Reserve `useGameState()` for targeted, memoized, domain-scoped bundles of selectors/actions where the consumer truly needs that grouped interface.

## Recommendation Summary

- Introduce Redux Toolkit plus React Redux.
- Keep `src/game` as the source of gameplay rules and wrap existing pure transitions in reducers or thunks instead of moving gameplay logic into UI code.
- Move durable shared state to Redux:
  - gameplay state
  - persisted UI state such as window positions, window sizes, visibility, and log filters
  - stable derived selectors
  - semantic tooltip or menu state only if it meaningfully participates in React rendering
- Keep non-Redux state local or ref-based:
  - DOM refs
  - Pixi `Application` and scene refs
  - animation frame ids, debounce timers, interval handles
  - high-frequency hover/path preview refs
  - other per-frame render bookkeeping
- Replace prop-drilled component entry points with `{ComponentName}.connect.tsx` containers and root `index.ts` re-exports.
- Use a narrow `useGameState()` hook only where it improves ergonomics without widening subscriptions.
