# Persistence And Save Compatibility

## Scope

This spec covers browser save storage, direct hydration of the current save shape, and autosave behavior.

## Current Solution

- Saves are stored in browser IndexedDB under the `realmfall` database, using the `app-state` object store and separate `game-state-game` and `game-state-ui` keys.
- Gameplay and UI data persist as separate encrypted save areas so each area can be cleared independently without rewriting the other.
- If IndexedDB is unavailable, the encrypted save falls back to `localStorage`, and successful IndexedDB-backed loads clear the legacy `localStorage` copy after migrating it.
- Graphics, audio, and world-map settings persist separately in plain `localStorage` under dedicated area keys outside the encrypted save areas, so startup can hydrate renderer initialization inputs, the live Pixi render-FPS cap, and world-map initialization inputs before the game save finishes loading.
- The app persists snapshots with world time and UI window state while intentionally excluding transient log history from the saved payload.
- `src/persistence/storage.ts` wraps saved JSON in AES-GCM using a client-side passphrase-derived key.
- That wrapper is implementation obfuscation for local saves, not a real security boundary or meaningful client-side secret protection.
- Clearing the graphics settings area also removes the retired `realmfall-graphics-settings` key when it is present.
- Loaded saves are validated before hydration, and malformed game or UI areas are rejected independently instead of being merged straight into runtime state or blocking the other valid area from hydrating.
- Save normalization derives gameplay enum and union allowlists from shared game constants and content ids, so persistence validation tracks the canonical runtime model instead of maintaining parallel literal lists.
- Save normalization keeps `src/app/normalize.ts` as the public surface while focused helpers split gameplay payloads, combat payloads, item payloads, UI payloads, shared validators, and narrow compatibility backfills into separate modules so save-shape updates touch narrower files.
- Gameplay hydration uses the current runtime default game state as the canonical baseline, then applies valid persisted values field-by-field so additive save-shape changes do not wipe player progress.
- Missing or invalid persisted gameplay values fall back to current defaults instead of rejecting the entire gameplay save.
- The app does not depend on explicit save schema version checks for additive gameplay save evolution.
- Autosave uses a five-second debounce plus five-second interval-backed flush model.
- The five-second interval flush remains active during continuous gameplay or UI churn, so repeated sub-five-second updates persist progress without requiring a quiet period first.
- Live world time is read from the clock ref on the interval flush path, so clock-only progress can persist without cloning React `GameState` or resetting the debounce timer on every displayed tick.
- Debounce-triggered and interval-triggered autosave flushes hand off the actual snapshot build and storage write to an idle browser callback when that API exists, reducing save-path contention with active interaction.
- Gameplay and UI persistence dirtiness are tracked separately so UI-only autosave flushes build, serialize, and write only the UI save area.
- The storage layer reuses the IndexedDB connection promise and passphrase-derived CryptoKey promise across save and load calls, resetting the IndexedDB cache when a version change closes the connection.
- `useAppPersistence` keeps hydration and latest-save inputs in the hook while local `persistence/` helpers own segment assembly, serialization, dirty detection, and autosave scheduling, reducing change blast radius inside the main app persistence hook.
- Autosave scheduling tracks the latest game and UI inputs separately and only builds the persisted snapshot when a flush or manual save is actually needed, avoiding repeated full snapshot cloning during intermediate state churn.
- The app serializes persisted segments and skips redundant writes when nothing meaningful changed.
- Pending saves are coalesced while previous writes are in flight.
- Manual saves are serialized behind any in-flight autosave so older writes cannot finish later and overwrite newer explicit saves.
- Dirty tracking and the last-saved snapshot advance only after a storage write succeeds, so failed writes stay retryable on the next autosave flush or manual save.

## Main Implementation Areas

- `src/persistence/storage.ts`
- `src/persistence/saveAreas.ts`
- `src/app/normalize.ts`
- `src/app/normalizeGameState.ts`
- `src/app/normalizeCombat.ts`
- `src/app/normalizeItems.ts`
- `src/app/normalizeUiState.ts`
- `src/app/normalizeShared.ts`
- `src/app/normalizeCompatibility.ts`
- `src/app/App/useAppPersistence.ts`
- `src/app/App/persistence/saveSegments.ts`
- `src/app/App/persistence/saveScheduler.ts`
- `src/app/settingsStorage.ts`
- `src/app/audioSettings.ts`
- `src/app/graphicsSettings.ts`
- `src/app/worldMapSettings.ts`
