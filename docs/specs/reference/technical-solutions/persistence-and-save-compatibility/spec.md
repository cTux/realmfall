# Persistence And Save Compatibility

## Scope

This spec covers browser save storage, direct hydration of the current save shape, and autosave behavior.

## Current Solution

- Saves are stored in browser IndexedDB under the `realmfall` database, using the `app-state` object store and the `game-state` key.
- Stored payloads contain both game and UI state.
- If IndexedDB is unavailable, the encrypted save falls back to `localStorage`, and successful IndexedDB-backed loads clear the legacy `localStorage` copy after migrating it.
- Non-save settings persist separately in plain `localStorage` under the `settings` key, outside the encrypted game save, so startup can hydrate renderer and world-map initialization inputs before the game save finishes loading.
- The shared `settings` payload currently carries `graphics`, `audio`, and `worldMap` sections, and section-clearing logic removes only the targeted branch while preserving the others.
- The app persists snapshots with world time and UI window state while intentionally excluding transient log history from the saved payload.
- `src/persistence/storage.ts` wraps saved JSON in AES-GCM using a client-side passphrase-derived key.
- That wrapper is implementation obfuscation for local saves, not a real security boundary or meaningful client-side secret protection.
- Legacy graphics settings from `realmfall-graphics-settings` migrate into the shared `settings` payload when current graphics settings load successfully, and clearing graphics settings also removes that retired key.
- Loaded saves are validated before hydration, and malformed game or UI slices are rejected independently instead of being merged straight into runtime state or blocking the other valid slice from hydrating.
- Save normalization derives gameplay enum and union allowlists from shared game constants and content ids, so persistence validation tracks the canonical runtime model instead of maintaining parallel literal lists.
- The current project phase does not support backward save-format compatibility; older save payloads are expected to be cleared when the runtime save shape changes.
- Autosave uses a five-second debounce plus five-second interval-backed flush model.
- The five-second interval flush remains active during continuous gameplay or UI churn, so repeated sub-five-second updates still persist progress without requiring a quiet period first.
- Debounce-triggered and interval-triggered autosave flushes hand off the actual snapshot build and storage write to an idle browser callback when that API exists, reducing save-path contention with active interaction.
- Gameplay and UI persistence dirtiness are tracked separately so UI-only changes do not rebuild the gameplay snapshot on every autosave scheduling pass.
- `useAppPersistence` keeps hydration and latest-save inputs in the hook while local `persistence/` helpers own segment assembly, serialization, dirty detection, and autosave scheduling, reducing change blast radius inside the main app persistence hook.
- Autosave scheduling tracks the latest game and UI inputs separately and only builds the persisted snapshot when a flush or manual save is actually needed, avoiding repeated full snapshot cloning during intermediate state churn.
- The app serializes persisted segments and skips redundant writes when nothing meaningful changed.
- Pending saves are coalesced while previous writes are in flight.
- Manual saves are serialized behind any in-flight autosave so older writes cannot finish later and overwrite newer explicit saves.
- Dirty tracking and the last-saved snapshot advance only after a storage write succeeds, so failed writes stay retryable on the next autosave flush or manual save.

## Main Implementation Areas

- `src/persistence/storage.ts`
- `src/app/normalize.ts`
- `src/app/App/useAppPersistence.ts`
- `src/app/App/persistence/saveSegments.ts`
- `src/app/App/persistence/saveScheduler.ts`
- `src/app/settingsStorage.ts`
- `src/app/audioSettings.ts`
- `src/app/graphicsSettings.ts`
- `src/app/worldMapSettings.ts`
