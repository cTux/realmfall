# React App Orchestration

## Scope

This spec covers the top-level React hook composition and derived view-model pattern.

## Current Solution

- The app splits controller concerns into focused hooks such as persistence, keyboard shortcuts, world view integration, combat automation, window transitions, and top-level controller actions.
- This reduces pressure on the top-level app component and keeps domain logic testable.
- `useAppGameView` computes the current tile, filtered logs, town stock, recipe visibility, claim status, player stats, and other UI-ready derived values.
- This keeps presentational components mostly declarative.
- The game uses a desktop-style draggable window model with persisted positions, optional per-window dimensions for resizable windows, and visibility.
- Secondary window content is separated into dedicated components and lazy-loaded bundles following the current project pattern.

## Main Implementation Areas

- `src/app/App/App.tsx`
- `src/app/App/useAppControllers.ts`
- `src/app/App/useAppGameView.ts`
- `src/app/App/useWindowTransitions.ts`
