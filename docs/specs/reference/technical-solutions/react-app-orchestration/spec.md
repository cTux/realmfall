# React App Orchestration

## Scope

This spec covers the top-level React hook composition and derived view-model pattern.

## Current Solution

- The app splits controller concerns into focused hooks such as persistence, keyboard shortcuts, world view integration, combat automation, window transitions, and top-level controller actions.
- This reduces pressure on the top-level app component and keeps domain logic testable.
- Before the main app finishes loading, `src/main.tsx` renders a fixed bootstrap shell with a spinner-only loading state so the first paint stays visible without depending on translated copy.
- The bootstrap path loads the active locale before importing `App`, because some gameplay and content modules resolve translated labels during module evaluation and must not hydrate against an empty translation map.
- Bootstrap-loaded settings modules keep lightweight metadata such as voice actor ids separate from eager voice asset indexing so optional gameplay voice clips stay behind the lazy audio bridge boundary.
- `useAppGameView` computes the current tile, filtered logs, town stock, recipe visibility, claim status, player stats, and other UI-ready derived values.
- This keeps presentational components mostly declarative.
- `useAppGameView` keeps selector dependencies scoped to the gameplay slices each derived view actually reads, using narrow selector inputs instead of force-casting partial objects to `GameState`, so unrelated root-state clones do not invalidate every memoized view model together.
- `AppWindows` owns the dock-entry composition, stable move and close handler maps, and narrow window-specific view models so `App.tsx` does not keep expanding as the desktop window surface grows.
- `useAppWindowsProps` builds the nested `layout`, `views`, and `actions` payload passed to `AppWindows`, keeping `App.tsx` from rebuilding that whole prop tree inline.
- Focused hooks under `src/app/App/hooks` keep `AppWindows` centered on composition by separating deferred-window bookkeeping, stable handler maps, and memoized window-specific view models.
- `useManagedWindowProps` builds the shared `position`, `onMove`, `visible`, and `onClose` prop map for managed windows so fixed and deferred window composition does not repeat the same shell wiring at every render site.
- Fixed and deferred window composition receives narrow view and action slices instead of the full `AppWindowsProps` object, keeping unrelated window surfaces from rerendering together when one subtree changes.
- The game uses a desktop-style draggable window model with persisted positions, optional per-window dimensions for resizable windows, and visibility.
- Windows that become visible automatically take focus through the shared drag shell so newly opened panes rise and accept keyboard interaction immediately.
- Shared window-shell helpers are reused for move handlers, close handlers, deferred mount state, and repeated title-bar labels instead of maintaining parallel per-window implementations.
- `useAppControllers` routes gameplay mutations through a shared timed-transition helper so controller actions inject the current world time consistently without repeating the same wrapper at every call site.
- `useCombatAutomation` schedules the next combat step from the earliest pending combat event across actor cooldowns, cast completions, combat status-effect ticks, and effect expirations.
- The world-clock hook pauses its `requestAnimationFrame` loop while the document is hidden and resumes from a clean tick when the tab becomes visible again, avoiding idle background frame churn without desynchronizing world time.
- Window dragging and resizing keep movement local to the window shell until pointer release, which avoids pushing every pointer delta through shared app state while the interaction is still in progress.
- The shared drag shell only commits `onMove` when pointer movement or resizing actually changed geometry, so focus clicks on a window header do not trigger redundant persistence or autosave work.
- Transition hooks expose mounted-state booleans for deferred windows as mounted-state signals, not as render callbacks, so the desktop layout code can treat them as stateful visibility guards instead of ambiguous “render” flags.
- `useAppGameView` narrows derived-view dependencies to the state slices each selector actually needs, reducing recomputation from unrelated root-state clones.
- The world viewport surfaces offscreen direction indicators for the home hex and the earliest available player-claimed hex, skipping duplicate markers when both targets resolve to the same tile.
- Secondary window content is separated into dedicated components and lazy-loaded bundles following the current project pattern.
- Shared lazy-window creation goes through `createLazyWindowComponent`, keeping retrying deferred-window imports consistent instead of re-declaring the same `lazy(() => loadRetryingWindowModule(...))` wrapper in every window component.
- Deferred window-content imports retry indefinitely when a bundle fails to load, keeping the rest of the game interactive while the affected window shell stays mounted on its loading fallback. This is expected browser-delivery behavior for optional window bundles, not an accidental retry loop.
- Window loading fallbacks keep the spinner visible and add delayed explanatory copy when the deferred content is still unavailable after several seconds.
- The newest log entry types in using chunked steps on a reduced timer cadence so the flavor animation stays visible without turning each character into its own React update, and the reveal path advances by whole display graphemes instead of raw UTF-16 slices.
- The log window caches parsed timestamp, message, and display-text metadata by log entry object, keeps the typing animation state inside the animated newest row, and re-pins the list to the bottom while that row is revealing so the active entry stays visible without forcing older rows to reparse.
- The recipe book keeps large result sets behind explicit batch growth, and combat card view models snap to a short visual time step before rebuilding ability-availability data, reducing avoidable window rerenders.

## Main Implementation Areas

- `src/app/App/App.tsx`
- `src/app/App/useAppControllers.ts`
- `src/app/App/useAppGameView.ts`
- `src/app/App/hooks/useAppWindowsProps.ts`
- `src/app/App/hooks/useAppWindowHandlers.ts`
- `src/app/App/hooks/useDeferredWindows.ts`
- `src/app/App/hooks/useHexInfoView.ts`
- `src/app/App/hooks/useRecipeWindowStructure.ts`
- `src/app/App/hooks/useCombatPlayerParty.ts`
- `src/app/App/useWindowTransitions.ts`
- `src/ui/components/WindowShell.tsx`
- `src/ui/components/lazyWindowComponent.ts`
