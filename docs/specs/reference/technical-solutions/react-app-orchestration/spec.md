# React App Orchestration

## Scope

This spec covers the top-level React hook composition, Redux-backed shared state ownership, and the connected window-entry pattern used by the app shell.

## Current Solution

- The app uses Redux Toolkit for shared gameplay state and persisted shared UI state, with `src/app/store/gameSlice.ts` and `src/app/store/uiSlice.ts` as the main ownership boundaries.
- Gameplay reducers wrap the existing pure transition helpers from `src/game/state.ts` instead of moving gameplay rules into React components.
- The app still splits orchestration concerns into focused hooks such as persistence, keyboard shortcuts, world view integration, combat automation, window transitions, and top-level controller actions.
- `useAppGameView` now reads narrow Redux selectors for current-tile, combat, claim, recipe, inventory, and log-derived view data instead of building that view model from top-level local state.
- `useGameState()` is available for orchestration boundaries that truly need the full game slice, but connected component entry points remain the default store boundary for windows and similar UI containers.
- Major window folders export connected entry points from adjacent `{ComponentName}.connect.tsx` files through their root `index.ts` files, while the presentational component files remain available for Storybook and isolated tests.
- The game uses a desktop-style draggable window model with persisted positions, optional per-window dimensions for resizable windows, and visibility.
- Window positions, optional sizes, visibility, log filters, and the shared item context menu now live in Redux-managed UI state.
- `useAppPersistence` hydrates Redux state from normalized saves and persists combined gameplay and UI snapshots without rewriting identical payloads.
- Secondary window content is separated into dedicated components and lazy-loaded bundles following the current project pattern.
- Deferred window-content imports retry indefinitely when a bundle fails to load, keeping the rest of the game interactive while the affected window shell stays mounted on its loading fallback.
- Window loading fallbacks keep the spinner visible and add delayed explanatory copy when the deferred content is still unavailable after several seconds.

## Main Implementation Areas

- `src/app/App/App.tsx`
- `src/app/App/useAppControllers.ts`
- `src/app/App/useAppGameView.ts`
- `src/app/App/useAppPersistence.ts`
- `src/app/App/useWindowTransitions.ts`
- `src/app/store/store.ts`
- `src/app/store/gameSlice.ts`
- `src/app/store/uiSlice.ts`
- `src/app/store/selectors`
