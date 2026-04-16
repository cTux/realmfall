# React App Orchestration

## Scope

This spec covers the top-level React hook composition and derived view-model pattern.

## Current Solution

- The app splits controller concerns into focused hooks such as persistence, keyboard shortcuts, world view integration, combat automation, window transitions, and top-level controller actions.
- This reduces pressure on the top-level app component and keeps domain logic testable.
- `useAppGameView` computes the current tile, filtered logs, town stock, recipe visibility, claim status, player stats, and other UI-ready derived values.
- This keeps presentational components mostly declarative.
- `AppWindows` owns the dock-entry composition, stable move and close handler maps, and narrow window-specific view models so `App.tsx` does not keep expanding as the desktop window surface grows.
- Focused hooks under `src/app/App/hooks` keep `AppWindows` centered on composition by separating deferred-window bookkeeping, stable handler maps, and memoized window-specific view models.
- The game uses a desktop-style draggable window model with persisted positions, optional per-window dimensions for resizable windows, and visibility.
- Windows that become visible automatically take focus through the shared drag shell so newly opened panes rise and accept keyboard interaction immediately.
- Shared window-shell helpers are reused for move handlers, close handlers, deferred mount state, and repeated title-bar labels instead of maintaining parallel per-window implementations.
- `useAppControllers` routes gameplay mutations through a shared timed-transition helper so controller actions inject the current world time consistently without repeating the same wrapper at every call site.
- Window dragging and resizing keep movement local to the window shell until pointer release, which avoids pushing every pointer delta through shared app state while the interaction is still in progress.
- The shared drag shell only commits `onMove` when pointer movement or resizing actually changed geometry, so focus clicks on a window header do not trigger redundant persistence or autosave work.
- `useAppGameView` narrows derived-view dependencies to the state slices each selector actually needs, reducing recomputation from unrelated root-state clones.
- Secondary window content is separated into dedicated components and lazy-loaded bundles following the current project pattern.
- Deferred window-content imports retry indefinitely when a bundle fails to load, keeping the rest of the game interactive while the affected window shell stays mounted on its loading fallback. This is expected browser-delivery behavior for optional window bundles, not an accidental retry loop.
- Window loading fallbacks keep the spinner visible and add delayed explanatory copy when the deferred content is still unavailable after several seconds.

## Main Implementation Areas

- `src/app/App/App.tsx`
- `src/app/App/useAppControllers.ts`
- `src/app/App/useAppGameView.ts`
- `src/app/App/hooks/useAppWindowHandlers.ts`
- `src/app/App/hooks/useDeferredWindows.ts`
- `src/app/App/hooks/useHexInfoView.ts`
- `src/app/App/hooks/useRecipeWindowStructure.ts`
- `src/app/App/hooks/useCombatPlayerParty.ts`
- `src/app/App/useWindowTransitions.ts`
- `src/ui/components/WindowShell.tsx`
- `src/ui/components/lazyWindowComponent.ts`
